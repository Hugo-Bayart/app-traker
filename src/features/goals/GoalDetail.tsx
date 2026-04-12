import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Goal, DailyAction, GoalEntry, ActionCompletion, MeasureType } from '../../types';
import {
  getGoalById, updateGoal, deleteGoal,
  getDailyActionsByGoal, addDailyAction, deleteDailyAction,
  getGoalEntriesByGoal, addGoalEntry,
  getActionCompletionsByGoal, saveActionCompletion, syncDailyEntry,
} from '../../storage/db';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { ArrowLeftIcon, TrashIcon, CheckCircleIcon, CircleIcon } from '../../components/Icons';
import './GoalDetail.css';

const TYPE_INFO: Record<MeasureType, { label: string; abbr: string; color: string }> = {
  weight:      { label: 'Poids',        abbr: 'KG', color: '#3B82F6' },
  savings:     { label: 'Économies',    abbr: '€',  color: '#10B981' },
  distance:    { label: 'Distance',     abbr: 'KM', color: '#F59E0B' },
  time:        { label: 'Temps',        abbr: 'H',  color: '#8B5CF6' },
  count:       { label: 'Comptage',     abbr: '#',  color: '#6B7280' },
  custom:      { label: 'Personnalisé', abbr: '~',  color: '#14B8A6' },
  qualitative: { label: 'Qualitatif',  abbr: 'OK', color: '#EF4444' },
};

function toDateStr(d: Date = new Date()): string {
  return d.toISOString().split('T')[0];
}

function computeProgress(goal: Goal, actions: DailyAction[], completions: ActionCompletion[]): number {
  if (goal.measureType === 'qualitative') {
    if (actions.length === 0) return 0;
    const start = new Date(goal.createdAt);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    let complete = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const ds = toDateStr(d);
      const dayComps = completions.filter(c => c.date === ds && c.completed);
      if (actions.every(a => dayComps.some(c => c.actionId === a.id))) complete++;
    }
    return days > 0 ? Math.min(100, Math.round((complete / days) * 100)) : 0;
  }
  if (goal.startValue === undefined || goal.targetValue === undefined || goal.currentValue === undefined) return 0;
  if (goal.startValue === goal.targetValue) return 100;
  let pct: number;
  if (goal.measureType === 'weight' && goal.weightDirection === 'lose') {
    pct = (goal.startValue - goal.currentValue) / (goal.startValue - goal.targetValue) * 100;
  } else {
    pct = (goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue) * 100;
  }
  return Math.min(100, Math.max(0, Math.round(pct)));
}

function computeQualStreak(actions: DailyAction[], completions: ActionCompletion[]): { streak: number; best: number } {
  if (actions.length === 0) return { streak: 0, best: 0 };
  const completeDays = new Set<string>();
  const byDate = new Map<string, ActionCompletion[]>();
  for (const c of completions) {
    if (!c.completed) continue;
    const arr = byDate.get(c.date) ?? [];
    arr.push(c);
    byDate.set(c.date, arr);
  }
  for (const [date, comps] of byDate.entries()) {
    if (actions.every(a => comps.some(c => c.actionId === a.id))) completeDays.add(date);
  }

  // Count current streak
  let streak = 0;
  const d = new Date();
  while (completeDays.has(toDateStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  // Compute best streak across all time
  const sorted = Array.from(completeDays).sort();
  let best = 0, run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { run = 1; }
    else {
      const prev = new Date(sorted[i - 1]);
      prev.setDate(prev.getDate() + 1);
      run = toDateStr(prev) === sorted[i] ? run + 1 : 1;
    }
    if (run > best) best = run;
  }
  return { streak, best };
}

export function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const today = toDateStr();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [completions, setCompletions] = useState<ActionCompletion[]>([]);
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [addActionModal, setAddActionModal] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newActionTitle, setNewActionTitle] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [g, acts, comps, ents] = await Promise.all([
      getGoalById(id),
      getDailyActionsByGoal(id),
      getActionCompletionsByGoal(id),
      getGoalEntriesByGoal(id),
    ]);
    setGoal(g ?? null);
    setActions(acts);
    setCompletions(comps);
    setEntries(ents.sort((a, b) => a.date < b.date ? -1 : 1));
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="goal-detail-page"><div className="goal-detail-loading">Chargement…</div></div>;
  if (!goal) return <div className="goal-detail-page"><div className="goal-detail-loading">Objectif introuvable.</div></div>;

  const info = TYPE_INFO[goal.measureType];
  const isMeasurable = goal.measureType !== 'qualitative';
  const progress = computeProgress(goal, actions, completions);
  const isLate = !!goal.targetDate && goal.targetDate < today && progress < 100;
  const todayComps = completions.filter(c => c.date === today);

  function isCompleted(actionId: string) {
    return todayComps.some(c => c.actionId === actionId && c.completed);
  }

  async function toggleAction(action: DailyAction) {
    const was = isCompleted(action.id);
    const comp: ActionCompletion = {
      id: `${action.id}_${today}`,
      actionId: action.id,
      goalId: goal!.id,
      date: today,
      completed: !was,
    };
    await saveActionCompletion(comp);
    await syncDailyEntry(today);
    // Optimistic update
    setCompletions(prev => {
      const without = prev.filter(c => !(c.actionId === action.id && c.date === today));
      return [...without, comp];
    });
  }

  async function handleDeleteGoal() {
    await deleteGoal(goal!.id);
    navigate(-1);
  }

  async function handleUpdateValue() {
    if (!newValue) return;
    const val = Number(newValue);
    const entry: GoalEntry = {
      id: 'ge' + Date.now(),
      goalId: goal!.id,
      value: val,
      date: today,
      note: newNote || undefined,
    };
    await addGoalEntry(entry);
    const updated = { ...goal!, currentValue: val };
    await updateGoal(updated);
    setGoal(updated);
    setEntries(prev => [...prev, entry]);
    setNewValue('');
    setNewNote('');
    setUpdateModalOpen(false);
  }

  async function handleAddAction() {
    const title = newActionTitle.trim();
    if (!title) return;
    const action: DailyAction = { id: 'a' + Date.now(), goalId: goal!.id, title, createdAt: Date.now() };
    await addDailyAction(action);
    setActions(prev => [...prev, action]);
    setNewActionTitle('');
    setAddActionModal(false);
  }

  async function handleDeleteAction(actionId: string) {
    await deleteDailyAction(actionId);
    setActions(prev => prev.filter(a => a.id !== actionId));
    setCompletions(prev => prev.filter(c => c.actionId !== actionId));
  }

  // Stats
  const daysLeft = goal.targetDate
    ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000))
    : null;

  const qualStats = !isMeasurable ? computeQualStreak(actions, completions) : null;
  const completeDaysCount = !isMeasurable ? (() => {
    const byDate = new Map<string, ActionCompletion[]>();
    for (const c of completions.filter(c => c.completed)) {
      const arr = byDate.get(c.date) ?? [];
      arr.push(c);
      byDate.set(c.date, arr);
    }
    let count = 0;
    for (const [, comps] of byDate.entries()) {
      if (actions.every(a => comps.some(c => c.actionId === a.id))) count++;
    }
    return count;
  })() : 0;

  const daysSinceStart = Math.floor((Date.now() - goal.createdAt) / 86400000) + 1;

  // History dots (last 21 days for qualitative)
  const last21 = !isMeasurable ? Array.from({ length: 21 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (20 - i));
    const ds = toDateStr(d);
    const dayComps = completions.filter(c => c.date === ds && c.completed);
    const done = actions.length > 0 && actions.every(a => dayComps.some(c => c.actionId === a.id));
    const partial = dayComps.length > 0 && !done;
    return { ds, done, partial };
  }) : [];

  // History bars (last 6 entries for measurable)
  const lastEntries = isMeasurable ? entries.slice(-6) : [];
  const maxEntryVal = lastEntries.length > 0 ? Math.max(...lastEntries.map(e => e.value)) : 1;

  return (
    <div className="goal-detail-page">
      {/* Header */}
      <div className="goal-detail-header">
        <button className="goal-detail-back" onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeftIcon size={20} />
        </button>
        <div className="goal-detail-header-center">
          <h1 className="goal-detail-title">{goal.title}</h1>
          <div className="goal-detail-type-badge" style={{ background: info.color }}>{info.abbr}</div>
        </div>
        <button className="goal-detail-delete" onClick={() => setDeleteConfirm(true)} aria-label="Supprimer">
          <TrashIcon size={18} />
        </button>
      </div>

      <div className="goal-detail-body">
        {/* Hero */}
        <div className="goal-detail-hero">
          <div className="goal-hero-top">
            <span className="goal-hero-pct">{progress}%</span>
            {isLate && <span className="goal-late-badge">En retard</span>}
            {isMeasurable && (
              <button className="goal-update-btn" onClick={() => setUpdateModalOpen(true)}>Mettre à jour</button>
            )}
          </div>
          <div className="goal-hero-bar">
            <div className="goal-hero-bar-fill" style={{ width: `${progress}%`, background: info.color }} />
          </div>
          {isMeasurable && goal.currentValue !== undefined && (
            <p className="goal-hero-value">
              <strong>{goal.currentValue}{goal.unit ? ` ${goal.unit}` : ''}</strong>
              {goal.targetValue !== undefined && (
                <span> → {goal.targetValue}{goal.unit ? ` ${goal.unit}` : ''}</span>
              )}
            </p>
          )}
          {!isMeasurable && (
            <p className="goal-hero-value">{completeDaysCount} jour{completeDaysCount !== 1 ? 's' : ''} complet{completeDaysCount !== 1 ? 's' : ''} sur {daysSinceStart}</p>
          )}
          {goal.targetDate && (
            <p className="goal-hero-date">{isLate ? 'Échéance dépassée' : `Échéance : ${new Date(goal.targetDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}</p>
          )}
        </div>

        {/* Stats */}
        <div className="goal-detail-section">
          <h2 className="goal-detail-section-title">Statistiques</h2>
          <div className="goal-stats-grid">
            {isMeasurable ? (<>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Valeur actuelle</span>
                <span className="goal-stat-value">{goal.currentValue ?? goal.startValue ?? '–'}{goal.unit ? ` ${goal.unit}` : ''}</span>
              </div>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Évolution</span>
                <span className="goal-stat-value">
                  {goal.currentValue !== undefined && goal.startValue !== undefined
                    ? `${goal.currentValue - goal.startValue > 0 ? '+' : ''}${Math.round((goal.currentValue - goal.startValue) * 10) / 10}${goal.unit ? ` ${goal.unit}` : ''}`
                    : '–'}
                </span>
              </div>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Jours restants</span>
                <span className="goal-stat-value">{daysLeft !== null ? `${daysLeft} j` : '–'}</span>
              </div>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Dernière MAJ</span>
                <span className="goal-stat-value">
                  {entries.length > 0
                    ? new Date(entries[entries.length - 1].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : '–'}
                </span>
              </div>
            </>) : (<>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Série actuelle</span>
                <span className="goal-stat-value">{qualStats!.streak} j</span>
              </div>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Meilleure série</span>
                <span className="goal-stat-value">{qualStats!.best} j</span>
              </div>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Complétion</span>
                <span className="goal-stat-value">{progress}%</span>
              </div>
              <div className="goal-stat-card">
                <span className="goal-stat-label">Jours restants</span>
                <span className="goal-stat-value">{daysLeft !== null ? `${daysLeft} j` : '–'}</span>
              </div>
            </>)}
          </div>
        </div>

        {/* Today's actions */}
        <div className="goal-detail-section">
          <h2 className="goal-detail-section-title">Aujourd'hui</h2>
          {actions.length === 0 ? (
            <div className="goal-no-actions">
              <p>Aucune action quotidienne configurée.</p>
              <button className="goal-add-action-btn" onClick={() => setAddActionModal(true)}>+ Ajouter une action</button>
            </div>
          ) : (
            <>
              <div className="goal-actions-list">
                {actions.map(action => {
                  const done = isCompleted(action.id);
                  return (
                    <div key={action.id} className={`goal-action-item ${done ? 'done' : ''}`} onClick={() => toggleAction(action)}>
                      <span className="goal-action-check">{done ? <CheckCircleIcon size={20} /> : <CircleIcon size={20} />}</span>
                      <span className="goal-action-title">{action.title}</span>
                      <button
                        className="goal-action-delete"
                        onClick={e => { e.stopPropagation(); handleDeleteAction(action.id); }}
                        aria-label="Supprimer l'action"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button className="goal-add-action-btn" onClick={() => setAddActionModal(true)}>+ Ajouter une action</button>
            </>
          )}
        </div>

        {/* History */}
        {isMeasurable && lastEntries.length > 0 && (
          <div className="goal-detail-section">
            <h2 className="goal-detail-section-title">Historique</h2>
            <div className="goal-history-bars">
              {lastEntries.map(entry => (
                <div key={entry.id} className="goal-history-bar-item">
                  <div className="goal-history-bar-track">
                    <div
                      className="goal-history-bar-fill"
                      style={{
                        height: `${Math.round((entry.value / maxEntryVal) * 100)}%`,
                        background: info.color,
                      }}
                    />
                  </div>
                  <span className="goal-history-bar-val">{entry.value}</span>
                  <span className="goal-history-bar-date">
                    {new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isMeasurable && (
          <div className="goal-detail-section">
            <h2 className="goal-detail-section-title">21 derniers jours</h2>
            <div className="goal-cal-grid">
              {last21.map(({ ds, done, partial }) => (
                <div
                  key={ds}
                  className={`goal-cal-dot ${done ? 'done' : partial ? 'partial' : ''}`}
                  style={done ? { background: info.color } : {}}
                  title={ds}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Update value modal */}
      <Modal isOpen={updateModalOpen} title="Mettre à jour" onClose={() => setUpdateModalOpen(false)}>
        <div className="form-group">
          <label>Nouvelle valeur{goal.unit ? ` (${goal.unit})` : ''} *</label>
          <input
            type="number" value={newValue} onChange={e => setNewValue(e.target.value)}
            placeholder={String(goal.currentValue ?? goal.startValue ?? '')}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Note <span className="optional-label">optionnel</span></label>
          <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Ex: après le sport…" />
        </div>
        <div className="modal-actions">
          <Button onClick={handleUpdateValue} disabled={!newValue}>Enregistrer</Button>
          <Button variant="secondary" onClick={() => setUpdateModalOpen(false)}>Annuler</Button>
        </div>
      </Modal>

      {/* Add action modal */}
      <Modal isOpen={addActionModal} title="Nouvelle action" onClose={() => setAddActionModal(false)}>
        <div className="form-group">
          <label>Action quotidienne *</label>
          <input
            type="text" value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)}
            placeholder="Ex: Courir 30 min…" autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAddAction(); }}
          />
        </div>
        <div className="modal-actions">
          <Button onClick={handleAddAction} disabled={!newActionTitle.trim()}>Ajouter</Button>
          <Button variant="secondary" onClick={() => setAddActionModal(false)}>Annuler</Button>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={deleteConfirm} title="Supprimer l'objectif" onClose={() => setDeleteConfirm(false)}>
        <p style={{ color: 'var(--clr-text-secondary)', marginBottom: 16 }}>
          Cette action supprimera définitivement l'objectif, ses actions et tout son historique.
        </p>
        <div className="modal-actions">
          <Button onClick={handleDeleteGoal} style={{ background: '#EF4444' }}>Supprimer</Button>
          <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Annuler</Button>
        </div>
      </Modal>
    </div>
  );
}
