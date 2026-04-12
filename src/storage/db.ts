import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DailyGoal, FinalGoal, DailyEntry, RoadmapPhase, RoadmapItem } from '../types';

interface GoalTrackerDB extends DBSchema {
  finalGoals: {
    key: string;
    value: FinalGoal;
  };
  dailyGoals: {
    key: string;
    value: DailyGoal;
    indexes: { 'by-final-goal': string };
  };
  dailyEntries: {
    key: string;
    value: DailyEntry;
    indexes: { 'by-date': string };
  };
  roadmapPhases: {
    key: string;
    value: RoadmapPhase;
  };
  roadmapItems: {
    key: string;
    value: RoadmapItem;
    indexes: { 'by-phase': string };
  };
}

let dbPromise: Promise<IDBPDatabase<GoalTrackerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<GoalTrackerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GoalTrackerDB>('goal-tracker', 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('finalGoals')) {
          db.createObjectStore('finalGoals', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('dailyGoals')) {
          const dailyGoalsStore = db.createObjectStore('dailyGoals', { keyPath: 'id' });
          dailyGoalsStore.createIndex('by-final-goal', 'finalGoalId');
        }

        if (!db.objectStoreNames.contains('dailyEntries')) {
          const dailyEntriesStore = db.createObjectStore('dailyEntries', { keyPath: 'id' });
          dailyEntriesStore.createIndex('by-date', 'date');
        }

        if (!db.objectStoreNames.contains('roadmapPhases')) {
          db.createObjectStore('roadmapPhases', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('roadmapItems')) {
          const roadmapItemsStore = db.createObjectStore('roadmapItems', { keyPath: 'id' });
          roadmapItemsStore.createIndex('by-phase', 'phaseId');
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
    version: 1,
    exportedAt: new Date().toISOString(),
    finalGoals: await db.getAll('finalGoals'),
    dailyGoals: await db.getAll('dailyGoals'),
    dailyEntries: await db.getAll('dailyEntries'),
    roadmapPhases: await db.getAll('roadmapPhases'),
    roadmapItems: await db.getAll('roadmapItems'),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  const db = await getDB();

  const tx = db.transaction(
    ['finalGoals', 'dailyGoals', 'dailyEntries', 'roadmapPhases', 'roadmapItems'],
    'readwrite'
  );

  await tx.objectStore('finalGoals').clear();
  await tx.objectStore('dailyGoals').clear();
  await tx.objectStore('dailyEntries').clear();
  await tx.objectStore('roadmapPhases').clear();
  await tx.objectStore('roadmapItems').clear();

  for (const item of data.finalGoals ?? []) await tx.objectStore('finalGoals').add(item);
  for (const item of data.dailyGoals ?? []) await tx.objectStore('dailyGoals').add(item);
  for (const item of data.dailyEntries ?? []) await tx.objectStore('dailyEntries').add(item);
  for (const item of data.roadmapPhases ?? []) await tx.objectStore('roadmapPhases').add(item);
  for (const item of data.roadmapItems ?? []) await tx.objectStore('roadmapItems').add(item);

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
