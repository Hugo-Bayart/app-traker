import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Goal, DailyAction, ActionCompletion, MeasureType } from '../../types';
import {
  getGoals,
  getAllDailyActions,
  getActionCompletionsInRange,
} from '../../storage/db';
import { GoalCreateModal } from './GoalCreateModal';
import './Goals.css';

const USER_NAME_KEY = 'goal-tracker-username';

const TYPE_INFO: Record<MeasureType, { abbr: string; color: string }> = {
  weight:      { abbr: 'KG', color: '#3B82F6' },
  savings:     { abbr: '€',  color: '#10B981' },
  distance:    { abbr: 'KM', color: '#F59E0B' },
  time:        { abbr: 'H',  color: '#8B5CF6' },
  count:       { abbr: '#',  color: '#6B7280' },
  custom:      { abbr: '~',  color: '#14B8A6' },
  qualitative: { abbr: 'OK', color: '#EF4444' },
};

function getAccentVar(pct: number): string {
  if (pct >= 66) return 'var(--clr-accent1)';
  if (pct >= 33) return 'var(--clr-accent2)';
  return 'var(--clr-accent3)';
}

function toDateStr(d: Date = new Date()): string {
  return d.toISOString().split('T')[0];
}

function computeGoalProgress(goal: Goal, actions: DailyAction[], completions: ActionCompletion[]): number {
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allActions, setAllActions] = useState<DailyAction[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<ActionCompletion[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const [streak, setStreak] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const rangeStart = toDateStr(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
    const rangeEnd = toDateStr();
    const [fetchedGoals, fetchedActions, completions] = await Promise.all([
      getGoals(),
      getAllDailyActions(),
      getActionCompletionsInRange(rangeStart, rangeEnd),
    ]);
    setGoals(fetchedGoals);
    setAllActions(fetchedActions);
    setRecentCompletions(completions);

    // Streak: consecutive days with at least 1 completed action from today backwards
    const daysWithActivity = new Set(completions.filter(c => c.completed).map(c => c.date));
    let s = 0;
    const d = new Date();
    while (daysWithActivity.has(toDateStr(d))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    setStreak(s);

    // Progress per goal
    const prog = new Map<string, number>();
    for (const goal of fetchedGoals) {
      const actions = fetchedActions.filter(a => a.goalId === goal.id);
      const comps = completions.filter(c => c.goalId === goal.id);
      prog.set(goal.id, computeGoalProgress(goal, actions, comps));
    }
    setProgressMap(prog);
  }

  function todayDone(goalId: string): number {
    const today = toDateStr();
    return recentCompletions.filter(c => c.goalId === goalId && c.date === today && c.completed).length;
  }

  function todayTotal(goalId: string): number {
    return allActions.filter(a => a.goalId === goalId).length;
  }

  const greeting = userName ? `Bonjour, ${userName}` : 'Bonjour';
  const initials = userName ? userName.slice(0, 2).toUpperCase() : '?';
  const today = toDateStr();

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
        {goals.length === 0 && (
          <div className="goals-empty">
            <p>Aucun objectif pour l'instant.</p>
            <p>Appuie sur + pour commencer !</p>
          </div>
        )}
        {goals.map(goal => {
          const pct = progressMap.get(goal.id) ?? 0;
          const accent = getAccentVar(pct);
          const info = TYPE_INFO[goal.measureType];
          const done = todayDone(goal.id);
          const total = todayTotal(goal.id);
          const isLate = !!goal.targetDate && goal.targetDate < today && pct < 100;
          const allDoneToday = total > 0 && done === total;

          return (
            <div
              key={goal.id}
              className="goal-card"
              style={{ borderLeftColor: accent }}
              onClick={() => navigate(`/goals/${goal.id}`)}
            >
              <div className="goal-card-main">
                <div className="goal-card-info">
                  <div className="goal-card-head-row">
                    <span className="goal-card-title">{goal.title}</span>
                    <div
                      className="goal-type-badge"
                      style={{ background: info.color }}
                    >{info.abbr}</div>
                  </div>
                  {total > 0 && (
                    <span className={`goal-today-actions ${allDoneToday ? 'goal-today-all-done' : ''}`}>
                      {allDoneToday ? '✓ Toutes les actions faites' : `${done}/${total} actions aujourd'hui`}
                    </span>
                  )}
                  {isLate && <span className="goal-late-badge">En retard</span>}
                  <div className="goal-card-bar">
                    <div className="goal-card-bar-fill" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                </div>
                <div className="goal-card-right">
                  <span className="goal-card-pct" style={{ color: accent }}>{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FAB ── */}
      <button className="goals-fab" onClick={() => setIsCreateOpen(true)} aria-label="Nouvel objectif">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="26" height="26">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <GoalCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => { setIsCreateOpen(false); loadData(); }}
      />
    </div>
  );
}

