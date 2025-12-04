import type { TaskName } from '../store/session';

/**
 * Clinical standards and normal ranges for pediatric motor assessments.
 * Based on BESS (Balance Error Scoring System) and pediatric ROM norms.
 */

// Age band type for grouping children
export type AgeBand = '5-7' | '8-10' | '11-13' | '14-18';

export function getAgeBand(ageYears: number): AgeBand {
  if (ageYears >= 5 && ageYears <= 7) return '5-7';
  if (ageYears >= 8 && ageYears <= 10) return '8-10';
  if (ageYears >= 11 && ageYears <= 13) return '11-13';
  return '14-18';
}

// Clinical grade levels
export type ClinicalLevel = 'normal' | 'borderline' | 'abnormal';

export interface ClinicalGrade {
  level: ClinicalLevel;
  note: string;
}

// Standards for raise_hand (shoulder flexion - bilateral overhead arm raise)
// Reference: AAOS ROM standards - normal shoulder flexion 150-180°
export const SHOULDER_FLEXION_STANDARDS = {
  normal: 150, // ≥150° = near-full overhead (target ~180° arm aligned with ear)
  borderline: 90, // 90-149° = partial range (shoulder height to overhead)
  // < 90° = abnormal/limited ROM
  
  // Elbow extension during raise
  elbow: {
    straight: 170, // ≥170° = nearly straight (good form)
    bent: 140,     // <140° = significantly bent (form issue)
  },
  
  // Back compensation thresholds
  compensation: {
    mild: 10,        // 10-20° backward lean = mild
    significant: 20, // >20° = significant (requires correction)
  },
} as const;

// Standards for one_leg (BESS-like balance test)
// Based on pediatric developmental norms:
// - Age 2-3: Target 3 seconds
// - Age 4+: Target 5 seconds
// Trunk sway > 20° from vertical = loss of balance
export const BALANCE_STANDARDS = {
  // Default standards for age 4+
  normal: 5, // >= 5 seconds is age-appropriate
  borderline: 3, // 3-4.9 seconds is borderline
  // < 3 seconds is abnormal
  
  // Age-specific thresholds
  byAge: {
    '2-3': { normal: 3, borderline: 1.5 }, // Toddlers: 3s target
    '4+': { normal: 5, borderline: 3 },    // Preschool+: 5s target
  },
  
  // Trunk sway thresholds (degrees from vertical)
  sway: {
    excellent: 10, // < 10° = excellent stability
    acceptable: 20, // 10-20° = acceptable
    // > 20° = loss of balance
  },
} as const;

// Standards for walk (GMFM-based gait assessment)
// Reference: GMFM-88 Walking Items (69-71)
export const GAIT_STANDARDS = {
  // Target step count (GMFM standard)
  targetSteps: 10,
  minStepsForPartial: 3, // Minimum steps for 1 point
  
  // Symmetry thresholds (step amplitude asymmetry)
  symmetry: {
    normal: 15,     // <= 15% asymmetry is normal
    borderline: 25, // 15-25% asymmetry is borderline
    // > 25% asymmetry is abnormal
  },
  
  // Trunk stability thresholds during walking
  trunkSway: {
    minimal: 8,    // < 8° = excellent stability
    moderate: 15,  // 8-15° = acceptable
    // > 15° = excessive sway / poor balance
  },
  
  // Balance assessment
  balance: {
    maxUnstableFrameRatio: 0.2, // < 20% unstable frames = good balance
    maxBalanceLossEvents: 3,     // < 3 balance losses = acceptable
  },
  
  // Arm position (developmental consideration)
  arms: {
    highGuardAcceptable: 0.5, // < 50% time in high guard = mature gait (age 4+)
    // Toddlers (< 3 years) often use high guard position for balance
  },
  
  // Age-specific adjustments
  byAge: {
    '2-3': { targetSteps: 5, minStepsForPartial: 2 },  // Toddlers: lower targets
    '4+': { targetSteps: 10, minStepsForPartial: 3 },  // Older children: GMFM standard
  },
} as const;

// Legacy alias for backward compatibility
export const GAIT_SYMMETRY_STANDARDS = GAIT_STANDARDS.symmetry;

// Standards for jump (GMFM-based two-footed jump assessment)
// Reference: GMFM-88 Jump Items (79, 81, 82)
export const JUMP_STANDARDS = {
  // Jump height benchmarks (GMFM: ~30cm for 5-6 year olds)
  height: {
    excellent: 30, // >= 30cm = age-appropriate for 5-6yo
    normal: 15,    // >= 15% of body height is normal
    borderline: 10, // 10-14% is borderline
    // < 10% = limited power
  },
  
  // Minimum airborne frames for valid jump (at 30fps)
  minAirborneFrames: 3,
  
  // Takeoff quality thresholds
  takeoff: {
    symmetryThreshold: 0.03, // < 3% ankle asymmetry = two-footed
    velocityThreshold: 0.02, // Minimum upward CoM velocity
  },
  
  // Landing quality thresholds  
  landing: {
    symmetryThreshold: 0.03, // < 3% asymmetry = two-footed
    kneeAbsorptionAngle: 160, // < 160° knee angle = absorbing impact
  },
  
  // Age-specific considerations
  byAge: {
    '2-3': { 
      heightCm: 10,       // Toddlers: any clear jump counts
      heightPercent: 5,   // Lower threshold
    },
    '4-5': { 
      heightCm: 20,       // Preschool: moderate height
      heightPercent: 10,
    },
    '6+': { 
      heightCm: 30,       // School age: GMFM standard
      heightPercent: 15,
    },
  },
  
  // Scoring criteria
  scoring: {
    perfect: 2,   // Two-footed takeoff + two-footed stable landing
    partial: 1,   // Achieved airborne but form issues
    unable: 0,    // Could not achieve proper airborne phase
  },
} as const;

// Legacy alias for backward compatibility
export const JUMP_HEIGHT_STANDARDS = {
  normal: JUMP_STANDARDS.height.normal,
  borderline: JUMP_STANDARDS.height.borderline,
} as const;

// Standards for tiptoe standing (PDMS-2 guidelines)
// Child stands on tiptoes with arms overhead
export const TIPTOE_STANDARDS = {
  // Default standards for age 5+
  normal: 8, // >= 8 seconds is full PDMS-2 standard
  borderline: 4, // 4-7.9 seconds is borderline
  // < 4 seconds is abnormal
  
  // Age-specific thresholds (PDMS-2)
  byAge: {
    '3-4': { normal: 3, borderline: 1.5 }, // Young children: 3s target
    '5+': { normal: 8, borderline: 4 },    // Older children: 8s target (PDMS-2)
  },
  
  // Trunk sway thresholds (same as balance)
  sway: {
    excellent: 10, // < 10° = excellent stability
    acceptable: 20, // 10-20° = acceptable, > 20° = unstable
  },
  
  // Foot movement thresholds
  footMovement: {
    acceptable: 0.05, // < 5% frames with movement = acceptable
    // > 5% = unstable footing
  },
} as const;

// Standards for squat assessment
// Reference: 90° knee angle = thighs parallel to floor (safe functional squat)
export const SQUAT_STANDARDS = {
  // Knee flexion angle thresholds (smaller = deeper squat)
  depth: {
    parallel: 100, // ≤100° = at or near parallel (good)
    partial: 150,  // ≤150° = partial squat
    // >150° = standing/minimal squat
  },
  
  // Form quality thresholds
  form: {
    // Knee valgus (knee-to-ankle ratio)
    valgusNormal: 0.85,    // ≥0.85 = knees tracking well
    valgusMild: 0.7,       // 0.7-0.85 = mild valgus
    // <0.7 = significant valgus
    
    // Heel lift (acceptable ratio of frames)
    heelLiftAcceptable: 0.2, // <20% frames with heel lift
  },
} as const;

/**
 * Grade a specific metric based on task and clinical standards.
 * @param task - The task name
 * @param metricName - The metric being graded
 * @param value - The measured value
 * @param ageYears - Optional age for age-adjusted grading
 * @returns Clinical grade with level and explanatory note
 */
export function gradeMetric(
  task: TaskName,
  metricName: string,
  value: number,
  _ageYears?: number // Reserved for future age-adjusted grading
): ClinicalGrade {
  switch (task) {
    case 'raise_hand':
      if (metricName === 'shoulderFlexion' || metricName === 'leftShoulderAngle' || metricName === 'rightShoulderAngle') {
        const flexion = value;
        if (flexion >= SHOULDER_FLEXION_STANDARDS.normal) {
          return {
            level: 'normal',
            note: 'Full overhead ROM achieved (≥150°, near-full flexion)',
          };
        } else if (flexion >= SHOULDER_FLEXION_STANDARDS.borderline) {
          return {
            level: 'borderline',
            note: 'Partial ROM (90-150°), may indicate stiffness or weakness',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Significant ROM limitation (<90°), clinical evaluation needed',
          };
        }
      }
      break;

    case 'one_leg':
      // Overall one-leg score (0-2 points)
      if (metricName === 'oneLegScore') {
        const score = value;
        if (score >= 2) {
          return {
            level: 'normal',
            note: 'Excellent one-leg balance: met target duration with minimal sway (<20°)',
          };
        } else if (score >= 1) {
          return {
            level: 'borderline',
            note: 'Partial balance: maintained some duration or had minor sway issues',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Unable to maintain balance for >1s or immediate loss of balance',
          };
        }
      }
      // Hold time assessment
      if (metricName === 'balanceTime' || metricName === 'holdTime') {
        const holdTime = value;
        if (holdTime >= BALANCE_STANDARDS.normal) {
          return {
            level: 'normal',
            note: `Age-appropriate balance duration (${holdTime.toFixed(1)}s ≥5s target)`,
          };
        } else if (holdTime >= BALANCE_STANDARDS.borderline) {
          return {
            level: 'borderline',
            note: `Mild balance weakness (${holdTime.toFixed(1)}s, target 5s)`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Significant balance deficit (${holdTime.toFixed(1)}s <3s), assessment recommended`,
          };
        }
      }
      // Trunk sway (lean angle) assessment
      if (metricName === 'maxTrunkLean' || metricName === 'trunkLean') {
        const sway = value;
        if (sway < BALANCE_STANDARDS.sway.excellent) {
          return {
            level: 'normal',
            note: `Excellent stability (${Math.round(sway)}° sway, <10° threshold)`,
          };
        } else if (sway < BALANCE_STANDARDS.sway.acceptable) {
          return {
            level: 'borderline',
            note: `Acceptable sway (${Math.round(sway)}°, 10-20° range)`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Excessive sway (${Math.round(sway)}° >20°), balance assessment needed`,
          };
        }
      }
      // Excessive sway ratio assessment
      if (metricName === 'excessiveSwayRatio') {
        const ratio = value;
        if (ratio < 0.1) {
          return {
            level: 'normal',
            note: `Minimal excessive sway (${Math.round(ratio * 100)}% of frames)`,
          };
        } else if (ratio < 0.25) {
          return {
            level: 'borderline',
            note: `Some balance adjustments needed (${Math.round(ratio * 100)}% of frames)`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Frequent balance loss (${Math.round(ratio * 100)}% of frames with excessive sway)`,
          };
        }
      }
      break;

    case 'walk':
      // Overall walk score (GMFM-based 0-2 scoring)
      if (metricName === 'walkScore') {
        const score = value;
        if (score >= 2) {
          return {
            level: 'normal',
            note: 'Independent walking with good balance (GMFM criteria met)',
          };
        } else if (score >= 1) {
          return {
            level: 'borderline',
            note: 'Some independent steps but with balance issues or incomplete',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Unable to take independent steps, further assessment needed',
          };
        }
      }
      // Step count assessment
      if (metricName === 'stepCount') {
        const steps = value;
        if (steps >= GAIT_STANDARDS.targetSteps) {
          return {
            level: 'normal',
            note: `Achieved target steps (${steps}/${GAIT_STANDARDS.targetSteps})`,
          };
        } else if (steps >= GAIT_STANDARDS.minStepsForPartial) {
          return {
            level: 'borderline',
            note: `Partial steps achieved (${steps}/${GAIT_STANDARDS.targetSteps})`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Insufficient steps (${steps}/${GAIT_STANDARDS.targetSteps})`,
          };
        }
      }
      // Gait symmetry (asymmetry percentage)
      if (metricName === 'gaitSymmetry' || metricName === 'symmetry' || metricName === 'symmetryPercent') {
        // Note: symmetryPercent is 100 - asymmetry, so we invert for grading
        const symmetry = value; // Higher = better symmetry
        const asymmetry = 100 - symmetry;
        if (asymmetry <= GAIT_STANDARDS.symmetry.normal) {
          return {
            level: 'normal',
            note: `Good gait symmetry (${Math.round(symmetry)}%)`,
          };
        } else if (asymmetry <= GAIT_STANDARDS.symmetry.borderline) {
          return {
            level: 'borderline',
            note: `Mild asymmetry detected (${Math.round(symmetry)}% symmetry)`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Significant gait asymmetry (${Math.round(symmetry)}% symmetry)`,
          };
        }
      }
      // Trunk stability during walking
      if (metricName === 'maxTrunkSway' || metricName === 'trunkSway') {
        const sway = value;
        if (sway < GAIT_STANDARDS.trunkSway.minimal) {
          return {
            level: 'normal',
            note: `Excellent stability during walking (${Math.round(sway)}° sway)`,
          };
        } else if (sway < GAIT_STANDARDS.trunkSway.moderate) {
          return {
            level: 'borderline',
            note: `Moderate trunk sway during walking (${Math.round(sway)}°)`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Excessive trunk sway (${Math.round(sway)}°), balance assessment needed`,
          };
        }
      }
      break;

    case 'jump':
      // Overall jump score (GMFM-based 0-2 scoring)
      if (metricName === 'jumpScore') {
        const score = value;
        if (score >= 2) {
          return {
            level: 'normal',
            note: 'Two-footed takeoff and stable two-footed landing (GMFM criteria met)',
          };
        } else if (score >= 1) {
          return {
            level: 'borderline',
            note: 'Achieved airborne but asymmetric takeoff/landing or unstable',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Unable to achieve proper two-footed airborne phase',
          };
        }
      }
      // Jump height as percentage of body height
      if (metricName === 'jumpHeightPercent' || metricName === 'jumpHeight') {
        const heightPercent = value;
        if (heightPercent >= JUMP_STANDARDS.height.normal) {
          return {
            level: 'normal',
            note: `Adequate power generation (${Math.round(heightPercent)}% of height)`,
          };
        } else if (heightPercent >= JUMP_STANDARDS.height.borderline) {
          return {
            level: 'borderline',
            note: `Below expected power (${Math.round(heightPercent)}% of height)`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Limited power (<10% height), strength assessment needed`,
          };
        }
      }
      // Jump height in centimeters
      if (metricName === 'jumpHeightCm') {
        const heightCm = value;
        if (heightCm >= JUMP_STANDARDS.height.excellent) {
          return {
            level: 'normal',
            note: `Excellent jump height (${Math.round(heightCm)}cm, GMFM standard)`,
          };
        } else if (heightCm >= 15) {
          return {
            level: 'borderline',
            note: `Moderate jump height (${Math.round(heightCm)}cm)`,
          };
        } else {
          return {
            level: 'abnormal',
            note: `Limited jump height (${Math.round(heightCm)}cm)`,
          };
        }
      }
      // Two-footed takeoff assessment
      if (metricName === 'twoFootedTakeoff') {
        if (value >= 1) {
          return {
            level: 'normal',
            note: 'Proper two-footed takeoff (both feet left ground simultaneously)',
          };
        } else {
          return {
            level: 'borderline',
            note: 'Asymmetric takeoff (one foot left ground before other)',
          };
        }
      }
      // Landing quality assessment
      if (metricName === 'twoFootedLanding' || metricName === 'stableLanding') {
        if (value >= 1) {
          return {
            level: 'normal',
            note: metricName === 'stableLanding' 
              ? 'Stable landing with knee absorption' 
              : 'Two-footed landing',
          };
        } else {
          return {
            level: 'borderline',
            note: metricName === 'stableLanding'
              ? 'Unstable or stiff landing'
              : 'One-footed or asymmetric landing',
          };
        }
      }
      break;

    case 'tiptoe':
      if (metricName === 'holdTime' || metricName === 'tiptoeTime') {
        const holdTime = value;
        if (holdTime >= TIPTOE_STANDARDS.normal) {
          return {
            level: 'normal',
            note: 'Age-appropriate tip-toe balance (≥8s, PDMS-2)',
          };
        } else if (holdTime >= TIPTOE_STANDARDS.borderline) {
          return {
            level: 'borderline',
            note: 'Mild balance deficit (4-8s)',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Significant balance deficit (<4s), motor assessment recommended',
          };
        }
      }
      break;

    case 'squat':
      if (metricName === 'kneeAngle' || metricName === 'minKneeAngle' || metricName === 'averageKneeAngle') {
        const kneeAngle = value;
        if (kneeAngle <= SQUAT_STANDARDS.depth.parallel) {
          return {
            level: 'normal',
            note: 'Full squat depth achieved (≤100°, parallel or deeper)',
          };
        } else if (kneeAngle <= SQUAT_STANDARDS.depth.partial) {
          return {
            level: 'borderline',
            note: 'Partial squat depth (100-150°), may indicate mobility limitation',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Minimal squat (<150°), assessment for mobility/strength needed',
          };
        }
      }
      break;
  }

  // Default fallback for unknown metrics
  return {
    level: 'normal',
    note: 'Metric assessed within acceptable range',
  };
}

/**
 * Get a color code for clinical level (for UI badges)
 */
export function getLevelColor(level: ClinicalLevel): 'success' | 'warning' | 'error' {
  switch (level) {
    case 'normal':
      return 'success';
    case 'borderline':
      return 'warning';
    case 'abnormal':
      return 'error';
  }
}

// ============= OVERALL MOTOR ASSESSMENT SCORING =============

/**
 * Overall risk classification for motor screening
 * Inspired by FMS (Functional Movement Screen) composite scoring approach
 * 
 * IMPORTANT DISCLAIMER:
 * This classification is a screening indicator only, NOT a clinical diagnosis.
 * It is designed to identify children who may benefit from further professional evaluation.
 * Always consult qualified healthcare professionals for clinical assessments.
 */
export type RiskCategory = 'normal' | 'borderline' | 'high-risk';

/**
 * Individual task score result
 */
export interface TaskScoreResult {
  taskName: TaskName;
  taskLabel: string;
  score: 0 | 1 | 2;
  maxScore: 2;
  level: ClinicalLevel;
  notes: string[];
  metrics?: Record<string, number>;
}

/**
 * Comprehensive motor assessment summary
 */
export interface MotorAssessmentSummary {
  // Individual task scores
  taskScores: TaskScoreResult[];
  
  // Aggregate scoring
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  averageScore: number;
  
  // Score distribution
  numTwoScores: number;  // Tasks with full score (2)
  numOneScores: number;  // Tasks with partial score (1)
  numZeroScores: number; // Tasks with failed score (0)
  
  // Overall classification
  riskCategory: RiskCategory;
  riskLabel: string;
  riskColor: 'success' | 'warning' | 'error';
  
  // Summary text
  overallSummary: string;
  recommendations: string[];
  strengthAreas: string[];
  improvementAreas: string[];
  
  // Child info (if provided)
  childAge?: number;
  assessmentDate: string;
}

/**
 * Human-readable labels for each task
 */
export const TASK_LABELS: Record<TaskName, string> = {
  raise_hand: 'Arm Raise (Shoulder Flexion)',
  one_leg: 'One-Leg Balance',
  walk: 'Walking Gait',
  jump: 'Two-Footed Jump',
  tiptoe: 'Tip-Toe Standing',
  squat: 'Squat Assessment',
};

/**
 * Classification thresholds
 * Based on FMS-style composite scoring principles:
 * - Any score of 0 on fundamental tasks indicates potential concern
 * - Total score distribution determines overall risk level
 * 
 * For 7 tasks (max 14 points):
 * - High Risk: ≤6 points OR any critical task scored 0
 * - Borderline: 7-10 points with no zeros on critical tasks
 * - Normal: ≥11 points with mostly 2s
 * 
 * These thresholds are conservative for screening purposes.
 */
export const CLASSIFICATION_THRESHOLDS = {
  // Percentage-based thresholds (work with any number of tasks)
  highRiskMaxPercent: 43,    // ≤43% = High Risk (≤6/14 for 7 tasks)
  borderlineMaxPercent: 71,  // 44-71% = Borderline (7-10/14 for 7 tasks)
  // >71% = Normal (≥11/14 for 7 tasks)
  
  // Alternative: number of zeros
  maxZerosForNormal: 0,      // Normal: no zeros allowed
  maxZerosForBorderline: 1,  // Borderline: max 1 zero allowed
  // >1 zero = High Risk regardless of total
  
  // Critical tasks that weight more heavily (0 = automatic concern)
  criticalTasks: ['one_leg', 'walk', 'jump'] as TaskName[],
} as const;

/**
 * Extract score from task metrics
 * Each task stores its score in a standardized way (e.g., 'oneLegScore', 'walkScore', etc.)
 * 
 * @param taskName - Name of the task
 * @param metrics - Metrics object from task completion
 * @returns Score (0, 1, or 2)
 */
export function extractTaskScore(
  taskName: TaskName,
  metrics: Record<string, number | string> | undefined
): 0 | 1 | 2 {
  if (!metrics) return 0;
  
  // Map task names to their score metric keys
  const scoreKeys: Record<TaskName, string[]> = {
    raise_hand: ['armRaiseScore', 'shoulderScore', 'score'],
    one_leg: ['oneLegScore', 'balanceScore', 'score'],
    walk: ['walkScore', 'gaitScore', 'score'],
    jump: ['jumpScore', 'score'],
    tiptoe: ['tiptoeScore', 'score'],
    squat: ['squatScore', 'formScore', 'score'],
  };
  
  const possibleKeys = scoreKeys[taskName] || ['score'];
  
  for (const key of possibleKeys) {
    const value = metrics[key];
    if (typeof value === 'number') {
      // Clamp to valid range
      return Math.max(0, Math.min(2, Math.round(value))) as 0 | 1 | 2;
    }
  }
  
  // If no explicit score found, try to infer from other metrics
  // This is a fallback - tasks should ideally always include a score
  return inferScoreFromMetrics(taskName, metrics);
}

/**
 * Infer score from task metrics when explicit score is not available
 * Uses task-specific logic based on known metric patterns
 */
function inferScoreFromMetrics(
  taskName: TaskName,
  metrics: Record<string, number | string>
): 0 | 1 | 2 {
  switch (taskName) {
    case 'one_leg': {
      const holdTime = metrics.holdTime as number || metrics.balanceTime as number || 0;
      if (holdTime >= BALANCE_STANDARDS.normal) return 2;
      if (holdTime >= BALANCE_STANDARDS.borderline) return 1;
      return 0;
    }
    
    case 'walk': {
      const stepCount = metrics.stepCount as number || 0;
      if (stepCount >= GAIT_STANDARDS.targetSteps) return 2;
      if (stepCount >= GAIT_STANDARDS.minStepsForPartial) return 1;
      return 0;
    }
    
    case 'jump': {
      const twoFootedTakeoff = metrics.twoFootedTakeoff as number || 0;
      const stableLanding = metrics.stableLanding as number || 0;
      if (twoFootedTakeoff && stableLanding) return 2;
      if (metrics.airborneFrames as number > 0) return 1;
      return 0;
    }
    
    case 'raise_hand': {
      const shoulderAngle = metrics.bestShoulderAngle as number || 
                            metrics.leftShoulderAngle as number || 
                            metrics.rightShoulderAngle as number || 0;
      if (shoulderAngle >= SHOULDER_FLEXION_STANDARDS.normal) return 2;
      if (shoulderAngle >= SHOULDER_FLEXION_STANDARDS.borderline) return 1;
      return 0;
    }
    
    case 'tiptoe': {
      const holdTime = metrics.holdTime as number || metrics.tiptoeTime as number || 0;
      if (holdTime >= TIPTOE_STANDARDS.normal) return 2;
      if (holdTime >= TIPTOE_STANDARDS.borderline) return 1;
      return 0;
    }
    
    case 'squat': {
      const formScore = metrics.formScore as number || 0;
      return Math.max(0, Math.min(2, Math.round(formScore))) as 0 | 1 | 2;
    }
    
    default:
      return 1; // Default to partial credit if unknown
  }
}

/**
 * Generate notes for a task score based on metrics
 */
function generateTaskNotes(
  taskName: TaskName,
  score: 0 | 1 | 2,
  metrics: Record<string, number | string> | undefined
): string[] {
  const notes: string[] = [];
  
  if (!metrics) {
    notes.push('No detailed metrics available');
    return notes;
  }
  
  switch (taskName) {
    case 'one_leg': {
      const holdTime = metrics.holdTime as number;
      const maxSway = metrics.maxTrunkLean as number;
      if (holdTime !== undefined) {
        notes.push(`Held balance for ${holdTime.toFixed(1)}s`);
      }
      if (maxSway !== undefined) {
        notes.push(`Max trunk sway: ${Math.round(maxSway)}°`);
        if (maxSway > 20) notes.push('⚠️ Excessive sway detected');
      }
      if (score === 0) notes.push('Could not maintain one-leg stance for >1s');
      break;
    }
    
    case 'walk': {
      const stepCount = metrics.stepCount as number;
      const symmetry = metrics.symmetryPercent as number;
      if (stepCount !== undefined) {
        notes.push(`Completed ${stepCount} steps`);
      }
      if (symmetry !== undefined) {
        notes.push(`Gait symmetry: ${Math.round(symmetry)}%`);
      }
      if (score === 0) notes.push('Unable to walk independently');
      break;
    }
    
    case 'jump': {
      const twoFootedTakeoff = metrics.twoFootedTakeoff as number;
      const stableLanding = metrics.stableLanding as number;
      const airborneFrames = metrics.airborneFrames as number;
      
      if (twoFootedTakeoff) notes.push('✓ Two-footed takeoff');
      else notes.push('⚠️ Asymmetric takeoff');
      
      if (stableLanding) notes.push('✓ Stable landing');
      else if (airborneFrames > 0) notes.push('⚠️ Unstable landing');
      
      if (score === 0) notes.push('Could not achieve two-footed jump');
      break;
    }
    
    case 'raise_hand': {
      const leftAngle = metrics.leftShoulderAngle as number;
      const rightAngle = metrics.rightShoulderAngle as number;
      if (leftAngle !== undefined) notes.push(`Left arm: ${Math.round(leftAngle)}°`);
      if (rightAngle !== undefined) notes.push(`Right arm: ${Math.round(rightAngle)}°`);
      if (score === 2) notes.push('Full overhead ROM achieved');
      else if (score === 1) notes.push('Partial range of motion');
      else notes.push('Limited shoulder mobility');
      break;
    }
    
    case 'tiptoe': {
      const holdTime = metrics.holdTime as number;
      if (holdTime !== undefined) {
        notes.push(`Held tip-toe for ${holdTime.toFixed(1)}s`);
      }
      if (score === 2) notes.push('Met PDMS-2 standard');
      break;
    }
    
    case 'squat': {
      const depth = metrics.squatDepth as string;
      const formIssues = metrics.formIssueCount as number;
      if (depth) notes.push(`Squat depth: ${depth}`);
      if (formIssues !== undefined && formIssues > 0) {
        notes.push(`${formIssues} form issue(s) noted`);
      }
      break;
    }
  }
  
  return notes;
}

/**
 * Classify a score into a clinical level
 */
function scoreToLevel(score: 0 | 1 | 2): ClinicalLevel {
  if (score === 2) return 'normal';
  if (score === 1) return 'borderline';
  return 'abnormal';
}

/**
 * Calculate overall risk category based on scores
 * 
 * Classification Logic (inspired by FMS composite scoring):
 * 
 * HIGH RISK:
 * - Any critical task (balance, walking, jumping) scored 0
 * - OR more than 1 task scored 0
 * - OR total percentage ≤43%
 * 
 * BORDERLINE:
 * - No critical tasks scored 0
 * - At most 1 non-critical task scored 0
 * - Total percentage 44-71%
 * 
 * NORMAL:
 * - No tasks scored 0
 * - Total percentage >71%
 * - Majority of tasks scored 2
 */
function calculateRiskCategory(
  taskScores: TaskScoreResult[],
  percentageScore: number
): RiskCategory {
  const numZeros = taskScores.filter(t => t.score === 0).length;
  const criticalZeros = taskScores.filter(
    t => CLASSIFICATION_THRESHOLDS.criticalTasks.includes(t.taskName) && t.score === 0
  ).length;
  
  // High Risk conditions
  if (criticalZeros > 0) return 'high-risk';
  if (numZeros > CLASSIFICATION_THRESHOLDS.maxZerosForBorderline) return 'high-risk';
  if (percentageScore <= CLASSIFICATION_THRESHOLDS.highRiskMaxPercent) return 'high-risk';
  
  // Normal conditions
  if (numZeros === 0 && percentageScore > CLASSIFICATION_THRESHOLDS.borderlineMaxPercent) {
    return 'normal';
  }
  
  // Default to borderline
  return 'borderline';
}

/**
 * Generate risk label and description
 */
function getRiskLabel(category: RiskCategory): string {
  switch (category) {
    case 'normal':
      return 'Normal Range - Age-Appropriate Skills';
    case 'borderline':
      return 'Emerging Skills - Monitor & Encourage';
    case 'high-risk':
      return 'Needs Attention - Consider Evaluation';
  }
}

/**
 * Get color for risk category
 */
export function getRiskColor(category: RiskCategory): 'success' | 'warning' | 'error' {
  switch (category) {
    case 'normal':
      return 'success';
    case 'borderline':
      return 'warning';
    case 'high-risk':
      return 'error';
  }
}

/**
 * Generate overall summary text
 */
function generateOverallSummary(
  category: RiskCategory,
  percentageScore: number,
  numTwos: number,
  numOnes: number,
  numZeros: number,
  totalTasks: number
): string {
  const pct = Math.round(percentageScore);
  
  switch (category) {
    case 'normal':
      return `Excellent motor skills! Scored ${pct}% overall with ${numTwos}/${totalTasks} tasks at full marks. ` +
             `Your child demonstrates age-appropriate gross motor development. Keep up the great work!`;
    
    case 'borderline':
      return `Good progress with room for improvement. Scored ${pct}% overall. ` +
             `${numTwos} task(s) fully achieved, ${numOnes} task(s) partially achieved. ` +
             `Regular practice of movement activities will help strengthen developing skills.`;
    
    case 'high-risk':
      return `Some areas need extra attention. Scored ${pct}% overall with ${numZeros} task(s) needing significant improvement. ` +
             `We recommend discussing these results with a pediatrician or physical therapist for personalized guidance.`;
  }
}

/**
 * Generate recommendations based on assessment
 */
function generateRecommendations(
  category: RiskCategory,
  taskScores: TaskScoreResult[]
): string[] {
  const recommendations: string[] = [];
  
  // General recommendations by category
  switch (category) {
    case 'normal':
      recommendations.push('Continue encouraging active play and varied movement activities');
      recommendations.push('Celebrate your child\'s motor achievements!');
      break;
    
    case 'borderline':
      recommendations.push('Practice daily movement activities for 15-20 minutes');
      recommendations.push('Focus on tasks scored as "Emerging" (score of 1)');
      recommendations.push('Consider age-appropriate sports or movement classes');
      break;
    
    case 'high-risk':
      recommendations.push('Schedule a consultation with your pediatrician');
      recommendations.push('Consider a physical therapy evaluation');
      recommendations.push('Start gentle, play-based movement practice at home');
      break;
  }
  
  // Task-specific recommendations for low scores
  const lowScoreTasks = taskScores.filter(t => t.score <= 1);
  
  for (const task of lowScoreTasks) {
    switch (task.taskName) {
      case 'one_leg':
        if (task.score === 0) {
          recommendations.push('Practice flamingo pose - hold onto a chair at first');
        }
        break;
      case 'walk':
        if (task.score <= 1) {
          recommendations.push('Practice walking on different surfaces (grass, sand, cushions)');
        }
        break;
      case 'jump':
        if (task.score === 0) {
          recommendations.push('Start with mini-trampoline or holding hands for supported jumping');
        }
        break;
      case 'tiptoe':
        if (task.score <= 1) {
          recommendations.push('Practice "reaching for the stars" on tiptoes');
        }
        break;
      case 'squat':
        if (task.score <= 1) {
          recommendations.push('Play "pick up toys" game to practice squatting');
        }
        break;
    }
  }
  
  return recommendations;
}

/**
 * Identify strength and improvement areas
 */
function identifyAreas(taskScores: TaskScoreResult[]): {
  strengths: string[];
  improvements: string[];
} {
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  for (const task of taskScores) {
    if (task.score === 2) {
      strengths.push(task.taskLabel);
    } else if (task.score === 0) {
      improvements.push(`${task.taskLabel} (needs focus)`);
    } else {
      improvements.push(`${task.taskLabel} (developing)`);
    }
  }
  
  return { strengths, improvements };
}

/**
 * Main function: Generate comprehensive motor assessment summary
 * 
 * This aggregates individual task scores and produces an overall classification
 * based on FMS-style composite scoring principles.
 * 
 * @param taskResults - Array of completed task metrics from session
 * @param childAge - Optional child age for age-adjusted assessment
 * @returns Complete motor assessment summary
 * 
 * @example
 * const summary = generateMotorAssessmentSummary([
 *   { task: 'one_leg', metrics: { oneLegScore: 2, holdTime: 5.5 } },
 *   { task: 'walk', metrics: { walkScore: 2, stepCount: 12 } },
 *   // ... other tasks
 * ], 5);
 * console.log(summary.riskCategory); // 'normal', 'borderline', or 'high-risk'
 */
export function generateMotorAssessmentSummary(
  taskResults: Array<{ task: TaskName; metrics: Record<string, number | string>; flags?: string[] }>,
  childAge?: number
): MotorAssessmentSummary {
  // Process each task
  const taskScores: TaskScoreResult[] = taskResults.map(result => {
    const score = extractTaskScore(result.task, result.metrics);
    const notes = generateTaskNotes(result.task, score, result.metrics);
    
    // Add any flags as notes
    if (result.flags && result.flags.length > 0) {
      notes.push(...result.flags.map(f => `Flag: ${f}`));
    }
    
    return {
      taskName: result.task,
      taskLabel: TASK_LABELS[result.task] || result.task,
      score,
      maxScore: 2,
      level: scoreToLevel(score),
      notes,
      metrics: Object.fromEntries(
        Object.entries(result.metrics || {}).filter(([_, v]) => typeof v === 'number')
      ) as Record<string, number>,
    };
  });
  
  // Calculate aggregate scores
  const totalScore = taskScores.reduce((sum, t) => sum + t.score, 0);
  const maxPossibleScore = taskScores.length * 2;
  const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  const averageScore = taskScores.length > 0 ? totalScore / taskScores.length : 0;
  
  // Count score distribution
  const numTwoScores = taskScores.filter(t => t.score === 2).length;
  const numOneScores = taskScores.filter(t => t.score === 1).length;
  const numZeroScores = taskScores.filter(t => t.score === 0).length;
  
  // Calculate risk category
  const riskCategory = calculateRiskCategory(taskScores, percentageScore);
  const riskLabel = getRiskLabel(riskCategory);
  const riskColor = getRiskColor(riskCategory);
  
  // Generate summary and recommendations
  const overallSummary = generateOverallSummary(
    riskCategory,
    percentageScore,
    numTwoScores,
    numOneScores,
    numZeroScores,
    taskScores.length
  );
  
  const recommendations = generateRecommendations(riskCategory, taskScores);
  const { strengths, improvements } = identifyAreas(taskScores);
  
  return {
    taskScores,
    totalScore,
    maxPossibleScore,
    percentageScore,
    averageScore,
    numTwoScores,
    numOneScores,
    numZeroScores,
    riskCategory,
    riskLabel,
    riskColor,
    overallSummary,
    recommendations,
    strengthAreas: strengths,
    improvementAreas: improvements,
    childAge,
    assessmentDate: new Date().toISOString(),
  };
}

/**
 * Generate a formatted text report suitable for display or printing
 * 
 * @param summary - Motor assessment summary
 * @returns Formatted text report
 */
export function generateTextReport(summary: MotorAssessmentSummary): string {
  const lines: string[] = [];
  
  // Header
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('       MOTOR SKILLS ASSESSMENT REPORT');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Date: ${new Date(summary.assessmentDate).toLocaleDateString()}`);
  if (summary.childAge) {
    lines.push(`Child Age: ${summary.childAge} years`);
  }
  lines.push('');
  
  // Overall Result
  lines.push('───────────────────────────────────────────────────────');
  lines.push('OVERALL RESULT');
  lines.push('───────────────────────────────────────────────────────');
  lines.push(`Classification: ${summary.riskLabel}`);
  lines.push(`Total Score: ${summary.totalScore}/${summary.maxPossibleScore} (${Math.round(summary.percentageScore)}%)`);
  lines.push('');
  lines.push(summary.overallSummary);
  lines.push('');
  
  // Task Details
  lines.push('───────────────────────────────────────────────────────');
  lines.push('TASK-BY-TASK RESULTS');
  lines.push('───────────────────────────────────────────────────────');
  
  for (const task of summary.taskScores) {
    const scoreEmoji = task.score === 2 ? '✅' : task.score === 1 ? '🔶' : '❌';
    lines.push(`${scoreEmoji} ${task.taskLabel}: ${task.score}/2`);
    for (const note of task.notes) {
      lines.push(`   • ${note}`);
    }
    lines.push('');
  }
  
  // Strengths
  if (summary.strengthAreas.length > 0) {
    lines.push('───────────────────────────────────────────────────────');
    lines.push('💪 STRENGTH AREAS');
    lines.push('───────────────────────────────────────────────────────');
    for (const strength of summary.strengthAreas) {
      lines.push(`• ${strength}`);
    }
    lines.push('');
  }
  
  // Areas for Improvement
  if (summary.improvementAreas.length > 0) {
    lines.push('───────────────────────────────────────────────────────');
    lines.push('📈 AREAS FOR IMPROVEMENT');
    lines.push('───────────────────────────────────────────────────────');
    for (const area of summary.improvementAreas) {
      lines.push(`• ${area}`);
    }
    lines.push('');
  }
  
  // Recommendations
  lines.push('───────────────────────────────────────────────────────');
  lines.push('📋 RECOMMENDATIONS');
  lines.push('───────────────────────────────────────────────────────');
  for (const rec of summary.recommendations) {
    lines.push(`• ${rec}`);
  }
  lines.push('');
  
  // Disclaimer
  lines.push('───────────────────────────────────────────────────────');
  lines.push('⚠️ IMPORTANT DISCLAIMER');
  lines.push('───────────────────────────────────────────────────────');
  lines.push('This assessment is a screening tool only and does not');
  lines.push('constitute a clinical diagnosis. Results should be');
  lines.push('discussed with qualified healthcare professionals.');
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

/**
 * Quick classification function for simple use cases
 * Returns just the risk category based on task metrics
 * 
 * @param taskMetrics - Object mapping task names to their metrics
 * @returns Risk category
 */
export function quickClassify(
  taskMetrics: Partial<Record<TaskName, Record<string, number | string>>>
): RiskCategory {
  const taskResults = Object.entries(taskMetrics).map(([task, metrics]) => ({
    task: task as TaskName,
    metrics: metrics || {},
  }));
  
  const summary = generateMotorAssessmentSummary(taskResults);
  return summary.riskCategory;
}
