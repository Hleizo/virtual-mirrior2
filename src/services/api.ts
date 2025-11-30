// API Communication Layer for Virtual Mirror Backend

export const API_URL = "http://localhost:8000";

interface SessionData {
  child_name: string;
  child_age: number;
  child_height_cm?: number;
  child_weight_kg?: number;
  child_gender?: string;
  child_notes?: string;
  task_metrics?: Record<string, any>;
  session_type?: string;  // "initial" or "followup"
  parent_session_id?: string;  // ID of parent session if this is a follow-up
}

export interface SessionResponse {
  id: string;
  display_id?: number;
  child_name: string;
  child_age: number;
  child_height_cm?: number;
  child_weight_kg?: number;
  child_gender?: string;
  child_notes?: string;
  started_at?: string;
  session_type?: string;
  parent_session_id?: string;
}

interface TaskData {
  task_name: string;
  duration_seconds?: number;
  status?: string;
  notes?: string;
  metrics?: Record<string, number>;
}

interface MetricData {
  metric_name: string;
  metric_value: number;
}

/**
 * Create a new session
 */
export async function createSession(sessionData: SessionData) {
  const response = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to create session" }));
    console.error('❌ API Error createSession:', error);
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Add a task to a session
 */
export async function addTask(sessionId: string, taskData: TaskData) {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to add task" }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Add a metric to a task
 */
export async function addMetric(taskId: string, metricData: MetricData) {
  const response = await fetch(`${API_URL}/tasks/${taskId}/metrics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metricData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to add metric" }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<SessionResponse> {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get session" }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all sessions
 */
export async function getAllSessions(): Promise<SessionResponse[]> {
  const response = await fetch(`${API_URL}/sessions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get sessions" }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all tasks for a session
 */
export async function getSessionTasks(sessionId: string) {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get tasks" }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all metrics for a task
 */
export async function getTaskMetrics(taskId: string) {
  const response = await fetch(`${API_URL}/tasks/${taskId}/metrics`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get metrics" }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
  const response = await fetch(`${API_URL}/health`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all follow-up sessions for a parent session
 */
export async function getFollowupSessions(sessionId: string) {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/followups`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get follow-up sessions" }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
