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
