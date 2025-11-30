/**
 * Session Storage Service - DEPRECATED
 * This service is now a stub. All data is stored in Supabase via the backend API.
 * Local storage has been removed. This file remains only for backward compatibility.
 */

export interface SessionMetrics {
  // Pose data
  poseData?: any[];
  
  // Task-specific metrics
  raiseHandMetrics?: {
    leftShoulderMax: number;
    rightShoulderMax: number;
    leftSuccess: boolean;
    rightSuccess: boolean;
    overallSuccess: boolean;
  };
  
  balanceMetrics?: {
    maxBalanceTime: number;
    stabilityScore: number;
    balanceLevel: string;
    fallCount: number;
    success: boolean;
  };
  
  walkMetrics?: {
    stepCount: number;
    gaitSymmetry: number;
    cadence: number;
    symmetryLevel: string;
    success: boolean;
  };
  
  jumpMetrics?: {
    jumpCount: number;
    maxJumpHeight: number;
    landingControl: number;
    landingSymmetry: number;
    success: boolean;
  };
  
  // ROM and symmetry data
  romData?: Record<string, {
    min: number;
    max: number;
    range: number;
    mean: number;
    stdDev: number;
  }>;
  
}

export interface AnalysisResults {
  risk_level: string;
  classification: string;
  confidence: number;
  flags: string[];
  recommendations: string[];
  detailed_metrics?: any;
}

export interface StoredSession {
  id: string;
  patientName?: string;
  patientAge?: number;
  date: string;
  timestamp: number;
  duration: number;
  dataPoints: number;
  metrics: SessionMetrics;
  analysisResults?: AnalysisResults;
  notes?: string;
  videoThumbnail?: string;
}

/**
 * DEPRECATED: SessionStorageService
 * All session storage is now handled by the backend API and Supabase.
 * This class provides stub methods for backward compatibility only.
 */
class SessionStorageService {
  async init(): Promise<void> {
    console.warn('SessionStorageService is deprecated. Use the backend API instead.');
    return Promise.resolve();
  }

  async saveSession(
    _metrics: SessionMetrics,
    _analysisResults?: AnalysisResults,
    _options?: {
      patientName?: string;
      patientAge?: number;
      notes?: string;
      videoThumbnail?: string;
    }
  ): Promise<string> {
    console.warn('Local session storage is disabled. Use the backend API to save sessions.');
    return Promise.resolve('deprecated-session-id');
  }

  async getSession(_id: string): Promise<StoredSession | null> {
    console.warn('Local session storage is disabled. Use the backend API to retrieve sessions.');
    return Promise.resolve(null);
  }

  async getAllSessions(_options?: any): Promise<StoredSession[]> {
    console.warn('Local session storage is disabled. Use the backend API to retrieve sessions.');
    return Promise.resolve([]);
  }

  async updateSession(_id: string, _updates: Partial<StoredSession>): Promise<void> {
    console.warn('Local session storage is disabled. Use the backend API to update sessions.');
    return Promise.resolve();
  }

  async deleteSession(_id: string): Promise<void> {
    console.warn('Local session storage is disabled. Use the backend API to delete sessions.');
    return Promise.resolve();
  }

  async deleteSessions(_sessionIds: string[]): Promise<void> {
    console.warn('Local session storage is disabled. Use the backend API to delete sessions.');
    return Promise.resolve();
  }

  async searchSessions(_criteria: any): Promise<StoredSession[]> {
    console.warn('Local session storage is disabled. Use the backend API to search sessions.');
    return Promise.resolve([]);
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    totalDataPoints: number;
    avgDuration: number;
    riskDistribution: Record<string, number>;
  }> {
    console.warn('Local session storage is disabled. Use the backend API for statistics.');
    return Promise.resolve({
      totalSessions: 0,
      totalDataPoints: 0,
      avgDuration: 0,
      riskDistribution: {}
    });
  }

  async getStatistics(): Promise<any> {
    console.warn('Local session storage is disabled. Use the backend API for statistics.');
    return Promise.resolve({
      totalSessions: 0,
      totalDataPoints: 0,
      averageDuration: 0,
      riskLevelDistribution: {},
      ageDistribution: {},
      sessionsThisWeek: 0,
      sessionsThisMonth: 0
    });
  }

  async exportSessions(_sessionIds?: string[]): Promise<string> {
    console.warn('Local session export is disabled.');
    return Promise.resolve('{}');
  }

  async importSessions(_jsonData: string): Promise<number> {
    console.warn('Local session import is disabled.');
    return Promise.resolve(0);
  }

  async clearAllSessions(): Promise<void> {
    console.warn('Local session storage is disabled. Nothing to clear.');
    return Promise.resolve();
  }
}

const sessionStorage = new SessionStorageService();
export default sessionStorage;

