import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import {
  getFinalGoals, addFinalGoal, updateFinalGoal, deleteFinalGoal,
  getDailyGoalsByFinalGoal, addDailyGoal, updateDailyGoal, deleteDailyGoal,
  getDailyEntriesInRange,
} from '../../storage/db';
import { FinalGoal, DailyGoal, Pillar, DailyEntry } from '../../types';
import { PencilIcon, TrashIcon } from '../../components/Icons';
import './Goals.css';

const USER_NAME_KEY = 'goal-tracker-username';

function getAccentVar(pct: number): string {
  if (pct >= 66) return 'var(--clr-accent1)';
  if (pct >= 33) return 'var(--clr-accent2)';
  return 'var(--clr-accent3)';
}

function computeStreak(entries: DailyEntry[]): number {
  const validated = new Set(entries.filter(e => e.validated).map(e => e.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (!validated.has(dateStr)) break;
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="rgba(255,255,255,0.85)">
      <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
    </svg>
  );
}

export function Goals() {
  const navigate = useNavigate();
  const [userName] = useState(() => localStorage.getItem(USER_NAME_KEY) || '');
  const [finalGoals, setFinalGoals] = useState<FinalGoal[]>([]);
  const [dailyGoalsByFinal, setDailyGoalsByFinal] = useState<Map<string, DailyGoal[]>>(new Map());
  const [goalProgress, setGoalProgress] = useState<Map<string, number>>(new Map());
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinalGoal | null>(null);
  const [editingDailyGoal, setEditingDailyGoal] = useState<DailyGoal | null>(null);
  const [selectedFinalGoal, setSelectedFinalGoal] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newDailyGoalTitle, setNewDailyGoalTitle] = useState('');
  const [newDailyGoalPillar, setNewDailyGoalPillar] = useState<Pillar>('Business');
  const [newDailyGoalWeight, setNewDailyGoalWeight] = useState(3);

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    const finals = await getFinalGoals();
    setFinalGoals(finals);

    const byFinal = new Map<string, DailyGoal[]>();
    for (const fg of finals) {
      byFinal.set(fg.id, await getDailyGoalsByFinalGoal(fg.id));
    }
    setDailyGoalsByFinal(byFinal);

    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const entries = await getDailyEntriesInRange(start, end);
    setStreak(computeStreak(entries));

    const validated = entries.filter(e => e.validated);
    const prog = new Map<string, number>();
    for (const fg of finals) {
      const dgs = byFinal.get(fg.id) ?? [];
      if (!dgs.length || !validated.length) { prog.set(fg.id, 0); continue; }
      let possible = 0, earned = 0;
      for (const e of validated) {
        for (const dg of dgs) {
          possible += dg.weight;
          if (e.completedGoalIds.includes(dg.id)) earned += dg.weight;
        }
      }
      prog.set(fg.id, possible > 0 ? Math.round((earned / possible) * 100) : 0);
    }
    setGoalProgress(prog);
  }

  function openAddFinalGoal() {
    setEditingGoal(null);
    setNewGoalTitle('');
    setIsModalOpen(true);
  }

  function openEditFinalGoal(goal: FinalGoal) {
    setEditingGoal(goal);
    setNewGoalTitle(goal.title);
    setIsModalOpen(true);
  }

  async function saveFinalGoal() {
    if (!newGoalTitle.trim()) return;
    if (editingGoal) {
      await updateFinalGoal({ ...editingGoal, title: newGoalTitle });
    } else {
      await addFinalGoal({
        id: 'f' + Date.now(),
        title: newGoalTitle,
        createdAt: Date.now(),
      });
    }

    setIsModalOpen(false);
    loadGoals();
  }

  async function removeFinalGoal(id: string) {
    if (confirm('Supprimer cet objectif final et tous ses objectifs journaliers ?')) {
      await deleteFinalGoal(id);
      loadGoals();
    }
  }

  function openAddDailyGoal(finalGoalId: string) {
    setSelectedFinalGoal(finalGoalId);
    setEditingDailyGoal(null);
    setNewDailyGoalTitle('');
    setNewDailyGoalPillar('Business');
    setNewDailyGoalWeight(3);
    setIsDailyModalOpen(true);
  }

  function openEditDailyGoal(goal: DailyGoal) {
    setSelectedFinalGoal(goal.finalGoalId);
    setEditingDailyGoal(goal);
    setNewDailyGoalTitle(goal.title);
    setNewDailyGoalPillar(goal.pillar);
    setNewDailyGoalWeight(goal.weight);
    setIsDailyModalOpen(true);
  }

  async function saveDailyGoal() {
    if (!newDailyGoalTitle.trim() || !selectedFinalGoal) return;

    if (editingDailyGoal) {
      await updateDailyGoal({
        ...editingDailyGoal,
        title: newDailyGoalTitle,
        pillar: newDailyGoalPillar,
        weight: newDailyGoalWeight,
      });
    } else {
      await addDailyGoal({
        id: 'd' + Date.now(),
        title: newDailyGoalTitle,
        pillar: newDailyGoalPillar,
        weight: newDailyGoalWeight,
        finalGoalId: selectedFinalGoal,
      });
    }

    setIsDailyModalOpen(false);
    loadGoals();
  }

  async function removeDailyGoal(id: string) {
    if (confirm('Supprimer cet objectif journalier ?')) {
      await deleteDailyGoal(id);
      loadGoals();
    }
  }

  const greeting = userName ? `Bonjour, ${userName} 👋` : 'Bonjour 👋';
  const initials = userName ? userName.slice(0, 2).toUpperCase() : '?';

  return (
    <div className="goals-page">

      {/* ── Header ── */}
      <div className="goals-header">
        <div className="goals-header-left">
          <span className="goals-greeting">{greeting}</span>
          <h1 className="goals-title">Mes objectifs</h1>
        </div>
        <div className="goals-header-right">
          <button className="goals-settings-btn" onClick={() => navigate('/settings')} aria-label="Réglages">
            <GearIcon />
          </button>
          <div className="goals-avatar">{initials}</div>
        </div>
      </div>

      {/* ── Streak pill ── */}
      {streak > 0 && (
        <div className="streak-pill">
          <span className="streak-number">{streak}</span>
          <div className="streak-text">
            <span className="streak-title">Jours consécutifs</span>
            <span className="streak-sub">Garde le rythme !</span>
          </div>
          <FlameIcon />
        </div>
      )}

      {/* ── Goal cards ── */}
      <div className="goals-list">
        {finalGoals.length === 0 && (
          <div className="goals-empty">
            <p>Aucun objectif pour l'instant.</p>
            <p>Appuie sur + pour commencer !</p>
          </div>
        )}
        {finalGoals.map(fg => {
          const pct = goalProgress.get(fg.id) ?? 0;
          const accent = getAccentVar(pct);
          const dgs = dailyGoalsByFinal.get(fg.id) ?? [];
          const isExpanded = expandedGoalId === fg.id;
          return (
            <div
              key={fg.id}
              className="goal-card"
              style={{ borderLeftColor: accent }}
              onClick={() => setExpandedGoalId(isExpanded ? null : fg.id)}
            >
              <div className="goal-card-main">
                <div className="goal-card-info">
                  <span className="goal-card-title">{fg.title}</span>
                  <span className="goal-card-meta">
                    {dgs.length} obj. journalier{dgs.length !== 1 ? 's' : ''} · 30 derniers jours
                  </span>
                  <div className="goal-card-bar">
                    <div className="goal-card-bar-fill" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                </div>
                <div className="goal-card-right">
                  <span className="goal-card-pct" style={{ color: accent }}>{pct}%</span>
                  <div className="goal-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="goal-icon-btn" onClick={() => openEditFinalGoal(fg)} title="Modifier"><PencilIcon /></button>
                    <button className="goal-icon-btn" onClick={() => removeFinalGoal(fg.id)} title="Supprimer"><TrashIcon /></button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="goal-expanded" onClick={e => e.stopPropagation()}>
                  <div className="daily-header">
                    <span className="daily-header-label">Objectifs journaliers</span>
                    <Button size="small" onClick={() => openAddDailyGoal(fg.id)}>+ Ajouter</Button>
                  </div>
                  {dgs.length === 0 ? (
                    <p className="empty-state">Aucun objectif journalier</p>
                  ) : (
                    <div className="daily-list">
                      {dgs.map(dg => (
                        <div key={dg.id} className="daily-item">
                          <div className="daily-item-info">
                            <span className="daily-item-title">{dg.title}</span>
                            <span className={`daily-goal-pillar pillar-${dg.pillar.toLowerCase()}`}>{dg.pillar}</span>
                            <span className="daily-item-weight">×{dg.weight}</span>
                          </div>
                          <div className="daily-item-actions">
                            <button className="goal-icon-btn" onClick={() => openEditDailyGoal(dg)}><PencilIcon /></button>
                            <button className="goal-icon-btn" onClick={() => removeDailyGoal(dg.id)}><TrashIcon /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FAB ── */}
      <button className="goals-fab" onClick={openAddFinalGoal} aria-label="Nouvel objectif">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="26" height="26">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ── Modals ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}>
        <div className="form-group">
          <label>Titre</label>
          <input
            type="text"
            value={newGoalTitle}
            onChange={e => setNewGoalTitle(e.target.value)}
            placeholder="Ex: 100k CA"
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <Button onClick={saveFinalGoal}>Enregistrer</Button>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
        </div>
      </Modal>

      <Modal isOpen={isDailyModalOpen} onClose={() => setIsDailyModalOpen(false)} title={editingDailyGoal ? 'Modifier' : 'Nouvel objectif journalier'}>
        <div className="form-group">
          <label>Titre</label>
          <input
            type="text"
            value={newDailyGoalTitle}
            onChange={e => setNewDailyGoalTitle(e.target.value)}
            placeholder="Ex: 1 action business"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Pilier</label>
          <select value={newDailyGoalPillar} onChange={e => setNewDailyGoalPillar(e.target.value as Pillar)}>
            <option value="Business">Business</option>
            <option value="Structure">Structure</option>
            <option value="Corps">Corps</option>
            <option value="Vision">Vision</option>
          </select>
        </div>
        <div className="form-group">
          <label>Poids (1–5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={newDailyGoalWeight}
            onChange={e => setNewDailyGoalWeight(Number(e.target.value))}
          />
        </div>
        <div className="modal-actions">
          <Button onClick={saveDailyGoal}>Enregistrer</Button>
          <Button variant="secondary" onClick={() => setIsDailyModalOpen(false)}>Annuler</Button>
        </div>
      </Modal>
    </div>
  );
}
