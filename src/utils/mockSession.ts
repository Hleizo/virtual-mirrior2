import type { SessionSummary } from '../store/session';

/**
 * DEPRECATED: Mock session generation
 * This utility is no longer used. All sessions come from the backend API.
 */
export function makeMockSession(): SessionSummary {
  console.warn('makeMockSession is deprecated and should not be used.');
  return {
    sessionId: 'DEPRECATED',
    startedAt: new Date().toISOString(),
    tasks: []
  };
}

