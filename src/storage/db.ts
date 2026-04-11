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

let dbInstance: IDBPDatabase<GoalTrackerDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<GoalTrackerDB>('goal-tracker', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('finalGoals', { keyPath: 'id' });

        const dailyGoalsStore = db.createObjectStore('dailyGoals', { keyPath: 'id' });
        dailyGoalsStore.createIndex('by-final-goal', 'finalGoalId');

        const dailyEntriesStore = db.createObjectStore('dailyEntries', { keyPath: 'id' });
        dailyEntriesStore.createIndex('by-date', 'date');
      }

      if (oldVersion < 2) {
        db.createObjectStore('roadmapPhases', { keyPath: 'id' });

        const roadmapItemsStore = db.createObjectStore('roadmapItems', { keyPath: 'id' });
        roadmapItemsStore.createIndex('by-phase', 'phaseId');
      }
    },
  });

  await seedInitialData();
  await seedRoadmapData();
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

async function seedRoadmapData() {
  const db = dbInstance!;
  const phasesCount = await db.count('roadmapPhases');

  if (phasesCount > 0) return;

  const phases: RoadmapPhase[] = [
    { id: 'phase-0', title: 'Préparation départ', country: 'France', duration: 'Now → May 2026', order: 0 },
    { id: 'phase-1', title: 'FIFO mines', country: 'Australie (Perth / Pilbara)', duration: '18 mois', order: 1 },
    { id: 'phase-2', title: 'Nouvelle destination', country: 'Canada / Nouvelle-Zélande', duration: '12–18 mois', order: 2 },
    { id: 'phase-3', title: 'Asie / Amérique du Sud', country: 'À définir', duration: '2029–2031', order: 3 },
    { id: 'phase-4', title: 'Positionnement senior', country: 'À définir', duration: '2031+', order: 4 },
  ];

  const items: RoadmapItem[] = [
    // Phase 0 - 14 items
    { id: 'item-1', phaseId: 'phase-0', title: 'Visa 417 obtenu et validé', completed: false },
    { id: 'item-2', phaseId: 'phase-0', title: 'Fermer micro-entreprises', completed: false },
    { id: 'item-3', phaseId: 'phase-0', title: 'PVT Canada loterie inscrite', completed: false },
    { id: 'item-4', phaseId: 'phase-0', title: 'Lettre de recommandation superviseur Volvo CE signée', completed: false },
    { id: 'item-5', phaseId: 'phase-0', title: 'Diplôme + notes traduits en anglais', completed: false },
    { id: 'item-6', phaseId: 'phase-0', title: 'Formation CPF anglais technique lancée', completed: false },
    { id: 'item-7', phaseId: 'phase-0', title: 'Formation CPF premiers secours PSC1', completed: false },
    { id: 'item-8', phaseId: 'phase-0', title: 'Permis de conduire international obtenu', completed: false },
    { id: 'item-9', phaseId: 'phase-0', title: 'BMW E28 vendue', completed: false },
    { id: 'item-10', phaseId: 'phase-0', title: 'Budget 8000€ constitué', completed: false },
    { id: 'item-11', phaseId: 'phase-0', title: 'CV australien finalisé', completed: false },
    { id: 'item-12', phaseId: 'phase-0', title: 'Recherches agences recrutement Perth lancées', completed: false },
    { id: 'item-13', phaseId: 'phase-0', title: 'Billet avion France → Perth réservé', completed: false },
    { id: 'item-14', phaseId: 'phase-0', title: 'Assurance voyage WHV souscrite', completed: false },

    // Phase 1 - 19 items
    { id: 'item-15', phaseId: 'phase-1', title: 'Arrivée à Perth', completed: false },
    { id: 'item-16', phaseId: 'phase-1', title: 'Logement temporaire trouvé', completed: false },
    { id: 'item-17', phaseId: 'phase-1', title: 'TFN obtenu', completed: false },
    { id: 'item-18', phaseId: 'phase-1', title: 'White Card passée', completed: false },
    { id: 'item-19', phaseId: 'phase-1', title: 'First Aid Certificate obtenu', completed: false },
    { id: 'item-20', phaseId: 'phase-1', title: 'Inscrit dans 3+ agences de recrutement', completed: false },
    { id: 'item-21', phaseId: 'phase-1', title: 'CV déposé Programmed, Workpac, Chandler Macleod', completed: false },
    { id: 'item-22', phaseId: 'phase-1', title: 'Premier job FIFO décroché', completed: false },
    { id: 'item-23', phaseId: 'phase-1', title: 'Forklift licence obtenue', completed: false },
    { id: 'item-24', phaseId: 'phase-1', title: '88 jours specified work validés', completed: false },
    { id: 'item-25', phaseId: 'phase-1', title: 'Inscription ASU Online BS Engineering Management', completed: false },
    { id: 'item-26', phaseId: 'phase-1', title: 'Premier semestre universitaire complété', completed: false },
    { id: 'item-27', phaseId: 'phase-1', title: '20 000 AUD économisés', completed: false },
    { id: 'item-28', phaseId: 'phase-1', title: '40 000 AUD économisés', completed: false },
    { id: 'item-29', phaseId: 'phase-1', title: 'Visa 2ème année Australie obtenu', completed: false },
    { id: 'item-30', phaseId: 'phase-1', title: 'PVT Canada résultat vérifié', completed: false },

    // Phase 2 - 9 items
    { id: 'item-31', phaseId: 'phase-2', title: 'Destination choisie', completed: false },
    { id: 'item-32', phaseId: 'phase-2', title: 'Visa obtenu', completed: false },
    { id: 'item-33', phaseId: 'phase-2', title: 'Job mécanique trouvé', completed: false },
    { id: 'item-34', phaseId: 'phase-2', title: 'Contact ami Sept-Iles activé si Canada', completed: false },
    { id: 'item-35', phaseId: 'phase-2', title: 'Continuation BS Engineering en cours', completed: false },
    { id: 'item-36', phaseId: 'phase-2', title: 'Premier investissement étudié SCPI France', completed: false },
    { id: 'item-37', phaseId: 'phase-2', title: '10 000€ supplémentaires économisés', completed: false },
    { id: 'item-38', phaseId: 'phase-2', title: 'Réseau professionnel oil & gas commencé', completed: false },
    { id: 'item-39', phaseId: 'phase-2', title: 'Mi-parcours BS Engineering atteint', completed: false },

    // Phase 3 - 7 items
    { id: 'item-40', phaseId: 'phase-3', title: 'Destination choisie', completed: false },
    { id: 'item-41', phaseId: 'phase-3', title: 'Budget mensuel inférieur à 1000€ maintenu', completed: false },
    { id: 'item-42', phaseId: 'phase-3', title: 'BS Engineering Management finalisé', completed: false },
    { id: 'item-43', phaseId: 'phase-3', title: 'Diplôme ABET reçu', completed: false },
    { id: 'item-44', phaseId: 'phase-3', title: 'Dossier PMP constitué', completed: false },
    { id: 'item-45', phaseId: 'phase-3', title: 'Examen PMP passé et obtenu', completed: false },
    { id: 'item-46', phaseId: 'phase-3', title: 'Investissement immobilier France consolidé', completed: false },
    { id: 'item-47', phaseId: 'phase-3', title: 'Décision phase suivante prise', completed: false },

    // Phase 4 - 5 items
    { id: 'item-48', phaseId: 'phase-4', title: 'Premier poste Project Engineer décroché', completed: false },
    { id: 'item-49', phaseId: 'phase-4', title: 'Salaire 100k€+ atteint', completed: false },
    { id: 'item-50', phaseId: 'phase-4', title: 'MSc Heriot-Watt décision prise', completed: false },
    { id: 'item-51', phaseId: 'phase-4', title: 'Patrimoine immobilier supérieur à 1 bien', completed: false },
    { id: 'item-52', phaseId: 'phase-4', title: 'Projet business défini et lancé', completed: false },
  ];

  const tx = db.transaction(['roadmapPhases', 'roadmapItems'], 'readwrite');
  await Promise.all([
    ...phases.map(p => tx.objectStore('roadmapPhases').add(p)),
    ...items.map(i => tx.objectStore('roadmapItems').add(i)),
    tx.done,
  ]);
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
