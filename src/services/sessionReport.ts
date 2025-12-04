/**
 * Session Report Service
 * ======================
 * Handles comprehensive session data management including:
 * - Structuring session results with scores, notes, and classifications
 * - Sending data to backend API for persistent storage
 * - Local caching via IndexedDB for offline access
 * - Report generation for parents and clinicians
 * - PDF/PNG export capabilities
 * 
 * Data Flow:
 * 1. During session: Task handlers collect metrics and notes
 * 2. On completion: Data is structured into SessionResult format
 * 3. Storage: Sent to backend API (Supabase) + cached locally in IndexedDB
 * 4. Retrieval: Fetched from backend, with local fallback for offline access
 * 5. Reports: Generated from structured data for display/export
 */

import type { TaskName } from '../store/session';
import { generateMotorAssessmentSummary, generateTextReport } from '../clinical/standards';
import { createSession, addTask, addMetric, getSession, getSessionTasks, getTaskMetrics, API_URL } from './api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Complete session result structure
 * Contains all information needed for reports and tracking progress over time
 */
export interface SessionResult {
  // Session metadata
  id?: string;
  date: string;
  duration: number; // seconds
  
  // Child information (privacy: minimal PII, no sensitive data)
  childAge: number;
  childName?: string;
  childHeightCm?: number;
  childGender?: string;
  
  // Task scores (0-2 per task)
  scores: Partial<Record<TaskName, number>>;
  
  // Detailed task notes for clinical context
  notes: Partial<Record<TaskName, string>>;
  
  // Task metrics (raw values for analysis)
  metrics: Partial<Record<TaskName, Record<string, number>>>;
  
  // Overall classification
  overall: {
    category: 'normal' | 'borderline' | 'high-risk';
    percentageScore: number;
    totalScore: number;
    maxScore: number;
    summary: string;
    recommendations: string[];
  };
  
  // Session status
  status: 'completed' | 'partial' | 'abandoned';
  completedTasks: TaskName[];
  failedTasks: TaskName[];
}

/**
 * Task result with metrics and notes
 */
export interface TaskResult {
  task: TaskName;
  metrics: Record<string, number | string>;
  status: 'success' | 'failed' | 'skipped';
  notes?: string;
  duration?: number;
  flags?: string[];
}

// ============================================================================
// LOCAL STORAGE (IndexedDB)
// ============================================================================

const DB_NAME = 'VirtualMirrorDB';
const DB_VERSION = 2;
const STORE_NAME = 'sessions';

/**
 * Initialize IndexedDB for local session storage
 * Provides offline access and backup for session data
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create sessions store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('childName', 'childName', { unique: false });
        store.createIndex('category', 'overall.category', { unique: false });
      }
    };
  });
}

/**
 * Save session result to local IndexedDB
 * Provides offline access and serves as backup if backend is unavailable
 */
async function saveToLocalDB(sessionResult: SessionResult): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(sessionResult);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('💾 Session cached locally in IndexedDB:', sessionResult.id);
  } catch (error) {
    console.warn('⚠️ Failed to cache session locally:', error);
    // Non-critical error - don't throw
  }
}

/**
 * Get session from local IndexedDB
 */
export async function getLocalSession(sessionId: string): Promise<SessionResult | null> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('⚠️ Failed to get local session:', error);
    return null;
  }
}

/**
 * Get all locally cached sessions
 */
export async function getAllLocalSessions(): Promise<SessionResult[]> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('⚠️ Failed to get local sessions:', error);
    return [];
  }
}

// ============================================================================
// SESSION RESULT GENERATION
// ============================================================================

/**
 * Generate task-specific notes based on metrics
 * These notes provide clinical context for each exercise
 */
function generateTaskNote(task: TaskName, metrics: Record<string, number | string>, status: string): string {
  if (status === 'failed') {
    return 'Task not completed - unable to assess';
  }
  
  switch (task) {
    case 'raise_hand': {
      const flexion = metrics.shoulderFlexionMax as number || 0;
      const elbow = metrics.elbowExtension as number;
      let note = `Achieved ${Math.round(flexion)}° shoulder flexion`;
      if (elbow !== undefined && elbow < 160) {
        note += `, elbow bent at ${Math.round(elbow)}°`;
      }
      if (flexion >= 150) note += ' - excellent range';
      else if (flexion >= 120) note += ' - good range';
      else note += ' - limited range, needs practice';
      return note;
    }
    
    case 'one_leg': {
      const holdTime = (metrics.holdTime as number) || 0;
      const sway = metrics.swayAngle as number;
      const leg = metrics.currentLeg as string || 'unknown';
      let note = `Held balance for ${holdTime.toFixed(1)}s on ${leg} leg`;
      if (sway !== undefined) {
        note += `, trunk sway ${Math.round(sway)}°`;
      }
      if (holdTime >= 5) note += ' - age-appropriate';
      else if (holdTime >= 3) note += ' - developing';
      else note += ' - needs balance practice';
      return note;
    }
    
    case 'walk': {
      const steps = (metrics.stepCount as number) || 0;
      const symmetry = metrics.symmetryPercent as number;
      let note = `Took ${steps} steps`;
      if (symmetry !== undefined) {
        note += `, ${Math.round(symmetry)}% gait symmetry`;
      }
      if (steps >= 10 && (symmetry === undefined || symmetry >= 85)) {
        note += ' - mature gait pattern';
      } else if (steps >= 5) {
        note += ' - emerging gait control';
      } else {
        note += ' - limited walking assessment';
      }
      return note;
    }
    
    case 'jump': {
      const height = metrics.jumpHeightPixels as number || 0;
      const twoFootTakeoff = metrics.twoFootTakeoff as number;
      const twoFootLanding = metrics.twoFootLanding as number;
      let note = `Jump height ~${Math.round(height * 0.167)}cm`;
      if (twoFootTakeoff !== undefined) {
        note += twoFootTakeoff ? ', two-foot takeoff ✓' : ', asymmetric takeoff';
      }
      if (twoFootLanding !== undefined) {
        note += twoFootLanding ? ', controlled landing' : ', unbalanced landing';
      }
      return note;
    }
    
    case 'tiptoe': {
      const holdTime = (metrics.holdTime as number) || 0;
      const elevation = metrics.heelElevation as number;
      let note = `Held tiptoe for ${holdTime.toFixed(1)}s`;
      if (elevation !== undefined) {
        note += `, heel elevation ${Math.round(elevation * 100)}%`;
      }
      return note;
    }
    
    case 'squat': {
      const depth = (metrics.squatDepth as number) || 0;
      const kneeAngle = metrics.kneeAngle as number;
      let note = `Squat depth ${Math.round(depth * 100)}%`;
      if (kneeAngle !== undefined) {
        note += `, knee angle ${Math.round(kneeAngle)}°`;
      }
      if (depth >= 0.7) note += ' - good depth';
      else note += ' - needs deeper bend';
      return note;
    }
    
    default:
      return 'Assessment completed';
  }
}

/**
 * Build a complete SessionResult from task results
 * This is the main entry point for structuring session data
 */
export function buildSessionResult(
  taskResults: TaskResult[],
  sessionId: string,
  childAge: number,
  childName?: string,
  childHeightCm?: number,
  childGender?: string,
  startTime?: Date,
  endTime?: Date
): SessionResult {
  // Extract scores, notes, and metrics
  const scores: Partial<Record<TaskName, number>> = {};
  const notes: Partial<Record<TaskName, string>> = {};
  const metrics: Partial<Record<TaskName, Record<string, number>>> = {};
  const completedTasks: TaskName[] = [];
  const failedTasks: TaskName[] = [];
  
  for (const result of taskResults) {
    // Extract score from metrics (look for task-specific score field)
    const scoreKey = `${result.task.replace('_', '')}Score`;
    const score = typeof result.metrics[scoreKey] === 'number' 
      ? result.metrics[scoreKey] as number
      : (result.metrics.score as number) || (result.status === 'success' ? 1 : 0);
    
    scores[result.task] = Math.min(2, Math.max(0, score));
    
    // Generate or use provided notes
    notes[result.task] = result.notes || generateTaskNote(result.task, result.metrics, result.status);
    
    // Extract numeric metrics
    const numericMetrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(result.metrics)) {
      if (typeof value === 'number') {
        numericMetrics[key] = value;
      }
    }
    metrics[result.task] = numericMetrics;
    
    // Track completion status
    if (result.status === 'success') {
      completedTasks.push(result.task);
    } else if (result.status === 'failed') {
      failedTasks.push(result.task);
    }
  }
  
  // Generate overall assessment using clinical standards
  const summary = generateMotorAssessmentSummary(
    taskResults.map(r => ({
      task: r.task,
      metrics: r.metrics,
      flags: r.flags,
    })),
    childAge
  );
  
  // Calculate duration
  const duration = startTime && endTime 
    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    : 0;
  
  return {
    id: sessionId,
    date: new Date().toISOString(),
    duration,
    childAge,
    childName,
    childHeightCm,
    childGender,
    scores,
    notes,
    metrics,
    overall: {
      category: summary.riskCategory,
      percentageScore: summary.percentageScore,
      totalScore: summary.totalScore,
      maxScore: summary.maxPossibleScore,
      summary: summary.overallSummary,
      recommendations: summary.recommendations,
    },
    status: failedTasks.length === taskResults.length 
      ? 'abandoned' 
      : failedTasks.length > 0 ? 'partial' : 'completed',
    completedTasks,
    failedTasks,
  };
}

// ============================================================================
// BACKEND STORAGE
// ============================================================================

/**
 * Save session result to backend API (Supabase)
 * This is the primary storage mechanism for persistent data
 * 
 * @param sessionResult - Complete session result to save
 * @returns Updated session result with backend ID
 */
export async function saveSessionToBackend(sessionResult: SessionResult): Promise<SessionResult> {
  try {
    console.log('📤 Sending session data to backend for record-keeping...');
    
    // Create session in backend if not already created
    if (!sessionResult.id || sessionResult.id.startsWith('local-')) {
      const sessionResponse = await createSession({
        child_name: sessionResult.childName || 'Anonymous',
        child_age: sessionResult.childAge,
        child_height_cm: sessionResult.childHeightCm,
        child_gender: sessionResult.childGender,
      });
      
      sessionResult.id = sessionResponse.id;
      console.log('✅ Backend session created:', sessionResult.id);
    }
    
    // Save each task with its metrics
    for (const task of sessionResult.completedTasks) {
      const taskMetrics = sessionResult.metrics[task] || {};
      const taskNote = sessionResult.notes[task] || '';
      
      const taskResponse = await addTask(sessionResult.id!, {
        task_name: task,
        duration_seconds: taskMetrics.duration || 0,
        status: 'success',
        notes: taskNote,
        metrics: taskMetrics,
      });
      
      // Save individual metrics
      for (const [metricName, metricValue] of Object.entries(taskMetrics)) {
        if (typeof metricValue === 'number') {
          await addMetric(taskResponse.id, {
            metric_name: metricName,
            metric_value: metricValue,
          });
        }
      }
    }
    
    // Save failed tasks
    for (const task of sessionResult.failedTasks) {
      await addTask(sessionResult.id!, {
        task_name: task,
        status: 'failed',
        notes: sessionResult.notes[task] || 'Task not completed',
      });
    }
    
    console.log('✅ Session data saved to backend successfully');
    
    // Also cache locally for offline access
    await saveToLocalDB(sessionResult);
    
    return sessionResult;
  } catch (error) {
    console.error('❌ Failed to save session to backend:', error);
    
    // Fallback: save locally
    const localId = `local-${Date.now()}`;
    sessionResult.id = sessionResult.id || localId;
    await saveToLocalDB(sessionResult);
    
    console.log('💾 Session saved locally as fallback:', sessionResult.id);
    throw error;
  }
}

/**
 * Fetch session result from backend and structure it
 */
export async function fetchSessionResult(sessionId: string): Promise<SessionResult | null> {
  try {
    console.log('📡 Fetching session from backend:', sessionId);
    
    // Try backend first
    const session = await getSession(sessionId);
    const tasksData = await getSessionTasks(sessionId);
    
    // Build task results
    const taskResults: TaskResult[] = await Promise.all(
      tasksData.map(async (task: any) => {
        const metricsData = await getTaskMetrics(task.id);
        const metricsObj: Record<string, number> = {};
        metricsData.forEach((m: any) => {
          metricsObj[m.metric_name] = m.metric_value;
        });
        
        return {
          task: task.task_name as TaskName,
          metrics: metricsObj,
          status: task.status === 'failed' ? 'failed' : 'success',
          notes: task.notes,
          duration: task.duration_seconds,
        } as TaskResult;
      })
    );
    
    // Build structured result
    return buildSessionResult(
      taskResults,
      sessionId,
      session.child_age,
      session.child_name,
      session.child_height_cm,
      session.child_gender
    );
  } catch (error) {
    console.warn('⚠️ Backend fetch failed, trying local cache:', error);
    
    // Fallback to local storage
    return getLocalSession(sessionId);
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate a parent-friendly report summary
 * Uses simple language and actionable recommendations
 */
export function generateParentReport(sessionResult: SessionResult): {
  title: string;
  date: string;
  overallMessage: string;
  scoreDisplay: string;
  tasks: Array<{
    name: string;
    result: 'passed' | 'developing' | 'needs-practice';
    emoji: string;
    tip: string;
  }>;
  nextSteps: string[];
} {
  const categoryEmoji = {
    'normal': '🌟',
    'borderline': '💪',
    'high-risk': '🤗',
  };
  
  const categoryMessage = {
    'normal': 'Great job! Your child shows healthy motor development.',
    'borderline': 'Good progress! Some skills are still developing.',
    'high-risk': 'Keep practicing! Consider speaking with a specialist for personalized guidance.',
  };
  
  const taskTips: Record<TaskName, { passed: string; needs: string }> = {
    raise_hand: {
      passed: 'Arm strength and flexibility are excellent!',
      needs: 'Practice reaching overhead during play for 5-10 minutes daily.',
    },
    one_leg: {
      passed: 'Balance is age-appropriate!',
      needs: 'Try balance games like flamingo pose or standing on one foot for 5 seconds.',
    },
    walk: {
      passed: 'Walking pattern looks good!',
      needs: 'Walk on different surfaces (grass, sand) to improve coordination.',
    },
    jump: {
      passed: 'Jumping skills are developing well!',
      needs: 'Practice hopscotch or jump rope for 10 minutes daily.',
    },
    tiptoe: {
      passed: 'Tiptoe balance is great!',
      needs: 'Pretend to be a ballerina and stand on tiptoes during play.',
    },
    squat: {
      passed: 'Squatting form is good!',
      needs: 'Play games that require bending down to pick up toys.',
    },
  };
  
  const tasks = Object.entries(sessionResult.scores).map(([task, score]) => {
    const taskName = task as TaskName;
    const result: 'passed' | 'developing' | 'needs-practice' = score === 2 ? 'passed' : score === 1 ? 'developing' : 'needs-practice';
    const emoji = score === 2 ? '✅' : score === 1 ? '🔶' : '❌';
    const tip = score >= 1 
      ? taskTips[taskName]?.passed || 'Keep up the good work!'
      : taskTips[taskName]?.needs || 'Continue practicing this skill.';
    
    return {
      name: task.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      result,
      emoji,
      tip,
    };
  });
  
  const nextSteps = sessionResult.overall.recommendations.slice(0, 3);
  if (sessionResult.overall.category === 'high-risk') {
    nextSteps.unshift('Consider scheduling a consultation with a pediatric physiotherapist.');
  }
  
  return {
    title: `Motor Skills Report for ${sessionResult.childName || 'Your Child'}`,
    date: new Date(sessionResult.date).toLocaleDateString(),
    overallMessage: `${categoryEmoji[sessionResult.overall.category]} ${categoryMessage[sessionResult.overall.category]}`,
    scoreDisplay: `${sessionResult.overall.totalScore}/${sessionResult.overall.maxScore} (${Math.round(sessionResult.overall.percentageScore)}%)`,
    tasks,
    nextSteps,
  };
}

/**
 * Generate detailed clinical report for professionals
 */
export function generateClinicalReport(sessionResult: SessionResult): {
  header: {
    sessionId: string;
    date: string;
    childAge: number;
    childName?: string;
  };
  classification: {
    category: string;
    score: string;
    summary: string;
  };
  taskDetails: Array<{
    task: string;
    score: string;
    metrics: Record<string, string>;
    notes: string;
  }>;
  textReport: string;
} {
  // Build task results for summary generation
  const taskResults = Object.entries(sessionResult.metrics).map(([task, metrics]) => ({
    task: task as TaskName,
    metrics: metrics || {},
  }));
  
  const summary = generateMotorAssessmentSummary(taskResults, sessionResult.childAge);
  const textReport = generateTextReport(summary);
  
  const taskDetails = Object.entries(sessionResult.scores).map(([task, score]) => {
    const taskMetrics = sessionResult.metrics[task as TaskName] || {};
    const metricsDisplay: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(taskMetrics)) {
      if (key.includes('Time') || key.includes('Duration')) {
        metricsDisplay[key] = `${value.toFixed(1)}s`;
      } else if (key.includes('Angle') || key.includes('Flexion') || key.includes('Sway')) {
        metricsDisplay[key] = `${Math.round(value)}°`;
      } else if (key.includes('Percent') || key.includes('Symmetry')) {
        metricsDisplay[key] = `${Math.round(value)}%`;
      } else {
        metricsDisplay[key] = String(value);
      }
    }
    
    return {
      task: task.replace('_', ' ').toUpperCase(),
      score: `${score}/2`,
      metrics: metricsDisplay,
      notes: sessionResult.notes[task as TaskName] || '',
    };
  });
  
  return {
    header: {
      sessionId: sessionResult.id || 'Unknown',
      date: sessionResult.date,
      childAge: sessionResult.childAge,
      childName: sessionResult.childName,
    },
    classification: {
      category: sessionResult.overall.category.toUpperCase(),
      score: `${sessionResult.overall.totalScore}/${sessionResult.overall.maxScore} (${Math.round(sessionResult.overall.percentageScore)}%)`,
      summary: sessionResult.overall.summary,
    },
    taskDetails,
    textReport,
  };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Generate JSON export of session data
 * Useful for data portability and analysis
 */
export function exportSessionAsJSON(sessionResult: SessionResult): string {
  return JSON.stringify(sessionResult, null, 2);
}

/**
 * Generate CSV export of session metrics
 * Useful for spreadsheet analysis
 */
export function exportSessionAsCSV(sessionResult: SessionResult): string {
  const headers = ['Task', 'Score', 'Notes'];
  const metricKeys = new Set<string>();
  
  // Collect all unique metric keys
  for (const metrics of Object.values(sessionResult.metrics)) {
    if (metrics) {
      for (const key of Object.keys(metrics)) {
        metricKeys.add(key);
      }
    }
  }
  
  headers.push(...Array.from(metricKeys));
  
  const rows = [headers.join(',')];
  
  for (const [task, score] of Object.entries(sessionResult.scores)) {
    const metrics = sessionResult.metrics[task as TaskName] || {};
    const note = sessionResult.notes[task as TaskName] || '';
    
    const row = [
      task,
      String(score),
      `"${note.replace(/"/g, '""')}"`, // Escape quotes in notes
    ];
    
    for (const key of metricKeys) {
      row.push(String(metrics[key] ?? ''));
    }
    
    rows.push(row.join(','));
  }
  
  // Add summary row
  rows.push('');
  rows.push(`Overall,${sessionResult.overall.category},${sessionResult.overall.summary.replace(/,/g, ';')}`);
  rows.push(`Total Score,${sessionResult.overall.totalScore}/${sessionResult.overall.maxScore}`);
  rows.push(`Percentage,${Math.round(sessionResult.overall.percentageScore)}%`);
  
  return rows.join('\n');
}

/**
 * Check if backend API is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
