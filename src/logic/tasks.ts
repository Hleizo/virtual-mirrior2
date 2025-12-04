/**
 * Task state machine with completion criteria and progress tracking
 */

import {
  assessBilateralShoulderFlexion,
  detectBackCompensation,
  calculateSway,
  getTrunkLeanAngle,
  detectOneLegStance,
  detectHeelsLifted,
  detectArmsOverhead,
  calculateFootMovement,
  assessSquatForm,
  assessGait,
  getGaitFootPositions,
  calculateGaitDisplacement,
  assessJump,
  getJumpPositions,
} from '../utils/kinematics';

export type TaskLevel = 'info' | 'warning' | 'success';

export interface TaskUpdate {
  message: string;
  level: TaskLevel;
  progress: number; // 0..1
  done?: boolean;
  metrics?: Record<string, number>;
  voiceText?: string; // Optional Arabic voice feedback
}

interface TaskHandler {
  start: () => void;
  update: (landmarks: any[]) => TaskUpdate;
  stop: () => void;
}

// ============= SHOULDER FLEXION (ARM RAISE) TASK =============
/**
 * Shoulder flexion evaluation - checks if child can raise arms overhead with proper form
 * 
 * Clinical Assessment Criteria:
 * - Shoulder flexion angle: Target ≥150° (full ROM ~180°, arm aligned with ear)
 * - Elbow extension: Target ≥170° (nearly straight arm)
 * - Back compensation: Should not arch back to achieve raise
 * 
 * Scoring (0-2 points):
 * - 2 points: Both arms achieve full overhead extension (≥150° flexion, ≥170° elbow)
 * - 1 point: One arm full raise, or partial range (90-150°), or form issues
 * - 0 points: Arms barely lift (<90°) or significant compensation
 * 
 * Reference: AAOS ROM standards - normal shoulder flexion 150-180°
 */
class RaiseHandTask implements TaskHandler {
  // Timer for holding position at full raise
  private holdStartTime: number | null = null;
  private holdDuration: number = 0;
  
  // Track best angles achieved (sample over window for best attempt)
  private maxLeftShoulderAngle: number = 0;
  private maxRightShoulderAngle: number = 0;
  private maxLeftElbowAngle: number = 0;
  private maxRightElbowAngle: number = 0;
  
  // Track compensation occurrences
  private compensationFrames: number = 0;
  private totalFrames: number = 0;

  // Constants for angle thresholds
  // Reference: Full shoulder flexion ROM is ~180° (arm overhead aligned with ear)
  private readonly FULL_FLEXION_THRESHOLD = 150; // ≥150° = near-full overhead
  private readonly PARTIAL_FLEXION_THRESHOLD = 90; // ≥90° = shoulder height
  private readonly BENT_ELBOW_THRESHOLD = 140; // <140° = significantly bent

  start(): void {
    this.holdStartTime = null;
    this.holdDuration = 0;
    this.maxLeftShoulderAngle = 0;
    this.maxRightShoulderAngle = 0;
    this.maxLeftElbowAngle = 0;
    this.maxRightElbowAngle = 0;
    this.compensationFrames = 0;
    this.totalFrames = 0;
  }

  /**
   * Calculate arm raise score (0-2 points)
   * Based on bilateral assessment and form quality
   */
  private calculateArmRaiseScore(
    leftFull: boolean,
    rightFull: boolean,
    bestShoulderAngle: number,
    compensationRatio: number
  ): number {
    // Significant compensation = deduct points
    if (compensationRatio > 0.3) {
      // If compensating more than 30% of frames, max score is 1
      if (leftFull || rightFull) return 1;
      return 0;
    }
    
    // 2 points: Both arms achieve full raise with good form
    if (leftFull && rightFull) {
      return 2;
    }
    
    // 1 point: One arm full, or both partial (≥90°)
    if (leftFull || rightFull || bestShoulderAngle >= this.PARTIAL_FLEXION_THRESHOLD) {
      return 1;
    }
    
    // 0 points: Unable to raise adequately
    return 0;
  }

  update(landmarks: any[]): TaskUpdate {
    this.totalFrames++;
    
    // Get comprehensive bilateral assessment
    const assessment = assessBilateralShoulderFlexion(landmarks);
    const {
      leftShoulderAngle,
      rightShoulderAngle,
      leftElbowAngle,
      rightElbowAngle,
      leftArmFullRaise,
      rightArmFullRaise,
      bothArmsFullRaise,
      bestShoulderAngle,
      symmetryDifference,
    } = assessment;
    
    // Check for back compensation
    const compensation = detectBackCompensation(landmarks);
    if (compensation.isCompensating) {
      this.compensationFrames++;
    }
    
    // Track maximum angles achieved (best attempt over session)
    this.maxLeftShoulderAngle = Math.max(this.maxLeftShoulderAngle, leftShoulderAngle);
    this.maxRightShoulderAngle = Math.max(this.maxRightShoulderAngle, rightShoulderAngle);
    this.maxLeftElbowAngle = Math.max(this.maxLeftElbowAngle, leftElbowAngle);
    this.maxRightElbowAngle = Math.max(this.maxRightElbowAngle, rightElbowAngle);
    
    // Progress based on best shoulder angle (target 150°)
    const progress = Math.min(bestShoulderAngle / this.FULL_FLEXION_THRESHOLD, 1);
    
    // Compensation ratio for scoring
    const compensationRatio = this.totalFrames > 0 
      ? this.compensationFrames / this.totalFrames 
      : 0;

    // === Check for significant back compensation ===
    if (compensation.compensationType === 'significant') {
      return {
        message: "Try not to lean back — just lift your arms straight up!",
        level: 'warning',
        progress: Math.max(progress - 0.1, 0),
        voiceText: 'لا تميل للخلف، ارفع يديك فقط!', // Arabic: "Don't lean back, just raise your hands!"
        metrics: {
          leftShoulderAngle,
          rightShoulderAngle,
          backLean: compensation.backLeanAngle,
        },
      };
    }

    // === Check if at least one arm at full overhead position ===
    if (leftArmFullRaise || rightArmFullRaise) {
      // Start/continue hold timer
      if (!this.holdStartTime) {
        this.holdStartTime = Date.now();
      }
      this.holdDuration = Date.now() - this.holdStartTime;

      // Require 1 second hold for completion
      if (this.holdDuration >= 1000) {
        const score = this.calculateArmRaiseScore(
          leftArmFullRaise,
          rightArmFullRaise,
          bestShoulderAngle,
          compensationRatio
        );
        
        return {
          message: 'Awesome, your arms are straight up! Perfect form! 🌟',
          level: 'success',
          progress: 1,
          done: true,
          voiceText: 'رائع! يداك مرفوعتان تماماً!', // Arabic: "Great! Your hands are fully raised!"
          metrics: {
            leftShoulderAngle: this.maxLeftShoulderAngle,
            rightShoulderAngle: this.maxRightShoulderAngle,
            leftElbowAngle: this.maxLeftElbowAngle,
            rightElbowAngle: this.maxRightElbowAngle,
            symmetryDifference,
            armRaiseScore: score,
            compensationRatio,
          },
        };
      } else {
        return {
          message: `Great! Hold it... ${(this.holdDuration / 1000).toFixed(1)}s`,
          level: 'info',
          progress,
          metrics: {
            leftShoulderAngle,
            rightShoulderAngle,
            leftElbowAngle,
            rightElbowAngle,
            holdDuration: this.holdDuration,
          },
        };
      }
    }

    // Reset hold timer if position lost
    this.holdStartTime = null;
    this.holdDuration = 0;

    // === Check for bent elbows when shoulder is high enough ===
    // (One arm case is now handled above in success condition)

    // === Check for bent elbows (common form issue) ===
    const leftElbowBent = leftElbowAngle < this.BENT_ELBOW_THRESHOLD;
    const rightElbowBent = rightElbowAngle < this.BENT_ELBOW_THRESHOLD;
    
    if ((leftElbowBent || rightElbowBent) && bestShoulderAngle >= this.PARTIAL_FLEXION_THRESHOLD) {
      return {
        message: 'Good height! Now straighten your elbows all the way!',
        level: 'info',
        progress: progress * 0.7,
        voiceText: 'افرد كوعك!', // Arabic: "Straighten your elbow!"
        metrics: {
          leftShoulderAngle,
          rightShoulderAngle,
          leftElbowAngle,
          rightElbowAngle,
        },
      };
    }

    // === Partial raise (shoulder height ~90°) ===
    if (bestShoulderAngle >= this.PARTIAL_FLEXION_THRESHOLD) {
      return {
        message: `You're close — reach higher to the sky! (${Math.round(bestShoulderAngle)}°)`,
        level: 'info',
        progress,
        voiceText: 'قربت! ارفع أعلى!', // Arabic: "Close! Raise higher!"
        metrics: {
          leftShoulderAngle,
          rightShoulderAngle,
          leftElbowAngle,
          rightElbowAngle,
        },
      };
    }

    // === Low raise - need more effort ===
    return {
      message: 'Arms up to the sky! Reach as high as you can!',
      level: 'warning',
      progress,
      voiceText: 'ارفع يديك للسماء!', // Arabic: "Raise your hands to the sky!"
      metrics: {
        leftShoulderAngle,
        rightShoulderAngle,
        leftElbowAngle,
        rightElbowAngle,
      },
    };
  }

  stop(): void {
    this.holdStartTime = null;
    this.holdDuration = 0;
  }
}

// ============= ONE LEG BALANCE TASK =============
/**
 * One-leg stance evaluation based on pediatric norms (BESS-like test)
 * 
 * Age-appropriate thresholds:
 * - Age 2-3: Target 3 seconds balance
 * - Age 4+: Target 5 seconds balance
 * 
 * Scoring (0-2 points):
 * - 2 points: Full duration without excessive sway (trunk lean < 20°)
 * - 1 point: Partial success (1-2 seconds or minor sway)
 * - 0 points: Unable to hold 1 second or immediate loss of balance
 * 
 * Sway monitoring: Trunk lean > 20° from vertical = loss of balance
 */
class OneLegTask implements TaskHandler {
  // Timer for tracking balance duration
  private balanceStartTime: number | null = null;
  
  // Previous frame landmarks for sway calculation
  private previousLandmarks: any[] | null = null;
  
  // Accumulated sway metrics
  private totalSway: number = 0;
  private swayCount: number = 0;
  
  // Track maximum trunk lean angle during stance
  private maxTrunkLean: number = 0;
  
  // Count of frames where excessive sway detected (trunk > 20°)
  private excessiveSwayFrames: number = 0;
  
  // Track which leg is lifted (for consistency)
  private liftedLeg: 'left' | 'right' | null = null;
  
  // Child's age for age-appropriate thresholds (default: 4+ years)
  private childAge: number = 5;

  /**
   * Get target balance duration based on child's age
   * - Age 2-3: 3 seconds (developmental norm)
   * - Age 4+: 5 seconds (full balance test)
   */
  private getTargetDuration(): number {
    return this.childAge <= 3 ? 3 : 5;
  }

  /**
   * Calculate one-leg balance score (0-2 points)
   * Based on duration held and sway quality
   */
  private calculateOneLegScore(
    holdTime: number,
    avgTrunkLean: number,
    excessiveSwayRatio: number
  ): number {
    const targetDuration = this.getTargetDuration();
    const EXCESSIVE_SWAY_THRESHOLD = 20; // degrees from vertical
    
    // 2 points: Full duration with minimal sway
    if (holdTime >= targetDuration && avgTrunkLean < EXCESSIVE_SWAY_THRESHOLD && excessiveSwayRatio < 0.1) {
      return 2;
    }
    
    // 1 point: Partial success (met some criteria)
    if (holdTime >= 1 && (holdTime >= targetDuration * 0.5 || avgTrunkLean < EXCESSIVE_SWAY_THRESHOLD * 1.5)) {
      return 1;
    }
    
    // 0 points: Unable to maintain balance
    return 0;
  }

  start(): void {
    this.balanceStartTime = null;
    this.previousLandmarks = null;
    this.totalSway = 0;
    this.swayCount = 0;
    this.maxTrunkLean = 0;
    this.excessiveSwayFrames = 0;
    this.liftedLeg = null;
  }

  /**
   * Set child's age for age-appropriate thresholds
   */
  setAge(age: number): void {
    this.childAge = age;
  }

  update(landmarks: any[]): TaskUpdate {
    // Detect one-leg stance using knee flexion and ankle position
    const stanceResult = detectOneLegStance(landmarks);
    const { isOneLegStance, liftedLeg } = stanceResult;
    
    // Calculate trunk lean angle (sway from vertical)
    const trunkLeanAngle = getTrunkLeanAngle(landmarks);
    
    // Calculate frame-to-frame sway
    const frameSway = this.previousLandmarks
      ? calculateSway(landmarks, this.previousLandmarks)
      : 0;
    this.previousLandmarks = landmarks;

    // Accumulate sway metrics
    if (frameSway > 0) {
      this.totalSway += frameSway;
      this.swayCount++;
    }

    // Track maximum trunk lean
    this.maxTrunkLean = Math.max(this.maxTrunkLean, trunkLeanAngle);

    // Constants for thresholds
    const EXCESSIVE_SWAY_THRESHOLD = 20; // degrees - trunk lean beyond this = loss of balance
    const targetDuration = this.getTargetDuration();

    // Check if child has lifted one foot
    if (!isOneLegStance) {
      // Reset timer if foot dropped
      if (this.balanceStartTime !== null) {
        // Foot was up but now down - provide encouraging feedback
        this.balanceStartTime = null;
        return {
          message: 'Try to hold your foot up longer! You can do it!',
          level: 'warning',
          progress: 0,
          voiceText: 'حاول رفع قدمك أطول! يمكنك فعلها!', // Arabic: "Try to lift your foot longer! You can do it!"
          metrics: { 
            trunkLean: trunkLeanAngle,
            holdTime: 0,
          },
        };
      }
      return {
        message: 'Lift one foot off the ground',
        level: 'warning',
        progress: 0,
        metrics: { 
          trunkLean: trunkLeanAngle,
          holdTime: 0,
        },
      };
    }

    // Track which leg is lifted (use first detection for consistency)
    if (!this.liftedLeg) {
      this.liftedLeg = liftedLeg;
    }

    // Start balance timer when foot is first lifted
    if (!this.balanceStartTime) {
      this.balanceStartTime = Date.now();
    }

    // Calculate hold time
    const holdTime = (Date.now() - this.balanceStartTime) / 1000;
    const progress = Math.min(holdTime / (targetDuration + 2), 1); // +2 for visual buffer

    // Check for excessive trunk sway (> 20° from vertical)
    const isExcessiveSway = trunkLeanAngle > EXCESSIVE_SWAY_THRESHOLD;
    if (isExcessiveSway) {
      this.excessiveSwayFrames++;
    }

    // Calculate average sway and excessive sway ratio
    const avgSway = this.swayCount > 0 ? this.totalSway / this.swayCount : 0;
    const totalFrames = this.swayCount || 1;
    const excessiveSwayRatio = this.excessiveSwayFrames / totalFrames;

    // Check for task completion (met target duration)
    if (holdTime >= targetDuration) {
      const oneLegScore = this.calculateOneLegScore(holdTime, this.maxTrunkLean, excessiveSwayRatio);
      
      // Determine feedback based on score
      let message: string;
      let voiceText: string;
      
      if (oneLegScore === 2) {
        message = 'Great balance! Perfect form!';
        voiceText = 'رائع! توازن ممتاز!'; // Arabic: "Great! Excellent balance!"
      } else if (oneLegScore === 1) {
        message = 'Good job! Keep practicing for steadier balance.';
        voiceText = 'أحسنت! استمر في التدريب'; // Arabic: "Well done! Keep practicing"
      } else {
        message = 'Good effort! Try to sway less next time.';
        voiceText = 'جهد جيد! حاول الثبات أكثر'; // Arabic: "Good effort! Try to be steadier"
      }

      return {
        message,
        level: 'success',
        progress: 1,
        done: true,
        voiceText,
        metrics: {
          holdTime,
          swayIndex: avgSway,
          maxTrunkLean: this.maxTrunkLean,
          oneLegScore,
          excessiveSwayRatio,
          liftedLeg: this.liftedLeg === 'left' ? 0 : 1,
        },
      };
    }

    // During balance - provide real-time feedback
    if (isExcessiveSway) {
      // Trunk lean > 20° - warn about wobbling
      return {
        message: `Keep steady! Lean: ${trunkLeanAngle.toFixed(0)}° (${holdTime.toFixed(1)}s)`,
        level: 'warning',
        progress,
        voiceText: 'اثبت مكانك!', // Arabic: "Hold your position!"
        metrics: {
          holdTime,
          currentSway: frameSway,
          trunkLean: trunkLeanAngle,
        },
      };
    } else if (trunkLeanAngle > 10) {
      // Minor sway (10-20°) - encourage but note the sway
      return {
        message: `Good! Stay steady... ${holdTime.toFixed(1)}s / ${targetDuration}s`,
        level: 'info',
        progress,
        metrics: {
          holdTime,
          currentSway: frameSway,
          trunkLean: trunkLeanAngle,
        },
      };
    } else {
      // Excellent stability (< 10° lean)
      return {
        message: `Excellent balance! ${holdTime.toFixed(1)}s / ${targetDuration}s`,
        level: 'info',
        progress,
        metrics: {
          holdTime,
          currentSway: frameSway,
          trunkLean: trunkLeanAngle,
        },
      };
    }
  }

  stop(): void {
    this.balanceStartTime = null;
    this.previousLandmarks = null;
    this.liftedLeg = null;
  }
}

// ============= WALK TASK =============
// ============= WALK TASK (GMFM-Based Gait Assessment) =============
/**
 * Walking gait evaluation based on GMFM (Gross Motor Function Measure) criteria
 * 
 * GMFM Walking Tasks Reference:
 * - Item 69: Walks forward 10 steps
 * - Item 70: Walks forward 10 steps with arms free (relaxed)
 * - Item 71: Walks forward 10 steps, stops, turns 180°
 * 
 * Step Detection Algorithm:
 * 1. Track ankle y-positions for both feet
 * 2. A step is detected when one foot lifts (ankle y decreases = rises)
 *    while the other foot stays planted (ankle y remains high = on ground)
 * 3. Knee flexion increases during swing phase (bent knee = foot clearing ground)
 * 4. Step completes when lifted foot returns to ground
 * 
 * Gait Quality Assessment:
 * - Trunk stability: Check for excessive lateral sway (>15° = unstable)
 * - Arm position: Toddlers may use "high guard" arms, older children have relaxed arms
 * - Step alternation: Proper gait alternates left-right-left-right
 * - Forward displacement: Confirm actual forward movement, not marching in place
 * 
 * Scoring (0-2 points):
 * - 2 points: Walks target steps (10) independently without loss of balance
 * - 1 point: Takes some steps but loses balance, stops, or needs brief support
 * - 0 points: Cannot take independent steps (falls or refuses)
 * 
 * Age Adjustments:
 * - 2-year-old: 5 steps may earn full score (walking just mastered)
 * - 4+ years: Should easily complete 10 steps
 */
class WalkTask implements TaskHandler {
  // Step tracking variables
  private stepCount: number = 0;
  private lastStepFoot: 'left' | 'right' | null = null;
  private alternatingStepCount: number = 0; // Counts properly alternating steps
  
  // Previous frame positions for step detection
  private previousPositions: ReturnType<typeof getGaitFootPositions> | null = null;
  
  // Starting position for displacement calculation
  private startHipX: number | null = null;
  
  // Gait quality tracking
  private trunkSwayFrames: number = 0; // Frames with excessive sway
  private totalFrames: number = 0;
  private maxTrunkSway: number = 0;
  private armsInHighGuardFrames: number = 0;
  
  // Step timing for debounce
  private lastStepTime: number = 0;
  private readonly STEP_COOLDOWN_MS = 300; // Minimum time between steps (prevents double-counting)
  
  // Amplitude tracking for symmetry calculation
  private leftStepAmplitudes: number[] = [];
  private rightStepAmplitudes: number[] = [];
  
  // Target steps (GMFM standard: 10 steps)
  private readonly TARGET_STEPS = 10;
  private readonly MIN_STEPS_FOR_PARTIAL = 3; // Minimum for 1 point
  
  // Balance loss detection
  private balanceLossCount: number = 0;
  private consecutiveUnstableFrames: number = 0;

  start(): void {
    this.stepCount = 0;
    this.lastStepFoot = null;
    this.alternatingStepCount = 0;
    this.previousPositions = null;
    this.startHipX = null;
    this.trunkSwayFrames = 0;
    this.totalFrames = 0;
    this.maxTrunkSway = 0;
    this.armsInHighGuardFrames = 0;
    this.lastStepTime = 0;
    this.leftStepAmplitudes = [];
    this.rightStepAmplitudes = [];
    this.balanceLossCount = 0;
    this.consecutiveUnstableFrames = 0;
  }

  /**
   * Calculate walking score based on GMFM criteria
   * 
   * Scoring Logic:
   * - 2 points: ≥ TARGET_STEPS with good balance (< 20% unstable frames)
   * - 1 point: ≥ MIN_STEPS or ≥ TARGET_STEPS with poor balance
   * - 0 points: < MIN_STEPS or significant balance issues
   */
  private calculateWalkScore(): 0 | 1 | 2 {
    const unstableRatio = this.totalFrames > 0 ? this.trunkSwayFrames / this.totalFrames : 0;
    const hasGoodBalance = unstableRatio < 0.2 && this.balanceLossCount < 3;
    
    if (this.stepCount >= this.TARGET_STEPS && hasGoodBalance) {
      return 2; // Full score: target steps with good balance
    } else if (this.stepCount >= this.MIN_STEPS_FOR_PARTIAL || 
               (this.stepCount >= this.TARGET_STEPS && !hasGoodBalance)) {
      return 1; // Partial score: some steps or target steps with balance issues
    }
    return 0; // Unable to walk independently
  }

  /**
   * Calculate gait symmetry percentage from step amplitudes
   * 
   * Symmetry = 100 - (asymmetry percentage)
   * Asymmetry = |leftAvg - rightAvg| / max(leftAvg, rightAvg) * 100
   */
  private calculateSymmetry(): number {
    if (this.leftStepAmplitudes.length === 0 || this.rightStepAmplitudes.length === 0) {
      return 100; // Default to perfect if not enough data
    }
    
    const avgLeft = this.leftStepAmplitudes.reduce((a, b) => a + b, 0) / this.leftStepAmplitudes.length;
    const avgRight = this.rightStepAmplitudes.reduce((a, b) => a + b, 0) / this.rightStepAmplitudes.length;
    
    if (Math.max(avgLeft, avgRight) < 0.001) return 100; // Avoid division by zero
    
    const asymmetry = Math.abs(avgLeft - avgRight) / Math.max(avgLeft, avgRight);
    return Math.max(0, Math.min(100, (1 - asymmetry) * 100));
  }

  update(landmarks: any[]): TaskUpdate {
    this.totalFrames++;
    const now = Date.now();
    
    // Get comprehensive gait assessment
    const gait = assessGait(landmarks, this.previousPositions, this.lastStepFoot);
    const { currentPositions, leftStep, rightStep, trunkSway, armPosition, stepDetected, isAlternatingSteps } = gait;
    
    // Initialize start position for displacement tracking
    if (this.startHipX === null && currentPositions.valid) {
      this.startHipX = currentPositions.hipCenterX;
    }
    
    // Update previous positions for next frame
    this.previousPositions = currentPositions;
    
    // Visibility check
    if (!currentPositions.valid) {
      return {
        message: 'Step into view',
        level: 'warning',
        progress: 0,
        voiceText: 'امش بشكل طبيعي', // Arabic: "Walk naturally"
      };
    }
    
    // Track trunk sway for balance assessment
    if (!trunkSway.isStable) {
      this.trunkSwayFrames++;
      this.consecutiveUnstableFrames++;
      
      // Detect significant balance loss (5+ consecutive unstable frames)
      if (this.consecutiveUnstableFrames >= 5) {
        this.balanceLossCount++;
        this.consecutiveUnstableFrames = 0;
      }
    } else {
      this.consecutiveUnstableFrames = 0;
    }
    
    // Track maximum trunk sway
    if (trunkSway.lateralSway > this.maxTrunkSway) {
      this.maxTrunkSway = trunkSway.lateralSway;
    }
    
    // Track arm position (high guard vs relaxed)
    if (armPosition.armsInHighGuard) {
      this.armsInHighGuardFrames++;
    }
    
    // Step detection with cooldown to prevent double-counting
    if (stepDetected && now - this.lastStepTime >= this.STEP_COOLDOWN_MS) {
      this.lastStepTime = now;
      this.stepCount++;
      
      // Track step amplitude for symmetry
      const stepAmplitude = stepDetected === 'left' 
        ? leftStep.liftAmount 
        : rightStep.liftAmount;
      
      if (stepDetected === 'left') {
        this.leftStepAmplitudes.push(stepAmplitude);
      } else {
        this.rightStepAmplitudes.push(stepAmplitude);
      }
      
      // Count alternating steps (proper gait pattern)
      if (isAlternatingSteps || this.lastStepFoot === null) {
        this.alternatingStepCount++;
      }
      
      this.lastStepFoot = stepDetected;
    }
    
    // Calculate displacement from starting position
    const displacement = this.startHipX !== null 
      ? calculateGaitDisplacement(currentPositions.hipCenterX, this.startHipX)
      : { displacement: 0, direction: 'stationary' as const, hasSignificantMovement: false };
    
    const progress = Math.min(this.stepCount / this.TARGET_STEPS, 1);
    const symmetryPercent = Math.round(this.calculateSymmetry());
    
    // === Task completion check ===
    if (this.stepCount >= this.TARGET_STEPS) {
      const walkScore = this.calculateWalkScore();
      const highGuardRatio = this.armsInHighGuardFrames / Math.max(this.totalFrames, 1);
      
      // Success feedback based on quality
      let successMessage = 'You walked so well! 🌟';
      let voiceText = 'رائع! مشيت ممتاز!'; // Arabic: "Great! You walked excellently!"
      
      if (walkScore < 2) {
        successMessage = 'Good try – let\'s practice walking forward!';
        voiceText = 'محاولة جيدة! هيا نتدرب أكثر!'; // Arabic: "Good try! Let's practice more!"
      }
      
      return {
        message: successMessage,
        level: 'success',
        progress: 1,
        done: true,
        voiceText,
        metrics: {
          walkScore,
          stepCount: this.stepCount,
          alternatingSteps: this.alternatingStepCount,
          symmetryPercent,
          maxTrunkSway: Math.round(this.maxTrunkSway),
          balanceLossCount: this.balanceLossCount,
          armsInHighGuardPercent: Math.round(highGuardRatio * 100),
          forwardDisplacement: Math.round(displacement.displacement * 100), // As percentage of frame width
        },
      };
    }
    
    // === Active walking feedback ===
    
    // Check for balance issues during walking
    if (trunkSway.swayLevel === 'excessive') {
      return {
        message: 'That\'s okay, take your time and stay steady!',
        level: 'warning',
        progress,
        voiceText: 'لا بأس، امشِ ببطء!', // Arabic: "That's okay, walk slowly!"
        metrics: {
          stepCount: this.stepCount,
          trunkSway: Math.round(trunkSway.lateralSway),
        },
      };
    }
    
    // Encourage walking when foot is lifted (mid-step)
    if (leftStep.isSwinging || rightStep.isSwinging) {
      return {
        message: `Keep going! (${this.stepCount}/${this.TARGET_STEPS} steps)`,
        level: 'info',
        progress,
        metrics: {
          stepCount: this.stepCount,
          symmetryPercent,
          isLeftLegSwinging: leftStep.isSwinging ? 1 : 0,
        },
      };
    }
    
    // Encourage forward movement if standing still
    if (this.stepCount === 0 && this.totalFrames > 30) {
      return {
        message: 'Walk forward – one foot in front of the other! 🚶',
        level: 'info',
        progress: 0,
        voiceText: 'امشِ للأمام!', // Arabic: "Walk forward!"
        metrics: {
          stepCount: 0,
        },
      };
    }
    
    // Default progress feedback
    return {
      message: `Walk naturally (${this.stepCount}/${this.TARGET_STEPS} steps)`,
      level: 'info',
      progress,
      metrics: {
        stepCount: this.stepCount,
        symmetryPercent,
        trunkSway: Math.round(trunkSway.lateralSway),
      },
    };
  }

  stop(): void {
    this.stepCount = 0;
    this.lastStepFoot = null;
    this.previousPositions = null;
    this.leftStepAmplitudes = [];
    this.rightStepAmplitudes = [];
  }
}

// ============= JUMP TASK (GMFM-Based Jump Assessment) =============
/**
 * Jumping evaluation based on GMFM (Gross Motor Function Measure) criteria
 * Checks if child can jump with both feet off ground and land stably
 * 
 * GMFM Jump Criteria:
 * - Item 79: Jumps with two feet simultaneously
 * - Item 81: Jumps forward 30cm
 * - Item 82: Jumps over obstacle with two feet
 * 
 * Jump Detection Algorithm:
 * 1. Detect preparation (crouch): Knees bend, CoM lowers
 * 2. Detect takeoff: Both ankles rise simultaneously, knees extend
 * 3. Detect airborne: Both feet clearly off ground, CoM at peak
 * 4. Detect landing: Both feet return to ground together
 * 
 * Two-Footed Jump Detection:
 * - Both ankles must rise within similar timeframe (simultaneous)
 * - Ankle height asymmetry < 3% indicates proper two-footed takeoff
 * - "Gallop" or "step-jump" detected when one foot leaves first
 * 
 * Jump Quality Assessment:
 * - Takeoff quality: Two-footed vs asymmetric
 * - Jump height: CoM elevation during airborne phase
 * - Landing quality: Stable (knees absorb) vs unstable (stiff)
 * 
 * Scoring (0-2 points):
 * - 2 points: Two-footed takeoff AND two-footed stable landing
 * - 1 point: Attempts jump but one-footed takeoff/landing OR stumbles
 * - 0 points: Cannot achieve airborne phase with both feet
 * 
 * Note: Camera should capture full body including feet for accurate detection
 */
class JumpTask implements TaskHandler {
  // Baseline positions (established when standing still)
  private baselineAnkleY: number = 0;
  private baselineComY: number = 0;
  private baselineEstablished: boolean = false;
  private baselineFrames: number = 0;
  
  // Previous frame positions for velocity calculation
  private previousPositions: ReturnType<typeof getJumpPositions> | null = null;
  
  // Jump state tracking
  private jumpPhase: 'standing' | 'crouching' | 'takeoff' | 'airborne' | 'landing' | 'complete' = 'standing';
  private wasAirborne: boolean = false;
  
  // Jump metrics
  private maxJumpHeight: number = 0;
  private takeoffWasTwoFooted: boolean = false;
  private landingWasTwoFooted: boolean = false;
  private landingWasStable: boolean = false;
  
  // Frame counters
  private airborneFrameCount: number = 0;
  private totalFrames: number = 0;
  
  // Child height for normalization (optional)
  private childHeightCm: number | null = null;
  
  // Minimum airborne frames to count as valid jump
  private readonly MIN_AIRBORNE_FRAMES = 3;

  constructor(childHeightCm?: number) {
    this.childHeightCm = childHeightCm || null;
  }

  start(): void {
    this.baselineAnkleY = 0;
    this.baselineComY = 0;
    this.baselineEstablished = false;
    this.baselineFrames = 0;
    this.previousPositions = null;
    this.jumpPhase = 'standing';
    this.wasAirborne = false;
    this.maxJumpHeight = 0;
    this.takeoffWasTwoFooted = false;
    this.landingWasTwoFooted = false;
    this.landingWasStable = false;
    this.airborneFrameCount = 0;
    this.totalFrames = 0;
  }

  /**
   * Calculate jump score based on GMFM criteria
   * 
   * Scoring Logic:
   * - 2 points: Both takeoff AND landing are two-footed, with stable landing
   * - 1 point: Achieved airborne but asymmetric takeoff/landing or unstable
   * - 0 points: Could not achieve proper airborne phase
   */
  private calculateJumpScore(): 0 | 1 | 2 {
    // Must have been airborne for minimum frames
    if (this.airborneFrameCount < this.MIN_AIRBORNE_FRAMES) {
      return 0;
    }
    
    // Perfect score: two-footed takeoff + two-footed stable landing
    if (this.takeoffWasTwoFooted && this.landingWasTwoFooted && this.landingWasStable) {
      return 2;
    }
    
    // Partial score: achieved airborne but form issues
    if (this.airborneFrameCount >= this.MIN_AIRBORNE_FRAMES) {
      return 1;
    }
    
    return 0;
  }

  update(landmarks: any[]): TaskUpdate {
    this.totalFrames++;
    
    // Get comprehensive jump assessment
    const jump = assessJump(
      landmarks,
      this.previousPositions,
      this.baselineAnkleY,
      this.baselineComY,
      this.wasAirborne
    );
    
    const { currentPositions, crouch, takeoff, airborne, landing } = jump;
    
    // Update previous positions for next frame
    this.previousPositions = currentPositions;
    
    // Visibility check
    if (!currentPositions.valid) {
      return {
        message: 'Step into view so I can see your whole body',
        level: 'warning',
        progress: 0,
        voiceText: 'قف بحيث أراك كاملاً', // Arabic: "Stand so I can see you completely"
      };
    }
    
    // === Establish baseline (first ~15 frames of standing still) ===
    if (!this.baselineEstablished) {
      this.baselineFrames++;
      
      // Accumulate baseline readings
      if (this.baselineAnkleY === 0) {
        this.baselineAnkleY = (currentPositions.leftAnkleY + currentPositions.rightAnkleY) / 2;
        this.baselineComY = currentPositions.comY;
      } else {
        // Smooth average
        const avgAnkleY = (currentPositions.leftAnkleY + currentPositions.rightAnkleY) / 2;
        this.baselineAnkleY = this.baselineAnkleY * 0.8 + avgAnkleY * 0.2;
        this.baselineComY = this.baselineComY * 0.8 + currentPositions.comY * 0.2;
      }
      
      // Baseline established after 15 frames
      if (this.baselineFrames >= 15) {
        this.baselineEstablished = true;
      }
      
      return {
        message: 'Stand still for a moment...',
        level: 'info',
        progress: 0,
        metrics: {
          baselineFrames: this.baselineFrames,
        },
      };
    }
    
    // === State machine for jump phases ===
    
    // Track if we were airborne last frame
    const wasAirbornePrevious = this.wasAirborne;
    this.wasAirborne = airborne.isAirborne;
    
    // Track maximum jump height during airborne phase
    if (airborne.isAirborne && airborne.jumpHeight > this.maxJumpHeight) {
      this.maxJumpHeight = airborne.jumpHeight;
    }
    
    // Count airborne frames
    if (airborne.isAirborne) {
      this.airborneFrameCount++;
    }
    
    // === Phase: STANDING - waiting for crouch/preparation ===
    if (this.jumpPhase === 'standing') {
      if (crouch.isCrouching) {
        this.jumpPhase = 'crouching';
      } else if (takeoff.isTakingOff) {
        // Quick jump without much crouch
        this.jumpPhase = 'takeoff';
        this.takeoffWasTwoFooted = takeoff.isTwoFooted;
      }
      
      // Encourage the child to jump
      return {
        message: 'Bend your knees and jump up like a spring! 🦘',
        level: 'info',
        progress: 0,
        voiceText: 'اثنِ ركبتيك واقفز!', // Arabic: "Bend your knees and jump!"
        metrics: {
          phase: 0, // standing
        },
      };
    }
    
    // === Phase: CROUCHING - preparation for jump ===
    if (this.jumpPhase === 'crouching') {
      if (takeoff.isTakingOff) {
        this.jumpPhase = 'takeoff';
        this.takeoffWasTwoFooted = takeoff.isTwoFooted;
      } else if (!crouch.isCrouching && !crouch.kneesBent) {
        // Stood back up without jumping
        this.jumpPhase = 'standing';
      }
      
      if (crouch.readyToJump) {
        return {
          message: 'Great crouch! Now JUMP! ⬆️',
          level: 'info',
          progress: 0.2,
          voiceText: 'جاهز! اقفز!', // Arabic: "Ready! Jump!"
          metrics: {
            phase: 1, // crouching
            kneeAngle: Math.round(crouch.avgKneeAngle),
          },
        };
      }
      
      return {
        message: 'Bend your knees more, then jump!',
        level: 'info',
        progress: 0.1,
        metrics: {
          phase: 1,
          kneeAngle: Math.round(crouch.avgKneeAngle),
        },
      };
    }
    
    // === Phase: TAKEOFF - feet leaving ground ===
    if (this.jumpPhase === 'takeoff') {
      if (airborne.isAirborne) {
        this.jumpPhase = 'airborne';
      } else if (!takeoff.isTakingOff && !airborne.bothFeetOff) {
        // Takeoff failed, back to standing
        this.jumpPhase = 'standing';
      }
      
      // Feedback on takeoff quality
      if (!takeoff.isTwoFooted && takeoff.isTakingOff) {
        return {
          message: 'Try to jump with both feet together at the same time!',
          level: 'warning',
          progress: 0.3,
          voiceText: 'اقفز بقدميك معاً!', // Arabic: "Jump with both feet together!"
          metrics: {
            phase: 2, // takeoff
            twoFooted: 0,
          },
        };
      }
      
      return {
        message: 'Jumping!',
        level: 'info',
        progress: 0.4,
        metrics: {
          phase: 2,
          twoFooted: takeoff.isTwoFooted ? 1 : 0,
        },
      };
    }
    
    // === Phase: AIRBORNE - both feet off ground ===
    if (this.jumpPhase === 'airborne') {
      if (!airborne.isAirborne && wasAirbornePrevious) {
        // Coming down - entering landing phase
        this.jumpPhase = 'landing';
      }
      
      return {
        message: 'Great! You\'re flying! 🚀',
        level: 'info',
        progress: 0.6,
        metrics: {
          phase: 3, // airborne
          jumpHeight: Math.round(airborne.jumpHeight * 1000),
          airborneFrames: this.airborneFrameCount,
        },
      };
    }
    
    // === Phase: LANDING - feet returning to ground ===
    if (this.jumpPhase === 'landing') {
      if (landing.landingComplete) {
        this.jumpPhase = 'complete';
        this.landingWasTwoFooted = landing.isTwoFootedLanding;
        this.landingWasStable = landing.landingQuality === 'stable';
      }
      
      return {
        message: 'Landing...',
        level: 'info',
        progress: 0.8,
        metrics: {
          phase: 4, // landing
        },
      };
    }
    
    // === Phase: COMPLETE - jump finished, calculate score ===
    if (this.jumpPhase === 'complete') {
      const jumpScore = this.calculateJumpScore();
      const jumpHeightNorm = Math.round(this.maxJumpHeight * 1000); // Normalized units
      
      // Calculate height in cm if child height provided
      let jumpHeightCm = 0;
      let jumpHeightPercent = 0;
      if (this.childHeightCm && this.childHeightCm > 0) {
        // Rough estimation: assume 1.0 normalized = ~2x child height in frame
        const estimatedFrameHeightCm = this.childHeightCm * 2;
        jumpHeightCm = this.maxJumpHeight * estimatedFrameHeightCm;
        jumpHeightPercent = (jumpHeightCm / this.childHeightCm) * 100;
      }
      
      // Success messages based on score
      let message = '';
      let voiceText = '';
      
      if (jumpScore === 2) {
        message = 'Wow, you jumped so high! Perfect two-footed jump! 🌟';
        voiceText = 'رائع! قفزت عالياً!'; // Arabic: "Great! You jumped high!"
      } else if (jumpScore === 1) {
        if (!this.takeoffWasTwoFooted) {
          message = 'Good try! Next time, jump with both feet together!';
          voiceText = 'محاولة جيدة! اقفز بقدميك معاً!'; // Arabic: "Good try! Jump with both feet!"
        } else if (!this.landingWasStable) {
          message = 'Nice jump! Try to land softly with bent knees!';
          voiceText = 'قفزة جيدة! انزل بهدوء!'; // Arabic: "Good jump! Land softly!"
        } else {
          message = 'Good jump! Keep practicing!';
          voiceText = 'قفزة جيدة!'; // Arabic: "Good jump!"
        }
      } else {
        message = 'Good effort! Bend your knees and try a bigger jump!';
        voiceText = 'حاول مرة أخرى!'; // Arabic: "Try again!"
      }
      
      const metrics: Record<string, number> = {
        jumpScore,
        jumpHeightNorm,
        airborneFrames: this.airborneFrameCount,
        twoFootedTakeoff: this.takeoffWasTwoFooted ? 1 : 0,
        twoFootedLanding: this.landingWasTwoFooted ? 1 : 0,
        stableLanding: this.landingWasStable ? 1 : 0,
      };
      
      if (jumpHeightCm > 0) {
        metrics.jumpHeightCm = Math.round(jumpHeightCm * 10) / 10;
        metrics.jumpHeightPercent = Math.round(jumpHeightPercent * 10) / 10;
      }
      
      return {
        message,
        level: 'success',
        progress: 1,
        done: true,
        voiceText,
        metrics,
      };
    }
    
    // Default fallback (shouldn't reach here)
    return {
      message: 'Jump up in place! 🦘',
      level: 'info',
      progress: 0,
      voiceText: 'اقفز!', // Arabic: "Jump!"
    };
  }

  stop(): void {
    this.baselineEstablished = false;
    this.previousPositions = null;
    this.jumpPhase = 'standing';
  }
}

// ============= TIP-TOE STANDING TASK =============
/**
 * Tip-toe standing evaluation based on PDMS-2 guidelines
 * Child stands on tiptoes with arms overhead
 * 
 * Age-appropriate thresholds (PDMS-2):
 * - Age 3-4: Target 3 seconds
 * - Age 5+: Target 8 seconds (full PDMS-2 standard)
 * 
 * Scoring (0-2 points):
 * - 2 points: Full duration without errors (feet stable, heels up, arms overhead)
 * - 1 point: Partial success (half duration or minor adjustment)
 * - 0 points: Unable to hold >1s or significant movement
 * 
 * Tolerance: Trunk sway < 20° acceptable, feet should remain stationary
 */
class TipToeTask implements TaskHandler {
  // Timer for tracking tip-toe duration
  private tiptoeTimer: number | null = null;
  
  // Previous frame landmarks for movement detection
  private previousLandmarks: any[] | null = null;
  
  // Track maximum trunk lean during stance
  private maxTrunkLean: number = 0;
  
  // Count frames with significant foot movement (resets attempt)
  private footMovementFrames: number = 0;
  
  // Track if heels ever dropped during current attempt
  private heelDropCount: number = 0;
  
  // Track total frames for quality metrics
  private totalFrames: number = 0;

  /**
   * Get target duration (simplified to 3 seconds for all ages)
   */
  private getTargetDuration(): number {
    return 3; // 3 seconds - easier to achieve
  }

  /**
   * Calculate tip-toe score (0-2 points) based on PDMS-2 criteria
   */
  private calculateTiptoeScore(
    holdTime: number,
    maxTrunkLean: number,
    footMovementRatio: number,
    heelDropRatio: number
  ): number {
    const targetDuration = this.getTargetDuration();
    const SWAY_THRESHOLD = 20; // degrees - max acceptable trunk lean
    
    // 2 points: Full duration, minimal sway, no foot movement, heels stayed up
    if (
      holdTime >= targetDuration &&
      maxTrunkLean < SWAY_THRESHOLD &&
      footMovementRatio < 0.05 &&
      heelDropRatio < 0.05
    ) {
      return 2;
    }
    
    // 1 point: Partial success (at least half duration, or met duration with minor issues)
    if (
      holdTime >= targetDuration * 0.5 ||
      (holdTime >= targetDuration && (maxTrunkLean < SWAY_THRESHOLD * 1.5 || footMovementRatio < 0.15))
    ) {
      return 1;
    }
    
    // 0 points: Unable to maintain position
    return 0;
  }

  start(): void {
    this.tiptoeTimer = null;
    this.previousLandmarks = null;
    this.maxTrunkLean = 0;
    this.footMovementFrames = 0;
    this.heelDropCount = 0;
    this.totalFrames = 0;
  }

  update(landmarks: any[]): TaskUpdate {
    // Detect heel lift (tip-toe position)
    const heelResult = detectHeelsLifted(landmarks);
    const { bothHeelsLifted, leftHeelHeight, rightHeelHeight } = heelResult;
    
    // Detect if arms are overhead
    const armResult = detectArmsOverhead(landmarks);
    const { bothArmsOverhead, leftArmOverhead, rightArmOverhead } = armResult;
    
    // Calculate trunk lean (sway from vertical)
    const trunkLeanAngle = getTrunkLeanAngle(landmarks);
    
    // Calculate foot movement from previous frame
    const footMovement = calculateFootMovement(landmarks, this.previousLandmarks);
    this.previousLandmarks = landmarks;
    
    // Track frame metrics
    this.totalFrames++;
    
    // Update max trunk lean
    this.maxTrunkLean = Math.max(this.maxTrunkLean, trunkLeanAngle);
    
    // Track foot movement (threshold for "significant" movement)
    const FOOT_MOVEMENT_THRESHOLD = 0.015;
    if (footMovement > FOOT_MOVEMENT_THRESHOLD) {
      this.footMovementFrames++;
    }
    
    // Constants
    const targetDuration = this.getTargetDuration();
    const SWAY_THRESHOLD = 20; // degrees

    // === Step 1: Check if child is in correct starting position ===
    if (!bothHeelsLifted) {
      // Heels are not lifted - prompt to get on tiptoes
      if (this.tiptoeTimer !== null) {
        // Was on tiptoes but heels dropped - reset and encourage
        this.heelDropCount++;
        this.tiptoeTimer = null;
        return {
          message: 'Keep those heels up! Try again!',
          level: 'warning',
          progress: 0,
          voiceText: 'ارفع كعبيك! حاول مرة أخرى!', // Arabic: "Lift your heels! Try again!"
          metrics: { trunkLean: trunkLeanAngle },
        };
      }
      
      // Initial prompt
      if (!bothArmsOverhead) {
        return {
          message: 'Stand on your tiptoes and reach your arms up high!',
          level: 'warning',
          progress: 0,
          voiceText: 'قف على أطراف أصابعك وارفع يديك للأعلى!', // Arabic: "Stand on tiptoes and raise your hands!"
        };
      } else {
        return {
          message: 'Great arms! Now rise up on your tiptoes!',
          level: 'warning',
          progress: 0,
          voiceText: 'رائع! الآن ارفع كعبيك!', // Arabic: "Great! Now lift your heels!"
        };
      }
    }

    // === Heels are lifted - check arms ===
    if (!bothArmsOverhead) {
      // On tiptoes but arms not up
      const armStatus = leftArmOverhead ? 'Right arm higher!' : 
                        rightArmOverhead ? 'Left arm higher!' : 
                        'Reach your arms up high!';
      return {
        message: `Good tiptoes! ${armStatus}`,
        level: 'warning',
        progress: 0.2,
        voiceText: 'ارفع يديك للأعلى!', // Arabic: "Raise your hands up!"
        metrics: {
          leftHeelHeight: leftHeelHeight * 100,
          rightHeelHeight: rightHeelHeight * 100,
          trunkLean: trunkLeanAngle,
        },
      };
    }

    // === Both heels lifted AND arms overhead - start/continue timing ===
    if (this.tiptoeTimer === null) {
      this.tiptoeTimer = Date.now();
    }

    // Calculate hold time
    const holdTime = (Date.now() - this.tiptoeTimer) / 1000;
    const progress = Math.min(holdTime / (targetDuration + 1), 1); // +1 for visual buffer

    // Calculate quality metrics
    const footMovementRatio = this.totalFrames > 0 ? this.footMovementFrames / this.totalFrames : 0;
    const heelDropRatio = this.totalFrames > 0 ? this.heelDropCount / this.totalFrames : 0;

    // === Check for task completion ===
    if (holdTime >= targetDuration) {
      const tiptoeScore = this.calculateTiptoeScore(
        holdTime,
        this.maxTrunkLean,
        footMovementRatio,
        heelDropRatio
      );
      
      // Fun feedback based on score
      let message: string;
      let voiceText: string;
      
      if (tiptoeScore === 2) {
        message = 'You stood like a ballerina! Perfect tip-toe! 🩰';
        voiceText = 'رائع! مثل راقصة باليه!'; // Arabic: "Amazing! Like a ballet dancer!"
      } else if (tiptoeScore === 1) {
        message = 'Good job on your tiptoes! Keep practicing!';
        voiceText = 'أحسنت! استمر في التدريب!'; // Arabic: "Well done! Keep practicing!"
      } else {
        message = 'Nice try! Let\'s practice standing tall next time.';
        voiceText = 'محاولة جيدة! لنتدرب أكثر!'; // Arabic: "Good try! Let's practice more!"
      }

      return {
        message,
        level: 'success',
        progress: 1,
        done: true,
        voiceText,
        metrics: {
          holdTime,
          maxTrunkLean: this.maxTrunkLean,
          tiptoeScore,
          footMovementRatio,
          heelDropCount: this.heelDropCount,
          avgHeelHeight: ((leftHeelHeight + rightHeelHeight) / 2) * 100,
        },
      };
    }

    // === During tip-toe hold - provide real-time feedback ===
    if (trunkLeanAngle > SWAY_THRESHOLD) {
      // Excessive sway warning
      return {
        message: `Hold steady! ${holdTime.toFixed(1)}s / ${targetDuration}s`,
        level: 'warning',
        progress,
        voiceText: 'اثبت!', // Arabic: "Hold steady!"
        metrics: {
          holdTime,
          trunkLean: trunkLeanAngle,
        },
      };
    } else if (footMovement > FOOT_MOVEMENT_THRESHOLD) {
      // Foot movement warning
      return {
        message: `Keep feet still! ${holdTime.toFixed(1)}s / ${targetDuration}s`,
        level: 'warning',
        progress,
        metrics: {
          holdTime,
          trunkLean: trunkLeanAngle,
          footMovement: footMovement * 100,
        },
      };
    } else {
      // Excellent form - encourage!
      const encouragement = holdTime < 2 ? 'Reach up high!' :
                           holdTime < 4 ? 'Great job!' :
                           holdTime < 6 ? 'You\'re doing amazing!' :
                           'Almost there, superstar!';
      return {
        message: `${encouragement} ${holdTime.toFixed(1)}s / ${targetDuration}s`,
        level: 'info',
        progress,
        metrics: {
          holdTime,
          trunkLean: trunkLeanAngle,
          avgHeelHeight: ((leftHeelHeight + rightHeelHeight) / 2) * 100,
        },
      };
    }
  }

  stop(): void {
    this.tiptoeTimer = null;
    this.previousLandmarks = null;
  }
}

// ============= SQUAT TASK =============
/**
 * Squat assessment - evaluates depth and form against biomechanical standards
 * 
 * Clinical Assessment Criteria:
 * - Knee flexion angle: Target ≤90° (thighs parallel to floor)
 * - Form: Knees track over toes (no valgus), heels down, neutral back
 * 
 * Depth Classification:
 * - Standing: >150° knee angle
 * - Partial squat: 100-150° 
 * - Parallel squat: 80-100° (thighs parallel - target)
 * - Deep squat: <80° (below parallel)
 * 
 * Reference: 90° knee bend = safe functional squat depth
 * 
 * Scoring (0-2 points):
 * - 2 points: Deep/parallel squat (≤90°) with good form
 * - 1 point: Partial squat (100-150°) or minor form issues
 * - 0 points: Cannot squat or significant form breakdown
 */
class SquatTask implements TaskHandler {
  // Track minimum (deepest) knee angle achieved
  private minKneeAngle: number = 180;
  
  // Track best squat depth reached
  private bestSquatDepth: 'standing' | 'partial' | 'parallel' | 'deep' = 'standing';
  
  // Track form issues encountered
  private valgusFrames: number = 0;
  private heelLiftFrames: number = 0;
  private totalFrames: number = 0;
  
  // Hold timer for maintaining squat position
  private holdStartTime: number | null = null;
  private holdDuration: number = 0;
  
  // Track if squat was completed
  private squatCompleted: boolean = false;

  // Hold time target (milliseconds)
  private readonly HOLD_TIME_TARGET = 1000; // Hold squat for 1 second

  start(): void {
    this.minKneeAngle = 180;
    this.bestSquatDepth = 'standing';
    this.valgusFrames = 0;
    this.heelLiftFrames = 0;
    this.totalFrames = 0;
    this.holdStartTime = null;
    this.holdDuration = 0;
    this.squatCompleted = false;
  }

  /**
   * Calculate squat score (0-2 points)
   */
  private calculateSquatScore(
    depth: 'standing' | 'partial' | 'parallel' | 'deep',
    valgusRatio: number,
    heelLiftRatio: number
  ): number {
    // Good depth (parallel or deep)
    if (depth === 'parallel' || depth === 'deep') {
      // Check form quality
      if (valgusRatio < 0.2 && heelLiftRatio < 0.2) {
        return 2; // Perfect: good depth + good form
      } else {
        return 1; // Good depth but some form issues
      }
    }
    
    // Partial depth
    if (depth === 'partial') {
      if (valgusRatio < 0.3 && heelLiftRatio < 0.3) {
        return 1; // Partial but acceptable form
      } else {
        return 0; // Partial with poor form
      }
    }
    
    // Standing or minimal squat
    return 0;
  }

  update(landmarks: any[]): TaskUpdate {
    this.totalFrames++;
    
    // Get comprehensive squat assessment
    const assessment = assessSquatForm(landmarks);
    const { depth, trunkLean, valgus, heelLift } = assessment;
    const { averageKneeAngle, squatDepth, leftKneeAngle, rightKneeAngle, symmetryDifference } = depth;
    
    // Track minimum angle achieved (best attempt)
    if (averageKneeAngle < this.minKneeAngle) {
      this.minKneeAngle = averageKneeAngle;
    }
    
    // Track best depth reached
    if (squatDepth === 'deep' || 
        (squatDepth === 'parallel' && this.bestSquatDepth !== 'deep') ||
        (squatDepth === 'partial' && this.bestSquatDepth === 'standing')) {
      this.bestSquatDepth = squatDepth;
    }
    
    // Track form issues
    if (valgus.hasValgus) this.valgusFrames++;
    if (heelLift.heelsLifted) this.heelLiftFrames++;
    
    // Calculate form issue ratios
    const valgusRatio = this.totalFrames > 0 ? this.valgusFrames / this.totalFrames : 0;
    const heelLiftRatio = this.totalFrames > 0 ? this.heelLiftFrames / this.totalFrames : 0;
    
    // Progress based on knee angle (180° standing -> 130° for partial squat)
    const progress = Math.min(1, Math.max(0, (180 - averageKneeAngle) / 50));

    // === Check for squat position (partial, parallel, or deep all count) ===
    if (squatDepth === 'partial' || squatDepth === 'parallel' || squatDepth === 'deep') {
      // Start/continue hold timer
      if (!this.holdStartTime) {
        this.holdStartTime = Date.now();
      }
      this.holdDuration = Date.now() - this.holdStartTime;

      // === Check for form issues during hold ===
      if (valgus.valgusLevel === 'significant') {
        return {
          message: "Don't let your knees cave in! Keep them apart.",
          level: 'warning',
          progress,
          voiceText: 'ابقِ ركبتيك متباعدتين!', // Arabic: "Keep your knees apart!"
          metrics: {
            kneeAngle: averageKneeAngle,
            leftKneeAngle,
            rightKneeAngle,
            kneeValgusRatio: valgus.kneeToAnkleRatio,
          },
        };
      }

      if (heelLift.heelsLifted) {
        return {
          message: 'Keep your heels on the floor!',
          level: 'warning',
          progress,
          voiceText: 'ابقِ كعبيك على الأرض!', // Arabic: "Keep your heels on the ground!"
          metrics: {
            kneeAngle: averageKneeAngle,
            heelLiftAmount: heelLift.liftAmount * 100,
          },
        };
      }

      // Check hold duration for completion
      if (this.holdDuration >= this.HOLD_TIME_TARGET && !this.squatCompleted) {
        this.squatCompleted = true;
        const score = this.calculateSquatScore(this.bestSquatDepth, valgusRatio, heelLiftRatio);
        
        let message: string;
        let voiceText: string;
        
        if (score === 2) {
          message = 'Great squat! Your knees bent nicely! 🌟';
          voiceText = 'رائع! قرفصاء ممتازة!'; // Arabic: "Great! Excellent squat!"
        } else if (score === 1) {
          message = 'Good squat! Keep practicing for better form.';
          voiceText = 'جيد! استمر في التدريب!'; // Arabic: "Good! Keep practicing!"
        } else {
          message = 'Nice try! Let\'s work on going deeper.';
          voiceText = 'محاولة جيدة!'; // Arabic: "Good try!"
        }

        return {
          message,
          level: 'success',
          progress: 1,
          done: true,
          voiceText,
          metrics: {
            minKneeAngle: this.minKneeAngle,
            leftKneeAngle,
            rightKneeAngle,
            symmetryDifference,
            hipFlexionAngle: trunkLean.hipFlexionAngle,
            squatScore: score,
            valgusRatio,
            heelLiftRatio,
            depth: squatDepth === 'deep' ? 2 : squatDepth === 'parallel' ? 1 : 0,
          },
        };
      }

      // Good form, holding position
      const depthLabel = squatDepth === 'deep' ? 'Deep squat' : squatDepth === 'parallel' ? 'Great squat' : 'Good squat';
      return {
        message: `${depthLabel}! Hold it... ${(this.holdDuration / 1000).toFixed(1)}s`,
        level: 'info',
        progress,
        metrics: {
          kneeAngle: averageKneeAngle,
          holdDuration: this.holdDuration,
          hipFlexionAngle: trunkLean.hipFlexionAngle,
        },
      };
    }

    // Reset hold timer if not in squat position
    this.holdStartTime = null;
    this.holdDuration = 0;

    // === Standing - encourage to squat ===
    if (trunkLean.trunkLeanLevel === 'excessive') {
      return {
        message: 'Keep your back straighter as you squat down.',
        level: 'warning',
        progress,
        voiceText: 'ابقِ ظهرك مستقيم!', // Arabic: "Keep your back straight!"
        metrics: {
          kneeAngle: averageKneeAngle,
          hipFlexionAngle: trunkLean.hipFlexionAngle,
        },
      };
    }

    return {
      message: 'Squat down like sitting in a chair! Bend your knees.',
      level: 'warning',
      progress,
      voiceText: 'اقرفص مثل الجلوس على كرسي!', // Arabic: "Squat like sitting on a chair!"
      metrics: {
        kneeAngle: averageKneeAngle,
        leftKneeAngle,
        rightKneeAngle,
      },
    };
  }

  stop(): void {
    this.holdStartTime = null;
    this.squatCompleted = false;
  }
}

// ============= TASK REGISTRY =============
export function createTaskHandlers(childHeightCm?: number): Record<string, TaskHandler> {
  return {
    raise_hand: new RaiseHandTask(),
    one_leg: new OneLegTask(),
    walk: new WalkTask(),
    jump: new JumpTask(childHeightCm),
    tiptoe: new TipToeTask(),
    squat: new SquatTask(),
  };
}

// Default tasks for backward compatibility
export const tasks: Record<string, TaskHandler> = createTaskHandlers();

export const TASK_SEQUENCE = ['raise_hand', 'one_leg', 'walk', 'jump', 'tiptoe', 'squat'] as const;
export type TaskName = typeof TASK_SEQUENCE[number];
