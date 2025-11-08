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

// Standards for raise_hand (shoulder flexion)
export const SHOULDER_FLEXION_STANDARDS = {
  normal: 120, // >= 120 degrees is full ROM
  borderline: 90, // 90-119 degrees is borderline
  // < 90 degrees is abnormal
} as const;

// Standards for one_leg (BESS-like balance test)
export const BALANCE_STANDARDS = {
  normal: 5, // >= 5 seconds is age-appropriate
  borderline: 3, // 3-4.9 seconds is borderline
  // < 3 seconds is abnormal
} as const;

// Standards for walk (gait symmetry)
export const GAIT_SYMMETRY_STANDARDS = {
  normal: 15, // <= 15% asymmetry is normal
  borderline: 25, // 15-25% asymmetry is borderline
  // > 25% asymmetry is abnormal
} as const;

// Standards for jump (height relative to child's height)
// Jump height as percentage of body height
export const JUMP_HEIGHT_STANDARDS = {
  normal: 15, // >= 15% of height is normal
  borderline: 10, // 10-14% is borderline
  // < 10% is abnormal/weak
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
      if (metricName === 'shoulderFlexion' || metricName === 'symmetry') {
        const flexion = value;
        if (flexion >= SHOULDER_FLEXION_STANDARDS.normal) {
          return {
            level: 'normal',
            note: 'Full range of motion achieved (≥120°)',
          };
        } else if (flexion >= SHOULDER_FLEXION_STANDARDS.borderline) {
          return {
            level: 'borderline',
            note: 'Reduced ROM, monitoring recommended (90-119°)',
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
      if (metricName === 'balanceTime' || metricName === 'holdTime') {
        const holdTime = value;
        if (holdTime >= BALANCE_STANDARDS.normal) {
          return {
            level: 'normal',
            note: 'Age-appropriate balance (≥5s)',
          };
        } else if (holdTime >= BALANCE_STANDARDS.borderline) {
          return {
            level: 'borderline',
            note: 'Mild balance weakness (3-5s)',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Significant balance deficit (<3s), assessment recommended',
          };
        }
      }
      break;

    case 'walk':
      if (metricName === 'gaitSymmetry' || metricName === 'symmetry') {
        const asymmetry = value;
        if (asymmetry <= GAIT_SYMMETRY_STANDARDS.normal) {
          return {
            level: 'normal',
            note: 'Normal gait symmetry (≤15% asymmetry)',
          };
        } else if (asymmetry <= GAIT_SYMMETRY_STANDARDS.borderline) {
          return {
            level: 'borderline',
            note: 'Mild asymmetry detected (15-25%)',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Significant gait asymmetry (>25%), evaluation needed',
          };
        }
      }
      break;

    case 'jump':
      if (metricName === 'jumpHeight') {
        // Assume jumpHeight is already converted to % of body height
        // or is in cm and needs conversion (we'll handle raw cm here)
        const heightPercent = value; // If value < 100, assume it's already %
        
        if (heightPercent >= JUMP_HEIGHT_STANDARDS.normal) {
          return {
            level: 'normal',
            note: 'Adequate power generation (≥15% height)',
          };
        } else if (heightPercent >= JUMP_HEIGHT_STANDARDS.borderline) {
          return {
            level: 'borderline',
            note: 'Below expected power (10-15% height)',
          };
        } else {
          return {
            level: 'abnormal',
            note: 'Significant weakness (<10% height), strength assessment needed',
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
