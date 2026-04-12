export type Pillar = 'Business' | 'Structure' | 'Corps' | 'Vision';

export interface DailyGoal {
  id: string;
  title: string;
  pillar: Pillar;
  weight: number;
  finalGoalId: string;
}

export interface FinalGoal {
  id: string;
  title: string;
  createdAt: number;
}

export interface DailyEntry {
  id: string;
  date: string;
  completedGoalIds: string[];
  score: number;
  note?: string;
  validated?: boolean;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  country: string;
  duration: string;
  order: number;
}

export interface RoadmapItem {
  id: string;
  phaseId: string;
  title: string;
  completed: boolean;
}

// ── New Goal system ──────────────────────────────────────
export type MeasureType =
  | 'weight' | 'savings' | 'distance' | 'time' | 'count' | 'custom' | 'qualitative';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  targetDate?: string;           // "YYYY-MM-DD"
  measureType: MeasureType;
  unit?: string;
  startValue?: number;
  currentValue?: number;
  targetValue?: number;
  weightDirection?: 'lose' | 'gain';
}

export interface DailyAction {
  id: string;
  goalId: string;
  title: string;
  createdAt: number;
}

export interface GoalEntry {
  id: string;
  goalId: string;
  value: number;
  date: string;                  // "YYYY-MM-DD"
  note?: string;
}

export interface ActionCompletion {
  id: string;                    // composite: "${actionId}_${date}"
  actionId: string;
  goalId: string;
  date: string;                  // "YYYY-MM-DD"
  completed: boolean;
}
