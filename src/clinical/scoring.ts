import type { ClinicalGrade, ClinicalLevel } from './standards';

/**
 * Overall risk level based on multiple task assessments.
 */
export type OverallRisk = 'normal' | 'monitor' | 'high';

export interface TaskGrade {
  task: string;
  grade: ClinicalGrade;
}

/**
 * Compute overall risk level from all task grades.
 * Simple rule-based system:
 * - 2+ abnormal OR any symmetry >20% -> "high"
 * - Any borderline -> "monitor"
 * - All normal -> "normal"
 * 
 * @param taskGrades - Array of graded tasks
 * @returns Overall risk classification
 */
export function computeOverallRisk(taskGrades: TaskGrade[]): OverallRisk {
  let abnormalCount = 0;
  let hasBorderline = false;
  let hasCriticalSymmetry = false;

  for (const tg of taskGrades) {
    const level: ClinicalLevel = tg.grade.level;
    
    if (level === 'abnormal') {
      abnormalCount++;
    } else if (level === 'borderline') {
      hasBorderline = true;
    }

    // Check for critical symmetry issues (mentioned in note)
    if (tg.grade.note.includes('>25%') || tg.grade.note.includes('>20%')) {
      hasCriticalSymmetry = true;
    }
  }

  // High risk criteria
  if (abnormalCount >= 2 || hasCriticalSymmetry) {
    return 'high';
  }

  // Monitor criteria
  if (hasBorderline || abnormalCount === 1) {
    return 'monitor';
  }

  // Normal
  return 'normal';
}

/**
 * Get color for overall risk level (for UI)
 */
export function getRiskColor(risk: OverallRisk): 'success' | 'warning' | 'error' {
  switch (risk) {
    case 'normal':
      return 'success';
    case 'monitor':
      return 'warning';
    case 'high':
      return 'error';
  }
}

/**
 * Get display label for overall risk
 */
export function getRiskLabel(risk: OverallRisk): string {
  switch (risk) {
    case 'normal':
      return 'Normal Development';
    case 'monitor':
      return 'Monitor Progress';
    case 'high':
      return 'Clinical Evaluation Recommended';
  }
}
