/**
 * Kinematics Utilities
 * Biomechanical calculations for movement analysis
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface ROMResult {
  min: number;
  max: number;
  range: number;
  mean: number;
  standardDeviation: number;
}

export interface SymmetryResult {
  percentageDifference: number;
  isSymmetrical: boolean;
  asymmetryLevel: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface BalanceResult {
  balanceIndex: number;
  stabilityScore: number;
  balanceLevel: 'excellent' | 'good' | 'fair' | 'poor';
  swayMagnitude: number;
}

/**
 * Calculate the angle (in degrees) between three points
 * Point B is the vertex of the angle
 * 
 * @param A - First point (start of first line segment)
 * @param B - Second point (vertex/joint)
 * @param C - Third point (end of second line segment)
 * @returns Angle in degrees (0-180)
 * 
 * @example
 * const shoulder = { x: 0.5, y: 0.3 };
 * const elbow = { x: 0.6, y: 0.5 };
 * const wrist = { x: 0.7, y: 0.4 };
 * const elbowAngle = calculateAngle(shoulder, elbow, wrist);
 */
export function calculateAngle(
  A: Point2D | Point3D,
  B: Point2D | Point3D,
  C: Point2D | Point3D
): number {
  // Calculate vectors BA and BC
  const BA = {
    x: A.x - B.x,
    y: A.y - B.y,
    z: 'z' in A && 'z' in B ? A.z - B.z : 0,
  };

  const BC = {
    x: C.x - B.x,
    y: C.y - B.y,
    z: 'z' in C && 'z' in B ? C.z - B.z : 0,
  };

  // Calculate dot product
  const dotProduct = BA.x * BC.x + BA.y * BC.y + BA.z * BC.z;

  // Calculate magnitudes
  const magnitudeBA = Math.sqrt(BA.x ** 2 + BA.y ** 2 + BA.z ** 2);
  const magnitudeBC = Math.sqrt(BC.x ** 2 + BC.y ** 2 + BC.z ** 2);

  // Avoid division by zero
  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0;
  }

  // Calculate angle using dot product formula
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);

  // Clamp cosAngle to [-1, 1] to avoid NaN from acos
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));

  // Convert to degrees
  const angleRadians = Math.acos(clampedCos);
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return angleDegrees;
}

/**
 * Calculate Range of Motion (ROM) from a series of angle measurements
 * 
 * @param angleSeries - Array of angle measurements in degrees
 * @returns ROM statistics including min, max, range, mean, and standard deviation
 * 
 * @example
 * const kneeAngles = [120, 135, 140, 145, 150, 155, 160, 165, 170];
 * const rom = calculateROM(kneeAngles);
 * console.log(`Range of motion: ${rom.range}°`);
 */
export function calculateROM(angleSeries: number[]): ROMResult {
  if (angleSeries.length === 0) {
    return {
      min: 0,
      max: 0,
      range: 0,
      mean: 0,
      standardDeviation: 0,
    };
  }

  // Find minimum and maximum angles
  const min = Math.min(...angleSeries);
  const max = Math.max(...angleSeries);
  const range = max - min;

  // Calculate mean
  const sum = angleSeries.reduce((acc, angle) => acc + angle, 0);
  const mean = sum / angleSeries.length;

  // Calculate standard deviation
  const squaredDifferences = angleSeries.map((angle) => (angle - mean) ** 2);
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / angleSeries.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    min,
    max,
    range,
    mean,
    standardDeviation,
  };
}

/**
 * Calculate symmetry between left and right body measurements
 * Returns percentage difference and symmetry classification
 * 
 * @param leftValue - Measurement from left side (e.g., left knee angle)
 * @param rightValue - Measurement from right side (e.g., right knee angle)
 * @returns Symmetry analysis including percentage difference and classification
 * 
 * @example
 * const leftKneeAngle = 140;
 * const rightKneeAngle = 145;
 * const symmetry = calculateSymmetry(leftKneeAngle, rightKneeAngle);
 * console.log(`Asymmetry: ${symmetry.percentageDifference.toFixed(2)}%`);
 */
export function calculateSymmetry(
  leftValue: number,
  rightValue: number
): SymmetryResult {
  // Handle edge cases
  if (leftValue === 0 && rightValue === 0) {
    return {
      percentageDifference: 0,
      isSymmetrical: true,
      asymmetryLevel: 'excellent',
    };
  }

  // Calculate absolute difference
  const difference = Math.abs(leftValue - rightValue);

  // Calculate average to use as reference
  const average = (leftValue + rightValue) / 2;

  // Avoid division by zero
  if (average === 0) {
    return {
      percentageDifference: 100,
      isSymmetrical: false,
      asymmetryLevel: 'poor',
    };
  }

  // Calculate percentage difference
  const percentageDifference = (difference / average) * 100;

  // Determine symmetry level
  let isSymmetrical = false;
  let asymmetryLevel: 'excellent' | 'good' | 'fair' | 'poor';

  if (percentageDifference <= 5) {
    isSymmetrical = true;
    asymmetryLevel = 'excellent';
  } else if (percentageDifference <= 10) {
    asymmetryLevel = 'good';
  } else if (percentageDifference <= 20) {
    asymmetryLevel = 'fair';
  } else {
    asymmetryLevel = 'poor';
  }

  return {
    percentageDifference,
    isSymmetrical,
    asymmetryLevel,
  };
}

/**
 * Calculate balance index based on center of mass sway
 * Analyzes movement in X and Y directions to determine stability
 * 
 * @param swayX - Array of X-axis sway measurements (normalized coordinates)
 * @param swayY - Array of Y-axis sway measurements (normalized coordinates)
 * @returns Balance analysis including balance index, stability score, and classification
 * 
 * @example
 * const swayX = [0.5, 0.51, 0.49, 0.52, 0.48, 0.5];
 * const swayY = [0.5, 0.51, 0.5, 0.49, 0.52, 0.5];
 * const balance = calculateBalance(swayX, swayY);
 * console.log(`Balance level: ${balance.balanceLevel}`);
 */
export function calculateBalance(
  swayX: number[],
  swayY: number[]
): BalanceResult {
  if (swayX.length === 0 || swayY.length === 0 || swayX.length !== swayY.length) {
    return {
      balanceIndex: 0,
      stabilityScore: 0,
      balanceLevel: 'poor',
      swayMagnitude: 0,
    };
  }

  // Calculate mean positions
  const meanX = swayX.reduce((acc, val) => acc + val, 0) / swayX.length;
  const meanY = swayY.reduce((acc, val) => acc + val, 0) / swayY.length;

  // Calculate standard deviations (sway variability)
  const varianceX = swayX.reduce((acc, val) => acc + (val - meanX) ** 2, 0) / swayX.length;
  const varianceY = swayY.reduce((acc, val) => acc + (val - meanY) ** 2, 0) / swayY.length;
  const stdX = Math.sqrt(varianceX);
  const stdY = Math.sqrt(varianceY);

  // Calculate total sway magnitude (root mean square of deviations)
  let totalSwaySquared = 0;
  for (let i = 0; i < swayX.length; i++) {
    const dx = swayX[i] - meanX;
    const dy = swayY[i] - meanY;
    totalSwaySquared += dx ** 2 + dy ** 2;
  }
  const swayMagnitude = Math.sqrt(totalSwaySquared / swayX.length);

  // Calculate sway path length (total distance traveled)
  let pathLength = 0;
  for (let i = 1; i < swayX.length; i++) {
    const dx = swayX[i] - swayX[i - 1];
    const dy = swayY[i] - swayY[i - 1];
    pathLength += Math.sqrt(dx ** 2 + dy ** 2);
  }

  // Calculate sway area (ellipse area using 95% confidence interval)
  const swayArea = Math.PI * 2.45 * stdX * 2.45 * stdY;

  // Calculate balance index (lower is better)
  // Combines sway magnitude, path length, and area
  const balanceIndex = (swayMagnitude * 100 + pathLength * 10 + swayArea * 1000);

  // Calculate stability score (0-100, higher is better)
  // Inverse relationship with balance index
  const maxBalanceIndex = 50; // Threshold for poor balance
  const stabilityScore = Math.max(0, Math.min(100, 100 - (balanceIndex / maxBalanceIndex) * 100));

  // Determine balance level
  let balanceLevel: 'excellent' | 'good' | 'fair' | 'poor';

  if (stabilityScore >= 80) {
    balanceLevel = 'excellent';
  } else if (stabilityScore >= 60) {
    balanceLevel = 'good';
  } else if (stabilityScore >= 40) {
    balanceLevel = 'fair';
  } else {
    balanceLevel = 'poor';
  }

  return {
    balanceIndex,
    stabilityScore: Math.round(stabilityScore * 10) / 10,
    balanceLevel,
    swayMagnitude: Math.round(swayMagnitude * 1000) / 1000,
  };
}

/**
 * Helper function to calculate distance between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Euclidean distance
 */
export function calculateDistance(p1: Point2D | Point3D, p2: Point2D | Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = ('z' in p1 && 'z' in p2) ? (p2.z - p1.z) : 0;
  
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

/**
 * Calculate velocity between two points over time
 * @param p1 - First point
 * @param p2 - Second point
 * @param deltaTime - Time difference in seconds
 * @returns Velocity in units per second
 */
export function calculateVelocity(
  p1: Point2D | Point3D,
  p2: Point2D | Point3D,
  deltaTime: number
): number {
  if (deltaTime === 0) return 0;
  
  const distance = calculateDistance(p1, p2);
  return distance / deltaTime;
}

/**
 * Smooth angle series using moving average
 * @param angleSeries - Array of angle measurements
 * @param windowSize - Size of the moving average window
 * @returns Smoothed angle series
 */
export function smoothAngleSeries(angleSeries: number[], windowSize: number = 5): number[] {
  if (angleSeries.length < windowSize) {
    return angleSeries;
  }

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < angleSeries.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(angleSeries.length, i + halfWindow + 1);
    const window = angleSeries.slice(start, end);
    const average = window.reduce((acc, val) => acc + val, 0) / window.length;
    smoothed.push(average);
  }

  return smoothed;
}

/**
 * Helper function compatible with CoachOverlay - calculates angle from three points
 */
export function angleFrom(
  A: { x: number; y: number },
  B: { x: number; y: number },
  C: { x: number; y: number }
): number {
  return calculateAngle(A, B, C);
}

/**
 * Calculate right shoulder flexion angle from MediaPipe pose landmarks
 * 
 * Shoulder Flexion Measurement:
 * - 0° = arm at side (neutral)
 * - 90° = arm horizontal (shoulder height)
 * - 150-180° = arm overhead (full flexion)
 * 
 * Normal ROM: Full shoulder flexion is ~180° (arm aligned with ear)
 * Reference: AAOS standard ROM values
 * 
 * MediaPipe landmarks: 12=right shoulder, 14=right elbow, 24=right hip
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Shoulder flexion angle in degrees (0-180)
 */
export function getRightShoulderFlexion(landmarks: any[]): number {
  if (!landmarks || landmarks.length < 25) return 0;

  const rightShoulder = landmarks[12];
  const rightElbow = landmarks[14];
  const rightHip = landmarks[24];

  if (!rightShoulder || !rightElbow || !rightHip) return 0;

  // Calculate angle: hip -> shoulder -> elbow
  // This gives us the angle between trunk and upper arm
  return calculateAngle(rightHip, rightShoulder, rightElbow);
}

/**
 * Calculate left shoulder flexion angle
 * Same methodology as right shoulder
 * 
 * MediaPipe landmarks: 11=left shoulder, 13=left elbow, 23=left hip
 */
export function getLeftShoulderFlexion(landmarks: any[]): number {
  if (!landmarks || landmarks.length < 25) return 0;

  const leftShoulder = landmarks[11];
  const leftElbow = landmarks[13];
  const leftHip = landmarks[23];

  if (!leftShoulder || !leftElbow || !leftHip) return 0;

  return calculateAngle(leftHip, leftShoulder, leftElbow);
}

/**
 * Calculate elbow extension angle
 * 
 * Elbow Extension Measurement:
 * - ~30-40° = fully bent (flexed)
 * - 180° = fully straight (extended)
 * 
 * For proper overhead arm raise, elbow should be nearly straight (≥170°)
 * 
 * MediaPipe landmarks: 
 * - Right: 12=shoulder, 14=elbow, 16=wrist
 * - Left: 11=shoulder, 13=elbow, 15=wrist
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @param side - 'left' or 'right' arm
 * @returns Elbow extension angle in degrees (0-180, higher = straighter)
 */
export function getElbowExtension(landmarks: any[], side: 'left' | 'right'): number {
  if (!landmarks || landmarks.length < 17) return 180;

  // Landmark indices for left vs right
  const shoulderIdx = side === 'left' ? 11 : 12;
  const elbowIdx = side === 'left' ? 13 : 14;
  const wristIdx = side === 'left' ? 15 : 16;

  const shoulder = landmarks[shoulderIdx];
  const elbow = landmarks[elbowIdx];
  const wrist = landmarks[wristIdx];

  if (!shoulder || !elbow || !wrist) return 180;

  // Calculate angle: shoulder -> elbow -> wrist
  // 180° = fully straight arm
  return calculateAngle(shoulder, elbow, wrist);
}

/**
 * Comprehensive bilateral shoulder flexion assessment
 * Returns detailed metrics for both arms including flexion and extension angles
 * 
 * Used for clinical assessment of overhead arm raise:
 * - Target shoulder flexion: ≥150° (near full overhead)
 * - Target elbow extension: ≥170° (nearly straight)
 * - Normal full ROM: 180° for both
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with bilateral assessment data
 */
export function assessBilateralShoulderFlexion(landmarks: any[]): {
  leftShoulderAngle: number;
  rightShoulderAngle: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  leftArmFullRaise: boolean;
  rightArmFullRaise: boolean;
  bothArmsFullRaise: boolean;
  bestShoulderAngle: number;
  symmetryDifference: number;
} {
  // Default return for invalid landmarks
  const defaultReturn = {
    leftShoulderAngle: 0,
    rightShoulderAngle: 0,
    leftElbowAngle: 180,
    rightElbowAngle: 180,
    leftArmFullRaise: false,
    rightArmFullRaise: false,
    bothArmsFullRaise: false,
    bestShoulderAngle: 0,
    symmetryDifference: 0,
  };

  if (!landmarks || landmarks.length < 17) return defaultReturn;

  // Get key landmarks
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
    return defaultReturn;
  }

  // === BIOMECHANICALLY VALID SHOULDER FLEXION MEASUREMENT ===
  // Shoulder flexion angle: measured as angle hip → shoulder → elbow
  // 0° = arm at side, 90° = arm horizontal, 180° = arm overhead
  // Reference: AAOS standard - normal shoulder flexion ROM is 150-180°
  
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  // Calculate true shoulder flexion angle using hip → shoulder → elbow
  // This is the anatomically correct measurement
  let leftShoulderAngle = 0;
  let rightShoulderAngle = 0;
  
  if (leftHip && leftShoulder && leftElbow) {
    leftShoulderAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
  }
  if (rightHip && rightShoulder && rightElbow) {
    rightShoulderAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
  }
  
  // Calculate elbow extension angles
  const leftElbowAngle = leftElbow ? getElbowExtension(landmarks, 'left') : 180;
  const rightElbowAngle = rightElbow ? getElbowExtension(landmarks, 'right') : 180;
  
  // === PASS/FAIL CRITERIA ===
  // Raise Hand task requires shoulder flexion ≥ 90° (arm at or above horizontal)
  // Full ROM achievement is ≥ 150° (near-overhead)
  const MINIMUM_FLEXION_PASS = 90; // Minimum to pass
  const FULL_FLEXION_TARGET = 150; // Target for full ROM
  
  // Determine if each arm passes minimum criteria (≥90°)
  const leftArmFullRaise = leftShoulderAngle >= MINIMUM_FLEXION_PASS;
  const rightArmFullRaise = rightShoulderAngle >= MINIMUM_FLEXION_PASS;
  const bothArmsFullRaise = leftArmFullRaise && rightArmFullRaise;
  
  // Best shoulder angle achieved
  const bestShoulderAngle = Math.max(leftShoulderAngle, rightShoulderAngle);
  
  // Symmetry difference between arms
  const symmetryDifference = Math.abs(leftShoulderAngle - rightShoulderAngle);

  return {
    leftShoulderAngle,
    rightShoulderAngle,
    leftElbowAngle,
    rightElbowAngle,
    leftArmFullRaise,
    rightArmFullRaise,
    bothArmsFullRaise,
    bestShoulderAngle,
    symmetryDifference,
  };
}

/**
 * Detect back compensation (arching) during overhead arm raise
 * 
 * When shoulder mobility is limited, children may compensate by:
 * - Arching the lower back (lumbar hyperextension)
 * - Leaning backward
 * 
 * Detection: Compare trunk lean angle - if excessive backward lean (>15°)
 * while attempting arm raise, compensation is occurring
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with compensation detection data
 */
export function detectBackCompensation(landmarks: any[]): {
  isCompensating: boolean;
  backLeanAngle: number;
  compensationType: 'none' | 'mild' | 'significant';
} {
  if (!landmarks || landmarks.length < 25) {
    return {
      isCompensating: false,
      backLeanAngle: 0,
      compensationType: 'none',
    };
  }

  // Calculate trunk lean using shoulder and hip midpoints
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return {
      isCompensating: false,
      backLeanAngle: 0,
      compensationType: 'none',
    };
  }

  // Calculate midpoints
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;

  // Calculate backward lean angle
  // Positive = leaning backward (shoulders behind hips in x-axis)
  // In camera view: if shoulders x > hips x = leaning back
  const dx = shoulderMidX - hipMidX;
  const dy = hipMidY - shoulderMidY; // Y increases downward

  // Calculate angle from vertical (backward lean)
  // Positive angle = backward lean
  const backLeanAngle = Math.atan2(dx, dy) * (180 / Math.PI);

  // Thresholds for compensation
  const MILD_COMPENSATION = 10; // 10-20° = mild
  const SIGNIFICANT_COMPENSATION = 20; // >20° = significant

  let compensationType: 'none' | 'mild' | 'significant' = 'none';
  let isCompensating = false;

  if (backLeanAngle > SIGNIFICANT_COMPENSATION) {
    compensationType = 'significant';
    isCompensating = true;
  } else if (backLeanAngle > MILD_COMPENSATION) {
    compensationType = 'mild';
    isCompensating = true;
  }

  return {
    isCompensating,
    backLeanAngle: Math.abs(backLeanAngle),
    compensationType,
  };
}

/**
 * Calculate basic sway index from pose center movement
 * Returns normalized sway value (higher = more sway)
 */
export function calculateSway(
  landmarks: any[],
  previousLandmarks: any[] | null
): number {
  if (!landmarks || !previousLandmarks || landmarks.length < 25) return 0;

  // Use hip midpoint as center
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const prevLeftHip = previousLandmarks[23];
  const prevRightHip = previousLandmarks[24];

  if (!leftHip || !rightHip || !prevLeftHip || !prevRightHip) return 0;

  const currentCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const prevCenter = {
    x: (prevLeftHip.x + prevRightHip.x) / 2,
    y: (prevLeftHip.y + prevRightHip.y) / 2,
  };

  const dx = currentCenter.x - prevCenter.x;
  const dy = currentCenter.y - prevCenter.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if right foot is lifted (one-leg balance detection)
 */
export function isRightFootLifted(landmarks: any[]): boolean {
  if (!landmarks || landmarks.length < 32) return false;

  const rightAnkle = landmarks[28];
  const leftAnkle = landmarks[27];

  if (!rightAnkle || !leftAnkle) return false;

  // Right foot is lifted if ankle is significantly higher than left ankle
  const heightDiff = leftAnkle.y - rightAnkle.y;
  return heightDiff > 0.05; // Threshold for normalized coordinates
}

/**
 * Check if left foot is lifted
 */
export function isLeftFootLifted(landmarks: any[]): boolean {
  if (!landmarks || landmarks.length < 32) return false;

  const rightAnkle = landmarks[28];
  const leftAnkle = landmarks[27];

  if (!rightAnkle || !leftAnkle) return false;

  const heightDiff = rightAnkle.y - leftAnkle.y;
  return heightDiff > 0.05;
}

/**
 * Calculate knee flexion angle for detecting raised leg
 * A significantly bent knee (~45° or more) indicates foot lifted off ground
 * MediaPipe landmarks: 23/24=hip, 25/26=knee, 27/28=ankle
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @param side - 'left' or 'right' knee
 * @returns Knee flexion angle in degrees (180 = straight leg, <135 = bent)
 */
export function getKneeFlexion(landmarks: any[], side: 'left' | 'right'): number {
  if (!landmarks || landmarks.length < 29) return 180;

  // Landmark indices for left vs right
  const hipIdx = side === 'left' ? 23 : 24;
  const kneeIdx = side === 'left' ? 25 : 26;
  const ankleIdx = side === 'left' ? 27 : 28;

  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];

  if (!hip || !knee || !ankle) return 180;

  // Calculate angle: hip -> knee -> ankle
  // 180° = straight leg, <135° = significantly bent (~45° flexion from straight)
  return calculateAngle(hip, knee, ankle);
}

/**
 * Calculate trunk lean angle from vertical using shoulder and hip landmarks
 * Used to detect excessive sway during one-leg balance test
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Trunk lean angle in degrees from vertical (0 = perfectly upright)
 * 
 * Based on BESS (Balance Error Scoring System) standards:
 * - < 10° = excellent stability
 * - 10-20° = acceptable sway
 * - > 20° = loss of balance / excessive sway
 */
export function getTrunkLeanAngle(landmarks: any[]): number {
  if (!landmarks || landmarks.length < 25) return 0;

  // Use midpoints of shoulders and hips for trunk axis
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;

  // Calculate midpoints
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  // Calculate angle from vertical
  // Vertical line would have dx=0, so angle = atan2(dx, dy)
  const dx = shoulderMid.x - hipMid.x;
  const dy = hipMid.y - shoulderMid.y; // Note: y increases downward in image coords

  // Calculate angle in degrees from vertical axis
  const angleRadians = Math.atan2(Math.abs(dx), Math.abs(dy));
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return angleDegrees;
}

/**
 * Detect if both heels are lifted (tip-toe stance)
 * Uses ankle plantarflexion angle measurement
 * Tiptoe requires ankle plantarflexion ≥30° (foot pointing down)
 * 
 * MediaPipe landmarks: 25/26=knee, 27/28=ankle, 29/30=heel, 31/32=foot index (toe)
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with heel lift detection, plantarflexion angles, and pass/fail
 */
export function detectHeelsLifted(landmarks: any[]): {
  bothHeelsLifted: boolean;
  leftHeelLifted: boolean;
  rightHeelLifted: boolean;
  leftHeelHeight: number;
  rightHeelHeight: number;
  leftPlantarflexion: number;  // Raw angle in degrees
  rightPlantarflexion: number;
  pass: boolean;  // Strict pass/fail (≥30° plantarflexion)
} {
  if (!landmarks || landmarks.length < 29) {
    return {
      bothHeelsLifted: false,
      leftHeelLifted: false,
      rightHeelLifted: false,
      leftHeelHeight: 0,
      rightHeelHeight: 0,
      leftPlantarflexion: 0,
      rightPlantarflexion: 0,
      pass: false,
    };
  }

  // === BIOMECHANICALLY VALID TIPTOE DETECTION ===
  // Tiptoe (heels raised) is detected by ankle plantarflexion angle
  // When on tiptoes, the ankle joint extends (plantarflexion)
  // Normal standing ankle angle ≈ 90° (foot perpendicular to shin)
  // On tiptoes, ankle angle decreases (foot points down), plantarflexion increases
  // 
  // Ankle plantarflexion angle measurement: knee → ankle → toe
  // Standing: ~90°, On tiptoes: <60° (plantarflexion ≥30°)
  
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftHeel = landmarks[29];
  const rightHeel = landmarks[30];
  const leftToe = landmarks[31];  // foot_index
  const rightToe = landmarks[32];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee || !leftHip || !rightHip) {
    return {
      bothHeelsLifted: false,
      leftHeelLifted: false,
      rightHeelLifted: false,
      leftHeelHeight: 0,
      rightHeelHeight: 0,
      leftPlantarflexion: 0,
      rightPlantarflexion: 0,
      pass: false,
    };
  }

  // Calculate ankle angle (knee → ankle → toe/heel)
  // Normal standing ≈ 90°, on tiptoes = smaller angle
  let leftAnkleAngle = 90; // Default
  let rightAnkleAngle = 90;
  
  // Try to use toe landmark for more accurate measurement
  if (leftToe && leftToe.visibility > 0.5) {
    leftAnkleAngle = calculateAngle(leftKnee, leftAnkle, leftToe);
  } else if (leftHeel && leftHeel.visibility > 0.5) {
    // Fallback: use heel if toe not visible
    leftAnkleAngle = calculateAngle(leftKnee, leftAnkle, leftHeel);
  }
  
  if (rightToe && rightToe.visibility > 0.5) {
    rightAnkleAngle = calculateAngle(rightKnee, rightAnkle, rightToe);
  } else if (rightHeel && rightHeel.visibility > 0.5) {
    rightAnkleAngle = calculateAngle(rightKnee, rightAnkle, rightHeel);
  }
  
  // Calculate plantarflexion (how much ankle is extended beyond neutral)
  // Plantarflexion = 90° - ankle_angle (when ankle angle < 90°)
  const leftPlantarflexion = Math.max(0, 90 - leftAnkleAngle);
  const rightPlantarflexion = Math.max(0, 90 - rightAnkleAngle);
  
  // Also use heel Y position as backup indicator
  // When on tiptoes, heels rise (Y decreases in screen coords)
  const heelHeightDiff = leftHeel && rightHeel ? 
    Math.min(leftAnkle.y - leftHeel.y, rightAnkle.y - rightHeel.y) : 0;
  
  // Also check ankle rise relative to normal standing
  // Calculate leg length ratio as backup
  const leftUpperLeg = Math.abs(leftKnee.y - leftHip.y);
  const leftLowerLeg = Math.abs(leftAnkle.y - leftKnee.y);
  const rightUpperLeg = Math.abs(rightKnee.y - rightHip.y);
  const rightLowerLeg = Math.abs(rightAnkle.y - rightKnee.y);
  const leftLegRatio = leftUpperLeg > 0 ? leftLowerLeg / leftUpperLeg : 1;
  const rightLegRatio = rightUpperLeg > 0 ? rightLowerLeg / rightUpperLeg : 1;
  
  // === PASS/FAIL CRITERIA ===
  // Tiptoe requires ankle plantarflexion ≥ 30° OR clear heel elevation
  const PLANTARFLEXION_THRESHOLD = 30; // degrees
  const LEG_RATIO_THRESHOLD = 0.95; // Lower ratio indicates raised heels
  const HEEL_HEIGHT_THRESHOLD = 0.02; // Normalized heel rise
  
  // Check plantarflexion angle first (primary method)
  const leftByAngle = leftPlantarflexion >= PLANTARFLEXION_THRESHOLD;
  const rightByAngle = rightPlantarflexion >= PLANTARFLEXION_THRESHOLD;
  
  // Backup: check leg ratio (ankle appears higher)
  const leftByRatio = leftLegRatio < LEG_RATIO_THRESHOLD;
  const rightByRatio = rightLegRatio < LEG_RATIO_THRESHOLD;
  
  // Backup: check heel height
  const heelRise = heelHeightDiff > HEEL_HEIGHT_THRESHOLD;
  
  // Pass if any strong indicator is present
  const leftHeelLifted = leftByAngle || leftByRatio || heelRise;
  const rightHeelLifted = rightByAngle || rightByRatio || heelRise;
  const bothHeelsLifted = leftHeelLifted && rightHeelLifted;
  
  // Calculate heel height as visual indicator (normalized 0-1)
  const leftHeelHeight = Math.min(1, leftPlantarflexion / 45);
  const rightHeelHeight = Math.min(1, rightPlantarflexion / 45);
  
  // Overall pass (both heels lifted with ≥30° plantarflexion)
  const pass = bothHeelsLifted && (leftPlantarflexion >= PLANTARFLEXION_THRESHOLD || rightPlantarflexion >= PLANTARFLEXION_THRESHOLD);

  return {
    bothHeelsLifted,
    leftHeelLifted,
    rightHeelLifted,
    leftHeelHeight,
    rightHeelHeight,
    leftPlantarflexion,
    rightPlantarflexion,
    pass,
  };
}

/**
 * Detect if arms are raised overhead
 * Arms are overhead when wrists are above the head (nose/eyes level)
 * MediaPipe landmarks: 0=nose, 15/16=wrist
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with arm position detection
 */
export function detectArmsOverhead(landmarks: any[]): {
  bothArmsOverhead: boolean;
  leftArmOverhead: boolean;
  rightArmOverhead: boolean;
  leftWristHeight: number; // How high above head (positive = above)
  rightWristHeight: number;
} {
  if (!landmarks || landmarks.length < 17) {
    return {
      bothArmsOverhead: false,
      leftArmOverhead: false,
      rightArmOverhead: false,
      leftWristHeight: 0,
      rightWristHeight: 0,
    };
  }

  const nose = landmarks[0];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  
  // Also check shoulder position for reference
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!nose || !leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
    return {
      bothArmsOverhead: false,
      leftArmOverhead: false,
      rightArmOverhead: false,
      leftWristHeight: 0,
      rightWristHeight: 0,
    };
  }

  // Calculate how high wrists are above shoulder level
  // Note: In image coordinates, smaller y = higher up
  // Using shoulder level instead of nose - more lenient for children
  const shoulderLevel = (leftShoulder.y + rightShoulder.y) / 2;
  const headLevel = nose.y;
  
  // Height above shoulder (positive = above shoulder)
  const leftWristAboveShoulder = shoulderLevel - leftWrist.y;
  const rightWristAboveShoulder = shoulderLevel - rightWrist.y;
  
  // Height above head for display
  const leftWristHeight = headLevel - leftWrist.y;
  const rightWristHeight = headLevel - rightWrist.y;
  
  // Threshold: wrist should be above shoulder level (much more lenient)
  const OVERHEAD_THRESHOLD = 0.02; // Just slightly above shoulders
  
  const leftArmOverhead = leftWristAboveShoulder > OVERHEAD_THRESHOLD;
  const rightArmOverhead = rightWristAboveShoulder > OVERHEAD_THRESHOLD;
  const bothArmsOverhead = leftArmOverhead && rightArmOverhead;

  return {
    bothArmsOverhead,
    leftArmOverhead,
    rightArmOverhead,
    leftWristHeight,
    rightWristHeight,
  };
}

/**
 * Calculate foot movement/shift from previous position
 * Used to detect if feet are moving during tip-toe stance
 * 
 * @param landmarks - Current frame landmarks
 * @param previousLandmarks - Previous frame landmarks
 * @returns Movement magnitude (normalized coordinates)
 */
export function calculateFootMovement(
  landmarks: any[],
  previousLandmarks: any[] | null
): number {
  if (!landmarks || !previousLandmarks || landmarks.length < 33) return 0;

  const leftToe = landmarks[31];
  const rightToe = landmarks[32];
  const prevLeftToe = previousLandmarks[31];
  const prevRightToe = previousLandmarks[32];

  if (!leftToe || !rightToe || !prevLeftToe || !prevRightToe) return 0;

  // Calculate movement of toe positions (x and y)
  const leftDx = leftToe.x - prevLeftToe.x;
  const leftDy = leftToe.y - prevLeftToe.y;
  const rightDx = rightToe.x - prevRightToe.x;
  const rightDy = rightToe.y - prevRightToe.y;

  // Calculate total movement magnitude
  const leftMovement = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
  const rightMovement = Math.sqrt(rightDx * rightDx + rightDy * rightDy);

  return Math.max(leftMovement, rightMovement);
}

// ============= SQUAT ASSESSMENT FUNCTIONS =============

/**
 * Calculate bilateral knee flexion angles for squat assessment
 * 
 * Squat Depth Reference:
 * - Standing: ~170-180° (straight legs)
 * - Partial squat: ~120-150°
 * - Parallel squat: ~90° (thighs parallel to floor)
 * - Deep squat: <90°
 * 
 * MediaPipe landmarks: 23/24=hip, 25/26=knee, 27/28=ankle
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with bilateral knee angles
 */
export function assessSquatDepth(landmarks: any[]): {
  leftKneeAngle: number;
  rightKneeAngle: number;
  averageKneeAngle: number;
  squatDepth: 'standing' | 'partial' | 'parallel' | 'deep';
  symmetryDifference: number;
} {
  if (!landmarks || landmarks.length < 29) {
    return {
      leftKneeAngle: 180,
      rightKneeAngle: 180,
      averageKneeAngle: 180,
      squatDepth: 'standing',
      symmetryDifference: 0,
    };
  }

  // Get landmarks for both legs
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return {
      leftKneeAngle: 180,
      rightKneeAngle: 180,
      averageKneeAngle: 180,
      squatDepth: 'standing',
      symmetryDifference: 0,
    };
  }

  // Calculate knee flexion angles using hip -> knee -> ankle
  // Angle at the knee joint: smaller angle = deeper squat
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const averageKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  const symmetryDifference = Math.abs(leftKneeAngle - rightKneeAngle);

  // === ALSO USE HIP HEIGHT AS BACKUP DETECTION ===
  // Check if hips have dropped significantly (hip Y increases = lower)
  // This helps when angle detection is unreliable
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  const kneeMidY = (leftKnee.y + rightKnee.y) / 2;
  const ankleMidY = (leftAnkle.y + rightAnkle.y) / 2;
  
  // If hips are below knee level or close to it, that's a deep squat
  const hipToKneeRatio = (kneeMidY - hipMidY) / (ankleMidY - hipMidY);
  // hipToKneeRatio close to 0 = hips near knees = deep squat
  // hipToKneeRatio close to 1 = hips near ankles = very deep

  // Classify squat depth based on knee angle
  // Adjusted thresholds for more forgiving detection (especially for children)
  // Reference: 90° = thighs parallel to floor, but most people consider 110-120° a good squat
  let squatDepth: 'standing' | 'partial' | 'parallel' | 'deep';
  
  // Use both angle AND hip position for robust detection
  if (averageKneeAngle >= 160 && hipToKneeRatio > 0.6) {
    squatDepth = 'standing';
  } else if (averageKneeAngle > 130 || hipToKneeRatio > 0.4) {
    squatDepth = 'partial';
  } else if (averageKneeAngle >= 100 || hipToKneeRatio > 0.2) {
    squatDepth = 'parallel'; // Good squat depth
  } else {
    squatDepth = 'deep'; // <100° or hips very low
  }

  return {
    leftKneeAngle,
    rightKneeAngle,
    averageKneeAngle,
    squatDepth,
    symmetryDifference,
  };
}

/**
 * Calculate hip flexion angle (trunk lean) during squat
 * 
 * Proper squat form: trunk should lean forward slightly (45-70° from vertical)
 * to maintain balance, but not excessively
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Hip flexion angle and trunk lean classification
 */
export function assessSquatTrunkLean(landmarks: any[]): {
  hipFlexionAngle: number;
  trunkLeanLevel: 'upright' | 'good' | 'excessive';
} {
  if (!landmarks || landmarks.length < 25) {
    return {
      hipFlexionAngle: 180,
      trunkLeanLevel: 'upright',
    };
  }

  // Calculate trunk angle using shoulder-hip-knee
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee) {
    return {
      hipFlexionAngle: 180,
      trunkLeanLevel: 'upright',
    };
  }

  // Calculate midpoints
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };
  const kneeMid = {
    x: (leftKnee.x + rightKnee.x) / 2,
    y: (leftKnee.y + rightKnee.y) / 2,
  };

  // Calculate hip flexion angle: shoulder -> hip -> knee
  const hipFlexionAngle = calculateAngle(shoulderMid, hipMid, kneeMid);

  // Classify trunk lean
  // 180° = fully upright, ~90-120° = good forward lean during squat
  let trunkLeanLevel: 'upright' | 'good' | 'excessive';
  if (hipFlexionAngle >= 150) {
    trunkLeanLevel = 'upright'; // Too upright (might fall backward)
  } else if (hipFlexionAngle >= 70) {
    trunkLeanLevel = 'good'; // Good forward lean for balance
  } else {
    trunkLeanLevel = 'excessive'; // Too much forward lean
  }

  return {
    hipFlexionAngle,
    trunkLeanLevel,
  };
}

/**
 * Detect knee valgus (knees caving inward) during squat
 * 
 * Proper form: knees should track over toes, not collapse inward
 * Valgus is detected when knee-to-knee distance is significantly less than
 * ankle-to-ankle distance
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with valgus detection data
 */
export function detectKneeValgus(landmarks: any[]): {
  hasValgus: boolean;
  valgusLevel: 'none' | 'mild' | 'significant';
  kneeToAnkleRatio: number;
  kneeDistance: number;
  ankleDistance: number;
} {
  if (!landmarks || landmarks.length < 29) {
    return {
      hasValgus: false,
      valgusLevel: 'none',
      kneeToAnkleRatio: 1,
      kneeDistance: 0,
      ankleDistance: 0,
    };
  }

  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return {
      hasValgus: false,
      valgusLevel: 'none',
      kneeToAnkleRatio: 1,
      kneeDistance: 0,
      ankleDistance: 0,
    };
  }

  // Calculate horizontal distances (x-axis)
  const kneeDistance = Math.abs(rightKnee.x - leftKnee.x);
  const ankleDistance = Math.abs(rightAnkle.x - leftAnkle.x);

  // Calculate ratio: knees should be at least as wide as ankles
  // Ratio < 0.8 suggests knees are caving inward
  const kneeToAnkleRatio = ankleDistance > 0 ? kneeDistance / ankleDistance : 1;

  // Classify valgus severity
  let valgusLevel: 'none' | 'mild' | 'significant';
  let hasValgus = false;

  if (kneeToAnkleRatio >= 0.85) {
    valgusLevel = 'none'; // Knees tracking well
  } else if (kneeToAnkleRatio >= 0.7) {
    valgusLevel = 'mild';
    hasValgus = true;
  } else {
    valgusLevel = 'significant';
    hasValgus = true;
  }

  return {
    hasValgus,
    valgusLevel,
    kneeToAnkleRatio,
    kneeDistance,
    ankleDistance,
  };
}

/**
 * Detect if heels are lifting during squat (common form issue)
 * Uses ankle and heel landmark positions
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with heel lift detection
 */
export function detectHeelLiftDuringSquat(landmarks: any[]): {
  heelsLifted: boolean;
  leftHeelLifted: boolean;
  rightHeelLifted: boolean;
  liftAmount: number;
} {
  if (!landmarks || landmarks.length < 33) {
    return {
      heelsLifted: false,
      leftHeelLifted: false,
      rightHeelLifted: false,
      liftAmount: 0,
    };
  }

  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHeel = landmarks[29];
  const rightHeel = landmarks[30];
  const leftToe = landmarks[31];
  const rightToe = landmarks[32];

  if (!leftAnkle || !rightAnkle || !leftHeel || !rightHeel || !leftToe || !rightToe) {
    return {
      heelsLifted: false,
      leftHeelLifted: false,
      rightHeelLifted: false,
      liftAmount: 0,
    };
  }

  // Compare heel height to toe height
  // In normalized coords, smaller y = higher (lifted)
  // Heel should be at same level or lower (larger y) than toe
  const leftHeelVsToe = leftToe.y - leftHeel.y;
  const rightHeelVsToe = rightToe.y - rightHeel.y;

  // Threshold: if heel is significantly higher than toe, it's lifted
  const LIFT_THRESHOLD = 0.02;
  
  const leftHeelLifted = leftHeelVsToe > LIFT_THRESHOLD;
  const rightHeelLifted = rightHeelVsToe > LIFT_THRESHOLD;
  const heelsLifted = leftHeelLifted || rightHeelLifted;
  const liftAmount = Math.max(leftHeelVsToe, rightHeelVsToe);

  return {
    heelsLifted,
    leftHeelLifted,
    rightHeelLifted,
    liftAmount: Math.max(0, liftAmount),
  };
}

/**
 * Comprehensive squat form assessment
 * Combines depth, trunk lean, valgus, and heel lift checks
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Complete squat assessment with scoring
 */
export function assessSquatForm(landmarks: any[]): {
  depth: ReturnType<typeof assessSquatDepth>;
  trunkLean: ReturnType<typeof assessSquatTrunkLean>;
  valgus: ReturnType<typeof detectKneeValgus>;
  heelLift: ReturnType<typeof detectHeelLiftDuringSquat>;
  formScore: 0 | 1 | 2;
  formIssues: string[];
} {
  const depth = assessSquatDepth(landmarks);
  const trunkLean = assessSquatTrunkLean(landmarks);
  const valgus = detectKneeValgus(landmarks);
  const heelLift = detectHeelLiftDuringSquat(landmarks);

  // Collect form issues
  const formIssues: string[] = [];
  
  if (valgus.valgusLevel === 'significant') {
    formIssues.push('Knees caving inward significantly');
  } else if (valgus.valgusLevel === 'mild') {
    formIssues.push('Knees slightly inward');
  }
  
  if (heelLift.heelsLifted) {
    formIssues.push('Heels lifting off ground');
  }
  
  if (trunkLean.trunkLeanLevel === 'excessive') {
    formIssues.push('Leaning forward too much');
  }

  // Calculate form score (0-2 points)
  // Reference: 90° knee angle = safe squat depth (thighs parallel)
  let formScore: 0 | 1 | 2 = 0;

  if (depth.squatDepth === 'parallel' || depth.squatDepth === 'deep') {
    // Good depth achieved
    if (formIssues.length === 0) {
      formScore = 2; // Perfect: good depth + good form
    } else if (formIssues.length === 1 && valgus.valgusLevel !== 'significant') {
      formScore = 1; // Minor form issue
    } else {
      formScore = 1; // Good depth but form issues
    }
  } else if (depth.squatDepth === 'partial') {
    // Partial depth
    if (formIssues.length === 0) {
      formScore = 1; // Partial depth, good form
    } else {
      formScore = 0; // Partial depth with issues
    }
  } else {
    // Standing or minimal squat
    formScore = 0;
  }

  return {
    depth,
    trunkLean,
    valgus,
    heelLift,
    formScore,
    formIssues,
  };
}

/**
 * Detect one-leg stance with COM (Center of Mass) sway tracking
 * Uses hip + trunk lean to measure balance quality
 * 
 * Biomechanical criteria:
 * - One foot must be lifted (ankle height difference > 3% frame height)
 * - COM sway tracked using hip position deviation from midline
 * - Trunk lean angle measured for stability assessment
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Object with stance detection, COM sway, and raw measurements
 */
export function detectOneLegStance(landmarks: any[]): {
  isOneLegStance: boolean;
  liftedLeg: 'left' | 'right' | null;
  standingLegKneeAngle: number;
  liftedLegKneeAngle: number;
  comSwayFromMidline: number;  // Raw COM lateral deviation (normalized 0-1)
  trunkLeanAngle: number;      // Raw trunk lean angle in degrees
  ankleHeightDiff: number;     // Raw ankle height difference (normalized)
  pass: boolean;               // Strict pass: one foot clearly lifted
} {
  if (!landmarks || landmarks.length < 29) {
    return {
      isOneLegStance: false,
      liftedLeg: null,
      standingLegKneeAngle: 180,
      liftedLegKneeAngle: 180,
      comSwayFromMidline: 0,
      trunkLeanAngle: 0,
      ankleHeightDiff: 0,
      pass: false,
    };
  }

  // Get key landmarks
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  
  if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
    return {
      isOneLegStance: false,
      liftedLeg: null,
      standingLegKneeAngle: 180,
      liftedLegKneeAngle: 180,
      comSwayFromMidline: 0,
      trunkLeanAngle: 0,
      ankleHeightDiff: 0,
      pass: false,
    };
  }

  // Calculate knee angles
  const leftKneeAngle = getKneeFlexion(landmarks, 'left');
  const rightKneeAngle = getKneeFlexion(landmarks, 'right');

  // === COM (Center of Mass) SWAY TRACKING ===
  // COM is approximated at hip midpoint
  // Track lateral deviation from standing midline
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const shoulderMidX = leftShoulder && rightShoulder ? (leftShoulder.x + rightShoulder.x) / 2 : hipMidX;
  
  // COM lateral deviation (how far hip center is from shoulder center)
  const comSwayFromMidline = Math.abs(hipMidX - shoulderMidX);
  
  // === TRUNK LEAN ANGLE ===
  // Calculate trunk lean from vertical using hip and shoulder positions
  let trunkLeanAngle = 0;
  if (leftShoulder && rightShoulder) {
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    const dx = shoulderMidX - hipMidX;
    const dy = Math.abs(shoulderMidY - hipMidY);
    trunkLeanAngle = Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));
  }

  // === ONE-LEG DETECTION ===
  // Check ankle height difference (Y increases downward)
  const ankleHeightDiff = Math.abs(leftAnkle.y - rightAnkle.y);
  const leftFootHigher = leftAnkle.y < rightAnkle.y;
  const rightFootHigher = rightAnkle.y < leftAnkle.y;
  
  // Check if one knee is significantly more bent
  const kneeBendDiff = Math.abs(leftKneeAngle - rightKneeAngle);
  const leftKneeMoreBent = leftKneeAngle < rightKneeAngle;
  const rightKneeMoreBent = rightKneeAngle < leftKneeAngle;
  
  // Check knee Y position (lifted leg's knee is usually higher)
  const kneeHeightDiff = leftKnee && rightKnee ? Math.abs(leftKnee.y - rightKnee.y) : 0;
  const leftKneeHigher = leftKnee && rightKnee && leftKnee.y < rightKnee.y;
  const rightKneeHigher = leftKnee && rightKnee && rightKnee.y < leftKnee.y;

  // Thresholds
  const ANKLE_HEIGHT_THRESHOLD = 0.03; // 3% of frame height
  const KNEE_BEND_THRESHOLD = 15; // degrees difference
  const KNEE_HEIGHT_THRESHOLD = 0.02; // 2% of frame height

  // Determine which leg is lifted using multiple signals
  let leftLegScore = 0;
  let rightLegScore = 0;

  // Score based on ankle height
  if (ankleHeightDiff > ANKLE_HEIGHT_THRESHOLD) {
    if (leftFootHigher) leftLegScore += 2;
    if (rightFootHigher) rightLegScore += 2;
  }

  // Score based on knee bend
  if (kneeBendDiff > KNEE_BEND_THRESHOLD) {
    if (leftKneeMoreBent) leftLegScore += 1;
    if (rightKneeMoreBent) rightLegScore += 1;
  }

  // Score based on knee height
  if (kneeHeightDiff > KNEE_HEIGHT_THRESHOLD) {
    if (leftKneeHigher) leftLegScore += 1;
    if (rightKneeHigher) rightLegScore += 1;
  }

  // Need at least 1 point to detect one-leg stance
  const isOneLegStance = leftLegScore >= 1 || rightLegScore >= 1;
  
  let liftedLeg: 'left' | 'right' | null = null;
  if (leftLegScore > rightLegScore && leftLegScore >= 1) {
    liftedLeg = 'left';
  } else if (rightLegScore > leftLegScore && rightLegScore >= 1) {
    liftedLeg = 'right';
  } else if (leftLegScore >= 1) {
    liftedLeg = 'left'; // Tie-breaker
  }

  // Strict pass: ankle height difference must exceed threshold
  const pass = isOneLegStance && ankleHeightDiff > ANKLE_HEIGHT_THRESHOLD;

  return {
    isOneLegStance,
    liftedLeg,
    standingLegKneeAngle: liftedLeg === 'left' ? rightKneeAngle : leftKneeAngle,
    liftedLegKneeAngle: liftedLeg === 'left' ? leftKneeAngle : rightKneeAngle,
    comSwayFromMidline,
    trunkLeanAngle,
    ankleHeightDiff,
    pass,
  };
}

// ============= GAIT ANALYSIS FUNCTIONS (GMFM-Based) =============

/**
 * Track foot positions and heights for gait step detection
 * 
 * MediaPipe landmarks:
 * - 27/28 = left/right ankle
 * - 25/26 = left/right knee
 * - 23/24 = left/right hip
 * 
 * In normalized coordinates:
 * - y increases downward (higher y = lower position, closer to ground)
 * - x increases to the right
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Foot tracking data for gait analysis
 */
export function getGaitFootPositions(landmarks: any[]): {
  leftAnkleY: number;
  rightAnkleY: number;
  leftAnkleX: number;
  rightAnkleX: number;
  leftKneeAngle: number;
  rightKneeAngle: number;
  hipCenterX: number;
  hipCenterY: number;
  valid: boolean;
} {
  if (!landmarks || landmarks.length < 29) {
    return {
      leftAnkleY: 0,
      rightAnkleY: 0,
      leftAnkleX: 0,
      rightAnkleX: 0,
      leftKneeAngle: 180,
      rightKneeAngle: 180,
      hipCenterX: 0,
      hipCenterY: 0,
      valid: false,
    };
  }

  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
    return {
      leftAnkleY: 0,
      rightAnkleY: 0,
      leftAnkleX: 0,
      rightAnkleX: 0,
      leftKneeAngle: 180,
      rightKneeAngle: 180,
      hipCenterX: 0,
      hipCenterY: 0,
      valid: false,
    };
  }

  // Get knee angles to detect flexion during swing phase
  const leftKneeAngle = getKneeFlexion(landmarks, 'left');
  const rightKneeAngle = getKneeFlexion(landmarks, 'right');

  return {
    leftAnkleY: leftAnkle.y,
    rightAnkleY: rightAnkle.y,
    leftAnkleX: leftAnkle.x,
    rightAnkleX: rightAnkle.x,
    leftKneeAngle,
    rightKneeAngle,
    hipCenterX: (leftHip.x + rightHip.x) / 2,
    hipCenterY: (leftHip.y + rightHip.y) / 2,
    valid: true,
  };
}

/**
 * Detect individual foot step during gait
 * 
 * A step is detected when:
 * 1. One foot is lifted off the ground (ankle rises = y decreases)
 * 2. Knee flexion increases (knee angle decreases) during swing phase
 * 3. The foot then returns to ground (ankle lowers = y increases)
 * 
 * Gait cycle phases:
 * - Stance phase: foot on ground, supporting weight
 * - Swing phase: foot off ground, knee flexed, moving forward
 * 
 * @param currentPos - Current frame foot positions
 * @param previousPos - Previous frame foot positions
 * @param foot - Which foot to check ('left' or 'right')
 * @returns Step detection result
 */
export function detectGaitStep(
  currentPos: ReturnType<typeof getGaitFootPositions>,
  previousPos: ReturnType<typeof getGaitFootPositions> | null,
  foot: 'left' | 'right'
): {
  isLifted: boolean;
  isSwinging: boolean;
  stepCompleted: boolean;
  liftAmount: number;
  kneeFlexion: number;
} {
  if (!currentPos.valid || !previousPos || !previousPos.valid) {
    return {
      isLifted: false,
      isSwinging: false,
      stepCompleted: false,
      liftAmount: 0,
      kneeFlexion: 180,
    };
  }

  // Get ankle y-positions (lower y = higher position = foot lifted)
  const currentAnkleY = foot === 'left' ? currentPos.leftAnkleY : currentPos.rightAnkleY;
  const previousAnkleY = foot === 'left' ? previousPos.leftAnkleY : previousPos.rightAnkleY;
  const otherAnkleY = foot === 'left' ? currentPos.rightAnkleY : currentPos.leftAnkleY;
  
  // Get knee angles (smaller angle = more flexion = bent knee)
  const currentKneeAngle = foot === 'left' ? currentPos.leftKneeAngle : currentPos.rightKneeAngle;
  
  // Calculate lift amount relative to other foot
  // Positive lift = foot is higher than the other foot
  const liftAmount = otherAnkleY - currentAnkleY;
  
  // Thresholds for step detection
  const LIFT_THRESHOLD = 0.02; // Minimum ankle height difference to detect lift
  const KNEE_FLEXION_THRESHOLD = 160; // Knee more bent than this indicates swing phase
  
  // Foot is lifted if it's significantly higher than the other foot
  const isLifted = liftAmount > LIFT_THRESHOLD;
  
  // Foot is in swing phase if lifted AND knee is flexed
  const isSwinging = isLifted && currentKneeAngle < KNEE_FLEXION_THRESHOLD;
  
  // Step completed when foot was lifted and is now returning to ground
  // (ankle y increasing = foot lowering)
  const ankleDropping = currentAnkleY > previousAnkleY + 0.005;
  const wasLifted = (previousPos.leftAnkleY - previousPos.rightAnkleY) * (foot === 'left' ? -1 : 1) > LIFT_THRESHOLD;
  const stepCompleted = wasLifted && ankleDropping && !isLifted;

  return {
    isLifted,
    isSwinging,
    stepCompleted,
    liftAmount,
    kneeFlexion: currentKneeAngle,
  };
}

/**
 * Detect trunk sway during walking (gait stability assessment)
 * 
 * Excessive trunk sway during walking indicates:
 * - Poor balance
 * - Weak core stability
 * - Possible vestibular issues
 * 
 * Normal gait: minimal lateral trunk sway (~5-10°)
 * Ataxic gait: excessive sway (>15°)
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Trunk sway analysis
 */
export function detectGaitTrunkSway(landmarks: any[]): {
  lateralSway: number; // Degrees of lateral lean
  swayLevel: 'minimal' | 'moderate' | 'excessive';
  isStable: boolean;
} {
  const trunkAngle = getTrunkLeanAngle(landmarks);
  
  // Classify sway level
  let swayLevel: 'minimal' | 'moderate' | 'excessive';
  if (trunkAngle < 8) {
    swayLevel = 'minimal';
  } else if (trunkAngle < 15) {
    swayLevel = 'moderate';
  } else {
    swayLevel = 'excessive';
  }
  
  const isStable = trunkAngle < 15;

  return {
    lateralSway: trunkAngle,
    swayLevel,
    isStable,
  };
}

/**
 * Detect arm swing during walking
 * 
 * Normal gait includes reciprocal arm swing:
 * - Arms swing opposite to legs (right arm forward with left leg)
 * - Toddlers (< 3 years) may hold arms up for balance (high guard position)
 * - By age 4-5, children typically have mature arm swing pattern
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Arm position and swing analysis
 */
export function detectGaitArmPosition(landmarks: any[]): {
  leftWristY: number;
  rightWristY: number;
  armsInHighGuard: boolean; // Toddler balance posture
  armSwingSymmetry: number; // 0-100% symmetry
  armPositionLevel: 'relaxed' | 'high-guard' | 'asymmetric';
} {
  if (!landmarks || landmarks.length < 17) {
    return {
      leftWristY: 0,
      rightWristY: 0,
      armsInHighGuard: false,
      armSwingSymmetry: 100,
      armPositionLevel: 'relaxed',
    };
  }

  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
    return {
      leftWristY: 0,
      rightWristY: 0,
      armsInHighGuard: false,
      armSwingSymmetry: 100,
      armPositionLevel: 'relaxed',
    };
  }

  // Calculate wrist heights relative to shoulders
  // High guard = wrists at or above shoulder level
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const leftArmRaised = leftWrist.y < shoulderMidY + 0.1; // Wrist above or near shoulder
  const rightArmRaised = rightWrist.y < shoulderMidY + 0.1;
  const armsInHighGuard = leftArmRaised && rightArmRaised;

  // Calculate arm swing symmetry (difference in wrist heights)
  const wristYDiff = Math.abs(leftWrist.y - rightWrist.y);
  const armSwingSymmetry = Math.max(0, 100 - wristYDiff * 500);

  // Determine arm position level
  let armPositionLevel: 'relaxed' | 'high-guard' | 'asymmetric';
  if (armsInHighGuard) {
    armPositionLevel = 'high-guard';
  } else if (armSwingSymmetry < 70) {
    armPositionLevel = 'asymmetric';
  } else {
    armPositionLevel = 'relaxed';
  }

  return {
    leftWristY: leftWrist.y,
    rightWristY: rightWrist.y,
    armsInHighGuard,
    armSwingSymmetry,
    armPositionLevel,
  };
}

/**
 * Calculate overall forward displacement during walking
 * Used to confirm the child is actually moving forward, not marching in place
 * 
 * @param currentHipX - Current hip center x-position
 * @param startHipX - Starting hip center x-position
 * @returns Forward displacement in normalized coordinates
 */
export function calculateGaitDisplacement(
  currentHipX: number,
  startHipX: number
): {
  displacement: number;
  direction: 'forward' | 'backward' | 'stationary';
  hasSignificantMovement: boolean;
} {
  const displacement = Math.abs(currentHipX - startHipX);
  
  // Threshold for significant movement (about 10% of frame width)
  const MOVEMENT_THRESHOLD = 0.1;
  
  let direction: 'forward' | 'backward' | 'stationary';
  if (Math.abs(currentHipX - startHipX) < 0.02) {
    direction = 'stationary';
  } else if (currentHipX > startHipX) {
    direction = 'forward'; // Assuming right is forward
  } else {
    direction = 'backward';
  }
  
  const hasSignificantMovement = displacement > MOVEMENT_THRESHOLD;

  return {
    displacement,
    direction,
    hasSignificantMovement,
  };
}

/**
 * Comprehensive gait assessment combining all gait metrics
 * Based on GMFM (Gross Motor Function Measure) walking tasks
 * 
 * GMFM Walking Criteria:
 * - Item 69: Walks forward 10 steps
 * - Item 70: Walks forward 10 steps with arms free
 * - Item 71: Walks forward 10 steps, stops, turns 180°
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @param previousPositions - Previous frame positions for step detection
 * @param lastStepFoot - Which foot took the last step
 * @returns Comprehensive gait assessment
 */
export function assessGait(
  landmarks: any[],
  previousPositions: ReturnType<typeof getGaitFootPositions> | null,
  lastStepFoot: 'left' | 'right' | null
): {
  currentPositions: ReturnType<typeof getGaitFootPositions>;
  leftStep: ReturnType<typeof detectGaitStep>;
  rightStep: ReturnType<typeof detectGaitStep>;
  trunkSway: ReturnType<typeof detectGaitTrunkSway>;
  armPosition: ReturnType<typeof detectGaitArmPosition>;
  isAlternatingSteps: boolean;
  stepDetected: 'left' | 'right' | null;
} {
  const currentPositions = getGaitFootPositions(landmarks);
  const leftStep = detectGaitStep(currentPositions, previousPositions, 'left');
  const rightStep = detectGaitStep(currentPositions, previousPositions, 'right');
  const trunkSway = detectGaitTrunkSway(landmarks);
  const armPosition = detectGaitArmPosition(landmarks);

  // Determine if a step was just completed
  let stepDetected: 'left' | 'right' | null = null;
  if (leftStep.stepCompleted) {
    stepDetected = 'left';
  } else if (rightStep.stepCompleted) {
    stepDetected = 'right';
  }

  // Check for proper alternating pattern
  const isAlternatingSteps = 
    stepDetected !== null && 
    lastStepFoot !== null && 
    stepDetected !== lastStepFoot;

  return {
    currentPositions,
    leftStep,
    rightStep,
    trunkSway,
    armPosition,
    isAlternatingSteps,
    stepDetected,
  };
}

// ============= JUMP ASSESSMENT FUNCTIONS (GMFM-Based) =============

/**
 * Get jump-relevant body positions for takeoff and landing detection
 * 
 * MediaPipe Landmarks used:
 * - 27/28 = left/right ankle
 * - 25/26 = left/right knee
 * - 23/24 = left/right hip
 * - 11/12 = left/right shoulder (for CoM estimation)
 * 
 * In normalized coordinates:
 * - y increases downward (smaller y = higher position)
 * - x increases to the right
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @returns Jump tracking positions
 */
export function getJumpPositions(landmarks: any[]): {
  leftAnkleY: number;
  rightAnkleY: number;
  leftKneeAngle: number;
  rightKneeAngle: number;
  hipCenterY: number;
  comY: number; // Center of mass approximation
  valid: boolean;
} {
  if (!landmarks || landmarks.length < 29) {
    return {
      leftAnkleY: 0,
      rightAnkleY: 0,
      leftKneeAngle: 180,
      rightKneeAngle: 180,
      hipCenterY: 0,
      comY: 0,
      valid: false,
    };
  }

  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftAnkle || !rightAnkle || !leftHip || !rightHip || !leftShoulder || !rightShoulder) {
    return {
      leftAnkleY: 0,
      rightAnkleY: 0,
      leftKneeAngle: 180,
      rightKneeAngle: 180,
      hipCenterY: 0,
      comY: 0,
      valid: false,
    };
  }

  // Get knee angles for crouch/extension detection
  const leftKneeAngle = getKneeFlexion(landmarks, 'left');
  const rightKneeAngle = getKneeFlexion(landmarks, 'right');

  // Calculate hip center
  const hipCenterY = (leftHip.y + rightHip.y) / 2;
  
  // Approximate center of mass as midpoint between hips and shoulders
  // (simplified body CoM estimation)
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
  const comY = (hipCenterY + shoulderCenterY) / 2;

  return {
    leftAnkleY: leftAnkle.y,
    rightAnkleY: rightAnkle.y,
    leftKneeAngle,
    rightKneeAngle,
    hipCenterY,
    comY,
    valid: true,
  };
}

/**
 * Detect jump preparation phase (crouch/squat before jump)
 * 
 * Before a proper two-footed jump, the child typically:
 * 1. Bends knees (knee angle decreases from ~180° to ~100-130°)
 * 2. Lowers center of mass (CoM y increases)
 * 3. Arms may swing back for momentum
 * 
 * @param currentPos - Current frame positions
 * @param baselineComY - Baseline standing CoM height
 * @returns Crouch detection result
 */
export function detectJumpCrouch(
  currentPos: ReturnType<typeof getJumpPositions>,
  baselineComY: number
): {
  isCrouching: boolean;
  crouchDepth: number; // How much CoM dropped (positive = lower)
  kneesBent: boolean;
  avgKneeAngle: number;
  readyToJump: boolean;
} {
  if (!currentPos.valid || baselineComY === 0) {
    return {
      isCrouching: false,
      crouchDepth: 0,
      kneesBent: false,
      avgKneeAngle: 180,
      readyToJump: false,
    };
  }

  // Calculate knee bend (average of both knees)
  const avgKneeAngle = (currentPos.leftKneeAngle + currentPos.rightKneeAngle) / 2;
  
  // Knees are bent if angle < 160° (20° bend from straight)
  const KNEE_BENT_THRESHOLD = 160;
  const kneesBent = avgKneeAngle < KNEE_BENT_THRESHOLD;
  
  // Crouch depth: how much CoM dropped below baseline
  // Positive value = CoM is lower (y increased)
  const crouchDepth = currentPos.comY - baselineComY;
  
  // Crouching if CoM dropped AND knees bent
  const CROUCH_THRESHOLD = 0.02; // CoM dropped by 2% of frame height
  const isCrouching = crouchDepth > CROUCH_THRESHOLD && kneesBent;
  
  // Ready to jump: in good crouch position (knees ~120-140°, CoM lowered)
  const readyToJump = isCrouching && avgKneeAngle < 150 && avgKneeAngle > 90;

  return {
    isCrouching,
    crouchDepth,
    kneesBent,
    avgKneeAngle,
    readyToJump,
  };
}

/**
 * Detect two-footed takeoff (both feet leave ground simultaneously)
 * 
 * Proper two-footed jump takeoff criteria:
 * 1. Both ankles rise together (y decreases simultaneously)
 * 2. Knees extend rapidly (angle increases toward 180°)
 * 3. Upward velocity of CoM exceeds threshold
 * 
 * A "gallop" or "step-jump" is detected when:
 * - One foot leaves ground before the other (>100ms apart)
 * - Asymmetric ankle heights at takeoff
 * 
 * @param currentPos - Current frame positions
 * @param previousPos - Previous frame positions
 * @param baselineAnkleY - Baseline ankle y-position (on ground)
 * @returns Takeoff detection result
 */
export function detectJumpTakeoff(
  currentPos: ReturnType<typeof getJumpPositions>,
  previousPos: ReturnType<typeof getJumpPositions> | null,
  baselineAnkleY: number
): {
  isTakingOff: boolean;
  isTwoFooted: boolean;
  leftFootOff: boolean;
  rightFootOff: boolean;
  ankleAsymmetry: number; // Difference in ankle heights
  verticalVelocity: number; // CoM upward velocity
  takeoffQuality: 'excellent' | 'good' | 'asymmetric' | 'none';
} {
  if (!currentPos.valid || baselineAnkleY === 0) {
    return {
      isTakingOff: false,
      isTwoFooted: false,
      leftFootOff: false,
      rightFootOff: false,
      ankleAsymmetry: 0,
      verticalVelocity: 0,
      takeoffQuality: 'none',
    };
  }

  // Threshold for foot being "off ground" (ankle rose by 2% of frame)
  const OFF_GROUND_THRESHOLD = 0.02;
  
  // Check if each foot is off the ground (y decreased from baseline)
  const leftFootOff = baselineAnkleY - currentPos.leftAnkleY > OFF_GROUND_THRESHOLD;
  const rightFootOff = baselineAnkleY - currentPos.rightAnkleY > OFF_GROUND_THRESHOLD;
  
  // Both feet off = potential jump takeoff
  const isTakingOff = leftFootOff && rightFootOff;
  
  // Calculate ankle asymmetry (difference in lift between feet)
  const leftLift = baselineAnkleY - currentPos.leftAnkleY;
  const rightLift = baselineAnkleY - currentPos.rightAnkleY;
  const ankleAsymmetry = Math.abs(leftLift - rightLift);
  
  // Two-footed if both feet off AND ankles at similar heights
  const SYMMETRY_THRESHOLD = 0.03; // Allow 3% difference
  const isTwoFooted = isTakingOff && ankleAsymmetry < SYMMETRY_THRESHOLD;
  
  // Calculate vertical velocity (change in CoM between frames)
  let verticalVelocity = 0;
  if (previousPos && previousPos.valid) {
    // Positive velocity = moving upward (y decreasing)
    verticalVelocity = previousPos.comY - currentPos.comY;
  }
  
  // Determine takeoff quality
  let takeoffQuality: 'excellent' | 'good' | 'asymmetric' | 'none' = 'none';
  if (isTakingOff) {
    if (isTwoFooted && verticalVelocity > 0.02) {
      takeoffQuality = 'excellent'; // Perfect two-footed takeoff with good power
    } else if (isTwoFooted) {
      takeoffQuality = 'good'; // Two-footed but low power
    } else {
      takeoffQuality = 'asymmetric'; // One foot took off before other
    }
  }

  return {
    isTakingOff,
    isTwoFooted,
    leftFootOff,
    rightFootOff,
    ankleAsymmetry,
    verticalVelocity,
    takeoffQuality,
  };
}

/**
 * Detect airborne phase (both feet off ground, peak of jump)
 * 
 * During airborne phase:
 * - Both ankles are elevated above baseline
 * - CoM reaches maximum height (peak of parabolic trajectory)
 * - Knees may be slightly bent (tuck) or extended
 * 
 * @param currentPos - Current frame positions
 * @param baselineAnkleY - Baseline ankle y-position (on ground)
 * @param baselineComY - Baseline CoM y-position (standing)
 * @returns Airborne detection result
 */
export function detectAirborne(
  currentPos: ReturnType<typeof getJumpPositions>,
  baselineAnkleY: number,
  baselineComY: number
): {
  isAirborne: boolean;
  bothFeetOff: boolean;
  jumpHeight: number; // How high CoM rose from baseline (positive = higher)
  leftAnkleElevation: number;
  rightAnkleElevation: number;
} {
  if (!currentPos.valid || baselineAnkleY === 0 || baselineComY === 0) {
    return {
      isAirborne: false,
      bothFeetOff: false,
      jumpHeight: 0,
      leftAnkleElevation: 0,
      rightAnkleElevation: 0,
    };
  }

  // Threshold for foot being airborne
  const AIRBORNE_THRESHOLD = 0.015;
  
  // Calculate ankle elevations (positive = foot is higher than baseline)
  const leftAnkleElevation = baselineAnkleY - currentPos.leftAnkleY;
  const rightAnkleElevation = baselineAnkleY - currentPos.rightAnkleY;
  
  // Both feet must be off ground
  const bothFeetOff = leftAnkleElevation > AIRBORNE_THRESHOLD && 
                       rightAnkleElevation > AIRBORNE_THRESHOLD;
  
  // Calculate jump height from CoM (positive = higher than baseline)
  const jumpHeight = baselineComY - currentPos.comY;
  
  // Airborne if both feet off and CoM elevated
  const isAirborne = bothFeetOff && jumpHeight > 0.01;

  return {
    isAirborne,
    bothFeetOff,
    jumpHeight,
    leftAnkleElevation,
    rightAnkleElevation,
  };
}

/**
 * Detect landing phase (feet returning to ground after jump)
 * 
 * Landing criteria:
 * 1. Both feet contact ground (ankles return to baseline level)
 * 2. Ideally simultaneous two-footed landing
 * 3. Knees flex to absorb impact (good landing technique)
 * 
 * Landing quality assessment:
 * - Stable: Two-footed, controlled knee bend, no stumble
 * - Unstable: One-footed landing, stiff legs, or excessive movement
 * 
 * @param currentPos - Current frame positions
 * @param previousPos - Previous frame positions  
 * @param baselineAnkleY - Baseline ankle y-position
 * @param wasAirborne - Whether previous frame was airborne
 * @returns Landing detection result
 */
export function detectJumpLanding(
  currentPos: ReturnType<typeof getJumpPositions>,
  _previousPos: ReturnType<typeof getJumpPositions> | null, // Reserved for future velocity-based landing detection
  baselineAnkleY: number,
  wasAirborne: boolean
): {
  isLanding: boolean;
  isTwoFootedLanding: boolean;
  landingComplete: boolean;
  kneesAbsorbing: boolean; // Knees flexing to absorb impact
  ankleAsymmetry: number;
  landingQuality: 'stable' | 'unstable' | 'one-footed' | 'none';
} {
  if (!currentPos.valid || baselineAnkleY === 0) {
    return {
      isLanding: false,
      isTwoFootedLanding: false,
      landingComplete: false,
      kneesAbsorbing: false,
      ankleAsymmetry: 0,
      landingQuality: 'none',
    };
  }

  // Threshold for foot being on ground (within 2% of baseline)
  const ON_GROUND_THRESHOLD = 0.02;
  
  // Check if ankles are back at ground level
  const leftOnGround = Math.abs(currentPos.leftAnkleY - baselineAnkleY) < ON_GROUND_THRESHOLD;
  const rightOnGround = Math.abs(currentPos.rightAnkleY - baselineAnkleY) < ON_GROUND_THRESHOLD;
  
  // Calculate ankle height difference (asymmetry at landing)
  const ankleAsymmetry = Math.abs(currentPos.leftAnkleY - currentPos.rightAnkleY);
  
  // Two-footed landing if both feet touch down together
  const LANDING_SYMMETRY_THRESHOLD = 0.03;
  const isTwoFootedLanding = leftOnGround && rightOnGround && ankleAsymmetry < LANDING_SYMMETRY_THRESHOLD;
  
  // Landing is occurring if we were airborne and now feet are approaching ground
  const isLanding = wasAirborne && (leftOnGround || rightOnGround);
  
  // Landing complete when both feet solidly on ground
  const landingComplete = leftOnGround && rightOnGround;
  
  // Check for knee flexion (absorbing impact - good technique)
  const avgKneeAngle = (currentPos.leftKneeAngle + currentPos.rightKneeAngle) / 2;
  const kneesAbsorbing = avgKneeAngle < 160; // Knees bent to absorb
  
  // Determine landing quality
  let landingQuality: 'stable' | 'unstable' | 'one-footed' | 'none' = 'none';
  if (landingComplete) {
    if (isTwoFootedLanding && kneesAbsorbing) {
      landingQuality = 'stable'; // Perfect two-footed landing with absorption
    } else if (isTwoFootedLanding) {
      landingQuality = 'unstable'; // Two feet but stiff landing
    } else {
      landingQuality = 'one-footed'; // Landed on one foot first
    }
  } else if (isLanding && !landingComplete) {
    landingQuality = 'one-footed'; // Only one foot down
  }

  return {
    isLanding,
    isTwoFootedLanding,
    landingComplete,
    kneesAbsorbing,
    ankleAsymmetry,
    landingQuality,
  };
}

/**
 * Comprehensive jump assessment combining all phases
 * Based on GMFM (Gross Motor Function Measure) jumping criteria
 * 
 * GMFM Jump Criteria:
 * - Two-footed takeoff (both feet leave ground simultaneously)
 * - Airborne phase (both feet clearly off ground)
 * - Two-footed landing (both feet contact ground together)
 * - Distance/height benchmarks (e.g., ~30cm for 5-6 year olds)
 * 
 * @param landmarks - MediaPipe pose landmarks array
 * @param previousPositions - Previous frame positions
 * @param baselineAnkleY - Baseline ankle position (standing on ground)
 * @param baselineComY - Baseline CoM position (standing)
 * @param wasAirborne - Whether previous frame was airborne
 * @returns Comprehensive jump assessment
 */
export function assessJump(
  landmarks: any[],
  previousPositions: ReturnType<typeof getJumpPositions> | null,
  baselineAnkleY: number,
  baselineComY: number,
  wasAirborne: boolean
): {
  currentPositions: ReturnType<typeof getJumpPositions>;
  crouch: ReturnType<typeof detectJumpCrouch>;
  takeoff: ReturnType<typeof detectJumpTakeoff>;
  airborne: ReturnType<typeof detectAirborne>;
  landing: ReturnType<typeof detectJumpLanding>;
} {
  const currentPositions = getJumpPositions(landmarks);
  const crouch = detectJumpCrouch(currentPositions, baselineComY);
  const takeoff = detectJumpTakeoff(currentPositions, previousPositions, baselineAnkleY);
  const airborne = detectAirborne(currentPositions, baselineAnkleY, baselineComY);
  const landing = detectJumpLanding(currentPositions, previousPositions, baselineAnkleY, wasAirborne);

  return {
    currentPositions,
    crouch,
    takeoff,
    airborne,
    landing,
  };
}
