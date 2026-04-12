import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/Button';
import {
  getGoals,
  getDailyActionsByGoal,
  getActionCompletionsForDate,
  saveActionCompletion,
  syncDailyEntry,
  getDailyEntry,
  saveDailyEntry,
} from '../../storage/db';
import { Goal, DailyAction, ActionCompletion } from '../../types';
import { CheckCircleIcon, CircleIcon } from '../../components/Icons';
import './Today.css';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function safeAddDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

interface GoalGroup {
  goal: Goal;
  actions: DailyAction[];
}

export function Today() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [groups, setGroups] = useState<GoalGroup[]>([]);
  const [completions, setCompletions] = useState<ActionCompletion[]>([]);
  const [score, setScore] = useState(0);
  const [note, setNote] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [showValidated, setShowValidated] = useState(false);

  const today = getTodayDate();

  const load = useCallback(async () => {
    const goals = await getGoals();
    const gs: GoalGroup[] = [];
    for (const goal of goals) {
      const actions = await getDailyActionsByGoal(goal.id);
      if (actions.length > 0) gs.push({ goal, actions });
    }
    setGroups(gs);

    const comps = await getActionCompletionsForDate(selectedDate);
    setCompletions(comps);

    const entry = await getDailyEntry(selectedDate);
    setScore(entry?.score ?? 0);
    setNote(entry?.note ?? '');
    setIsValidated(entry?.validated ?? false);
    setShowValidated(entry?.validated ?? false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  function isCompleted(actionId: string): boolean {
    return completions.some(c => c.actionId === actionId && c.completed);
  }

  async function toggleAction(action: DailyAction, goalId: string) {
    if (isValidated) return;
    const was = isCompleted(action.id);
    const comp: ActionCompletion = {
      id: `${action.id}_${selectedDate}`,
      actionId: action.id,
      goalId,
      date: selectedDate,
      completed: !was,
    };
    await saveActionCompletion(comp);
    await syncDailyEntry(selectedDate);
    setCompletions(prev => {
      const without = prev.filter(c => !(c.actionId === action.id && c.date === selectedDate));
      return [...without, comp];
    });
    const entry = await getDailyEntry(selectedDate);
    setScore(entry?.score ?? 0);
  }

  async function handleNoteChange(value: string) {
    if (isValidated) return;
    setNote(value);
    // debounce-free: save immediately
    const entry = await getDailyEntry(selectedDate);
    await saveDailyEntry({
      id: entry?.id ?? selectedDate,
      date: selectedDate,
      completedGoalIds: entry?.completedGoalIds ?? [],
      score: entry?.score ?? 0,
      note: value,
      validated: entry?.validated ?? false,
    });
  }

  async function validateDay() {
    const entry = await getDailyEntry(selectedDate);
    await saveDailyEntry({
      id: entry?.id ?? selectedDate,
      date: selectedDate,
      completedGoalIds: entry?.completedGoalIds ?? [],
      score: entry?.score ?? 0,
      note: entry?.note ?? note,
      validated: true,
    });
    setIsValidated(true);
    setShowValidated(true);
    setTimeout(() => {
      setSelectedDate(safeAddDays(selectedDate, 1));
      setShowValidated(false);
    }, 1500);
  }

  const totalActions = groups.reduce((s, g) => s + g.actions.length, 0);
  const completedCount = completions.filter(c => c.completed).length;

  return (
    <div className="today-page">
      <div className="today-header">
        <h1>Aujourd'hui</h1>
        <div className="score-badge">{score}</div>
      </div>

      <div className="date-navigation">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="date-picker"
        />
        {selectedDate !== today && (
          <Button size="small" onClick={() => setSelectedDate(today)}>Aujourd'hui</Button>
        )}
      </div>

      {selectedDate !== today && (
        <div className="date-indicator">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      )}

      {/* Score bar */}
      <div className="today-score-section">
        <div className="today-score-bar">
          <div className="today-score-bar-fill" style={{ width: `${score}%` }} />
        </div>
        <span className="today-score-text">{completedCount}/{totalActions} actions · {score}%</span>
      </div>

      {/* Action groups */}
      {groups.length === 0 ? (
        <div className="today-empty">
          <p>Aucune action configurée.</p>
          <p>Crée un objectif avec des actions depuis la page <strong>Objectifs</strong>.</p>
        </div>
      ) : (
        <div className="today-groups">
          {groups.map(({ goal, actions }) => {
            const doneCount = actions.filter(a => isCompleted(a.id)).length;
            const allDone = doneCount === actions.length;
            return (
              <div key={goal.id} className={`today-group ${allDone ? 'today-group--done' : ''}`}>
                <div className="today-group-header">
                  <span className="today-group-title">{goal.title}</span>
                  <span className="today-group-count">{doneCount}/{actions.length}</span>
                </div>
                <div className="today-checklist">
                  {actions.map(action => {
                    const done = isCompleted(action.id);
                    return (
                      <div
                        key={action.id}
                        className={`today-checklist-item ${done ? 'done' : ''} ${isValidated ? 'disabled' : ''}`}
                        onClick={() => !isValidated && toggleAction(action, goal.id)}
                      >
                        <span className="today-check-icon">
                          {done ? <CheckCircleIcon size={20} /> : <CircleIcon size={20} />}
                        </span>
                        <span className="today-action-title">{action.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <div className="today-note-section">
        <label className="today-note-label">Note du jour</label>
        <textarea
          className="today-note-input"
          value={note}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder="Ajouter une note…"
          rows={3}
          disabled={isValidated}
        />
      </div>

      {showValidated && (
        <div className="validation-message">
          <span className="validation-icon"><CheckCircleIcon size={24} /></span>
          <span className="validation-text">Journée validée – {score}%</span>
        </div>
      )}

      {!isValidated && (
        <button className="validate-button" onClick={validateDay}>
          Valider la journée
        </button>
      )}
    </div>
  );
}

