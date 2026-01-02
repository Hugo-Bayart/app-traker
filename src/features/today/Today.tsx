import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Progress } from '../../components/Progress';
import { Button } from '../../components/Button';
import { getDailyGoals, getDailyEntry, saveDailyEntry } from '../../storage/db';
import { DailyGoal, DailyEntry } from '../../types';
import './Today.css';

function safeAddDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function Today() {
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [score, setScore] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const today = getTodayDate();

  useEffect(() => {
    loadToday();
  }, [selectedDate]);

  async function loadToday() {
    const goals = await getDailyGoals();
    setDailyGoals(goals);

    const entry = await getDailyEntry(selectedDate);
    if (entry) {
      setCompletedIds(entry.completedGoalIds);
      setNote(entry.note || '');
      setScore(entry.score);
      setIsValidated(entry.validated || false);
      setShowValidationMessage(entry.validated || false);
    } else {
      setCompletedIds([]);
      setNote('');
      setIsValidated(false);
      setShowValidationMessage(false);
      calculateScore(goals, []);
    }
  }

  function calculateScore(goals: DailyGoal[], completed: string[]) {
    const totalWeight = goals.reduce((sum, g) => sum + g.weight, 0);
    const completedWeight = goals
      .filter(g => completed.includes(g.id))
      .reduce((sum, g) => sum + g.weight, 0);
    
    const newScore = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    setScore(newScore);
    return newScore;
  }

  async function toggleGoal(goalId: string) {
    if (isValidated) return;
    
    const newCompleted = completedIds.includes(goalId)
      ? completedIds.filter(id => id !== goalId)
      : [...completedIds, goalId];
    
    setCompletedIds(newCompleted);
    const newScore = calculateScore(dailyGoals, newCompleted);

    const entry: DailyEntry = {
      id: selectedDate,
      date: selectedDate,
      completedGoalIds: newCompleted,
      score: newScore,
      note,
      validated: false,
    };

    await saveDailyEntry(entry);
  }

  async function saveNote(newNote: string) {
    if (isValidated) return;
    
    setNote(newNote);

    const entry: DailyEntry = {
      id: selectedDate,
      date: selectedDate,
      completedGoalIds: completedIds,
      score,
      note: newNote,
      validated: false,
    };

    await saveDailyEntry(entry);
  }

  async function validateDay() {
    const finalScore = calculateScore(dailyGoals, completedIds);
    
    const entry: DailyEntry = {
      id: selectedDate,
      date: selectedDate,
      completedGoalIds: completedIds,
      score: finalScore,
      note,
      validated: true,
    };

    await saveDailyEntry(entry);
    setIsValidated(true);
    setShowValidationMessage(true);
    
    setTimeout(() => {
      const nextDate = safeAddDays(selectedDate, 1);
      setSelectedDate(nextDate);
      setShowValidationMessage(false);
    }, 1500);
  }

  function goToToday() {
    setSelectedDate(getTodayDate());
  }

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
  }

  return (
    <div className="today-page">
      <div className="today-header">
        <h1>✓ Aujourd'hui</h1>
        <div className="score-badge">{score}</div>
      </div>

      <div className="date-navigation">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="date-picker"
        />
        {selectedDate !== today && (
          <Button size="small" onClick={goToToday}>
            📅 Aujourd'hui
          </Button>
        )}
      </div>

      {selectedDate !== today && (
        <div className="date-indicator">
          Consultation du {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      )}

      <Card>
        <Progress value={score} />
        <p className="score-text">Score: {score}/100</p>
      </Card>

      <Card>
        <h2>Objectifs du jour</h2>
        <div className="checklist">
          {dailyGoals.map(goal => (
            <label key={goal.id} className={`checklist-item ${isValidated ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                checked={completedIds.includes(goal.id)}
                onChange={() => toggleGoal(goal.id)}
                disabled={isValidated}
              />
              <span className="checklist-title">{goal.title}</span>
              <span className={`checklist-pillar pillar-${goal.pillar.toLowerCase()}`}>{goal.pillar}</span>
              <span className="checklist-weight">{goal.weight}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2>Note du jour</h2>
        <textarea
          className="note-input"
          value={note}
          onChange={e => saveNote(e.target.value)}
          placeholder="Ajouter une note..."
          rows={4}
          disabled={isValidated}
        />
      </Card>

      {showValidationMessage && (
        <div className="validation-message">
          <span className="validation-icon">✅</span>
          <span className="validation-text">Journée validée – Score {score}/100</span>
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
