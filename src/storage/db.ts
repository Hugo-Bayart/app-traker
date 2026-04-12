import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DailyGoal, FinalGoal, DailyEntry, RoadmapPhase, RoadmapItem, Goal, DailyAction, GoalEntry, ActionCompletion } from '../types';

interface GoalTrackerDB extends DBSchema {
  finalGoals: { key: string; value: FinalGoal };
  dailyGoals: { key: string; value: DailyGoal; indexes: { 'by-final-goal': string } };
  dailyEntries: { key: string; value: DailyEntry; indexes: { 'by-date': string } };
  roadmapPhases: { key: string; value: RoadmapPhase };
  roadmapItems: { key: string; value: RoadmapItem; indexes: { 'by-phase': string } };
  goals: { key: string; value: Goal };
  dailyActions: { key: string; value: DailyAction; indexes: { 'by-goal': string } };
  goalEntries: { key: string; value: GoalEntry; indexes: { 'by-goal': string } };
  actionCompletions: { key: string; value: ActionCompletion; indexes: { 'by-goal': string; 'by-date': string; 'by-action': string } };
}

let dbPromise: Promise<IDBPDatabase<GoalTrackerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<GoalTrackerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GoalTrackerDB>('goal-tracker', 4, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('finalGoals')) db.createObjectStore('finalGoals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('dailyGoals')) {
          const s = db.createObjectStore('dailyGoals', { keyPath: 'id' });
          s.createIndex('by-final-goal', 'finalGoalId');
        }
        if (!db.objectStoreNames.contains('dailyEntries')) {
          const s = db.createObjectStore('dailyEntries', { keyPath: 'id' });
          s.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('roadmapPhases')) db.createObjectStore('roadmapPhases', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('roadmapItems')) {
          const s = db.createObjectStore('roadmapItems', { keyPath: 'id' });
          s.createIndex('by-phase', 'phaseId');
        }
        if (!db.objectStoreNames.contains('goals')) db.createObjectStore('goals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('dailyActions')) {
          const s = db.createObjectStore('dailyActions', { keyPath: 'id' });
          s.createIndex('by-goal', 'goalId');
        }
        if (!db.objectStoreNames.contains('goalEntries')) {
          const s = db.createObjectStore('goalEntries', { keyPath: 'id' });
          s.createIndex('by-goal', 'goalId');
        }
        if (!db.objectStoreNames.contains('actionCompletions')) {
          const s = db.createObjectStore('actionCompletions', { keyPath: 'id' });
          s.createIndex('by-goal', 'goalId');
          s.createIndex('by-date', 'date');
          s.createIndex('by-action', 'actionId');
        }
      },
    });
  }
  return dbPromise;
}

export async function getRoadmapPhases(): Promise<RoadmapPhase[]> {
  const db = await getDB();
  return db.getAll('roadmapPhases');
}

export async function addRoadmapPhase(phase: RoadmapPhase): Promise<void> {
  const db = await getDB();
  await db.add('roadmapPhases', phase);
}

export async function updateRoadmapPhase(phase: RoadmapPhase): Promise<void> {
  const db = await getDB();
  await db.put('roadmapPhases', phase);
}

export async function deleteRoadmapPhase(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['roadmapPhases', 'roadmapItems'], 'readwrite');
  await tx.objectStore('roadmapPhases').delete(id);
  const itemKeys = await tx.objectStore('roadmapItems').index('by-phase').getAllKeys(id);
  await Promise.all(itemKeys.map(key => tx.objectStore('roadmapItems').delete(key)));
  await tx.done;
}

export async function getRoadmapItemsByPhase(phaseId: string): Promise<RoadmapItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('roadmapItems', 'by-phase', phaseId);
}

export async function addRoadmapItem(item: RoadmapItem): Promise<void> {
  const db = await getDB();
  await db.add('roadmapItems', item);
}

export async function updateRoadmapItem(item: RoadmapItem): Promise<void> {
  const db = await getDB();
  await db.put('roadmapItems', item);
}

export async function deleteRoadmapItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('roadmapItems', id);
}

export async function getRoadmapItems(): Promise<RoadmapItem[]> {
  const db = await getDB();
  return db.getAll('roadmapItems');
}

export async function exportAllData(): Promise<string> {
  const db = await getDB();
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    finalGoals: await db.getAll('finalGoals'),
    dailyGoals: await db.getAll('dailyGoals'),
    dailyEntries: await db.getAll('dailyEntries'),
    roadmapPhases: await db.getAll('roadmapPhases'),
    roadmapItems: await db.getAll('roadmapItems'),
    goals: await db.getAll('goals'),
    dailyActions: await db.getAll('dailyActions'),
    goalEntries: await db.getAll('goalEntries'),
    actionCompletions: await db.getAll('actionCompletions'),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  const db = await getDB();
  const tx = db.transaction(
    ['finalGoals', 'dailyGoals', 'dailyEntries', 'roadmapPhases', 'roadmapItems',
     'goals', 'dailyActions', 'goalEntries', 'actionCompletions'],
    'readwrite'
  );
  for (const store of ['finalGoals','dailyGoals','dailyEntries','roadmapPhases','roadmapItems',
                        'goals','dailyActions','goalEntries','actionCompletions'] as const) {
    await tx.objectStore(store).clear();
    for (const item of data[store] ?? []) await tx.objectStore(store).add(item);
  }
  await tx.done;
}

export async function getFinalGoals(): Promise<FinalGoal[]> {
  const db = await getDB();
  return db.getAll('finalGoals');
}

export async function addFinalGoal(goal: FinalGoal): Promise<void> {
  const db = await getDB();
  await db.add('finalGoals', goal);
}

export async function updateFinalGoal(goal: FinalGoal): Promise<void> {
  const db = await getDB();
  await db.put('finalGoals', goal);
}

export async function deleteFinalGoal(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['finalGoals', 'dailyGoals'], 'readwrite');
  await tx.objectStore('finalGoals').delete(id);
  
  const dailyGoals = await tx.objectStore('dailyGoals').index('by-final-goal').getAllKeys(id);
  await Promise.all(dailyGoals.map(key => tx.objectStore('dailyGoals').delete(key)));
  await tx.done;
}

export async function getDailyGoals(): Promise<DailyGoal[]> {
  const db = await getDB();
  return db.getAll('dailyGoals');
}

export async function getDailyGoalsByFinalGoal(finalGoalId: string): Promise<DailyGoal[]> {
  const db = await getDB();
  return db.getAllFromIndex('dailyGoals', 'by-final-goal', finalGoalId);
}

export async function addDailyGoal(goal: DailyGoal): Promise<void> {
  const db = await getDB();
  await db.add('dailyGoals', goal);
}

export async function updateDailyGoal(goal: DailyGoal): Promise<void> {
  const db = await getDB();
  await db.put('dailyGoals', goal);
}

export async function deleteDailyGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('dailyGoals', id);
}

export async function getDailyEntry(date: string): Promise<DailyEntry | undefined> {
  const db = await getDB();
  return db.getFromIndex('dailyEntries', 'by-date', date);
}

export async function saveDailyEntry(entry: DailyEntry): Promise<void> {
  const db = await getDB();
  await db.put('dailyEntries', entry);
}

export async function getDailyEntriesInRange(startDate: string, endDate: string): Promise<DailyEntry[]> {
  const db = await getDB();
  const allEntries = await db.getAll('dailyEntries');
  return allEntries.filter(e => e.date >= startDate && e.date <= endDate);
}

// ── Goals ────────────────────────────────────────────────
export async function getGoals(): Promise<Goal[]> {
  const db = await getDB();
  return db.getAll('goals');
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
  const db = await getDB();
  return db.get('goals', id);
}

export async function addGoal(goal: Goal): Promise<void> {
  const db = await getDB();
  await db.add('goals', goal);
}

export async function updateGoal(goal: Goal): Promise<void> {
  const db = await getDB();
  await db.put('goals', goal);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['goals', 'dailyActions', 'goalEntries', 'actionCompletions'], 'readwrite');
  await tx.objectStore('goals').delete(id);
  const actionKeys = await tx.objectStore('dailyActions').index('by-goal').getAllKeys(id);
  for (const k of actionKeys) await tx.objectStore('dailyActions').delete(k);
  const entryKeys = await tx.objectStore('goalEntries').index('by-goal').getAllKeys(id);
  for (const k of entryKeys) await tx.objectStore('goalEntries').delete(k);
  const compKeys = await tx.objectStore('actionCompletions').index('by-goal').getAllKeys(id);
  for (const k of compKeys) await tx.objectStore('actionCompletions').delete(k);
  await tx.done;
}

// ── DailyActions ─────────────────────────────────────────
export async function getDailyActionsByGoal(goalId: string): Promise<DailyAction[]> {
  const db = await getDB();
  return db.getAllFromIndex('dailyActions', 'by-goal', goalId);
}

export async function getAllDailyActions(): Promise<DailyAction[]> {
  const db = await getDB();
  return db.getAll('dailyActions');
}

export async function addDailyAction(action: DailyAction): Promise<void> {
  const db = await getDB();
  await db.add('dailyActions', action);
}

export async function deleteDailyAction(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['dailyActions', 'actionCompletions'], 'readwrite');
  await tx.objectStore('dailyActions').delete(id);
  const keys = await tx.objectStore('actionCompletions').index('by-action').getAllKeys(id);
  for (const k of keys) await tx.objectStore('actionCompletions').delete(k);
  await tx.done;
}

// ── GoalEntries ───────────────────────────────────────────
export async function getGoalEntriesByGoal(goalId: string): Promise<GoalEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('goalEntries', 'by-goal', goalId);
}

export async function addGoalEntry(entry: GoalEntry): Promise<void> {
  const db = await getDB();
  await db.add('goalEntries', entry);
}

// ── ActionCompletions ─────────────────────────────────────
export async function getActionCompletionsForDate(date: string): Promise<ActionCompletion[]> {
  const db = await getDB();
  return db.getAllFromIndex('actionCompletions', 'by-date', date);
}

export async function getActionCompletionsByGoal(goalId: string): Promise<ActionCompletion[]> {
  const db = await getDB();
  return db.getAllFromIndex('actionCompletions', 'by-goal', goalId);
}

export async function getActionCompletionsInRange(start: string, end: string): Promise<ActionCompletion[]> {
  const db = await getDB();
  const all = await db.getAll('actionCompletions');
  return all.filter(c => c.date >= start && c.date <= end);
}

export async function saveActionCompletion(completion: ActionCompletion): Promise<void> {
  const db = await getDB();
  await db.put('actionCompletions', completion);
}

// ── Sync DailyEntry from ActionCompletions (for Insights) ─
export async function syncDailyEntry(date: string): Promise<void> {
  const db = await getDB();
  const allActions = await db.getAll('dailyActions');
  const completions = await db.getAllFromIndex('actionCompletions', 'by-date', date);
  const completedIds = completions.filter(c => c.completed).map(c => c.actionId);
  const score = allActions.length > 0 ? Math.round((completedIds.length / allActions.length) * 100) : 0;
  const existing = await db.getFromIndex('dailyEntries', 'by-date', date);
  await db.put('dailyEntries', {
    id: existing?.id ?? date,
    date,
    completedGoalIds: completedIds,
    score,
    note: existing?.note ?? '',
    validated: existing?.validated ?? false,
  });
}
