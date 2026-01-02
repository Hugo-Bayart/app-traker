import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DailyGoal, FinalGoal, DailyEntry } from '../types';

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
}

let dbInstance: IDBPDatabase<GoalTrackerDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<GoalTrackerDB>('goal-tracker', 1, {
    upgrade(db) {
      const finalGoalsStore = db.createObjectStore('finalGoals', { keyPath: 'id' });
      
      const dailyGoalsStore = db.createObjectStore('dailyGoals', { keyPath: 'id' });
      dailyGoalsStore.createIndex('by-final-goal', 'finalGoalId');
      
      const dailyEntriesStore = db.createObjectStore('dailyEntries', { keyPath: 'id' });
      dailyEntriesStore.createIndex('by-date', 'date');
    },
  });

  await seedInitialData();
  return dbInstance;
}

async function seedInitialData() {
  const db = dbInstance!;
  const finalGoalsCount = await db.count('finalGoals');
  
  if (finalGoalsCount > 0) return;

  const finalGoals: FinalGoal[] = [
    { id: 'f1', title: '100k CA', createdAt: Date.now() },
    { id: 'f2', title: 'Délocaliser société', createdAt: Date.now() },
    { id: 'f3', title: '+10kg muscle', createdAt: Date.now() },
    { id: 'f4', title: 'Déménager Italie/USA', createdAt: Date.now() },
  ];

  const dailyGoals: DailyGoal[] = [
    { id: 'd1', title: '1 action business', pillar: 'Business', weight: 5, finalGoalId: 'f1' },
    { id: 'd2', title: '1 action délocalisation', pillar: 'Structure', weight: 4, finalGoalId: 'f2' },
    { id: 'd3', title: 'Training', pillar: 'Corps', weight: 5, finalGoalId: 'f3' },
    { id: 'd4', title: 'Nutrition OK', pillar: 'Corps', weight: 3, finalGoalId: 'f3' },
    { id: 'd5', title: '1 action vision', pillar: 'Vision', weight: 4, finalGoalId: 'f4' },
  ];

  const tx = db.transaction(['finalGoals', 'dailyGoals'], 'readwrite');
  await Promise.all([
    ...finalGoals.map(g => tx.objectStore('finalGoals').add(g)),
    ...dailyGoals.map(g => tx.objectStore('dailyGoals').add(g)),
    tx.done,
  ]);
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
