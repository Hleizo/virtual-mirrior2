import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskName = 'raise_hand' | 'one_leg' | 'walk' | 'jump';

export type TaskMetric = {
  task: TaskName;
  metrics: Record<string, number | string>;
  flags?: string[];
};

export type SessionSummary = {
  sessionId: string;
  childAgeYears?: number;
  startedAt: string;
  endedAt?: string;
  overallRisk?: 'normal' | 'monitor' | 'high';
  tasks: TaskMetric[];
};

export type ChildProfile = {
  childName: string;
  ageYears: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  notes?: string;
};

interface SessionStore {
  current: SessionSummary | null;
  childProfile: ChildProfile | null;
  setCurrent: (summary: SessionSummary) => void;
  setChildProfile: (profile: ChildProfile) => void;
  getCurrent: () => SessionSummary | null;
  getChildProfile: () => ChildProfile | null;
  clear: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      current: null,
      childProfile: null,
      setCurrent: (summary) => set({ current: summary }),
      setChildProfile: (profile) => set({ childProfile: profile }),
      getCurrent: () => get().current,
      getChildProfile: () => get().childProfile,
      clear: () => set({ current: null, childProfile: null }),
    }),
    {
      name: 'virtual-mirror-session', // localStorage key
    }
  )
);
