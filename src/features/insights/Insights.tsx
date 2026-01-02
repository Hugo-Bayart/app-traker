import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { getDailyEntriesInRange, getDailyGoals } from '../../storage/db';
import { DailyEntry, DailyGoal } from '../../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './Insights.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type Period = 7 | 30 | 90;

export function Insights() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [period, setPeriod] = useState<Period>(7);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const data = await getDailyEntriesInRange(startDate, endDate);
    const validatedData = data.filter(e => e.validated === true);
    setEntries(validatedData);

    const goals = await getDailyGoals();
    setDailyGoals(goals);
  }

  const dates: string[] = [];
  const scores: number[] = [];
  
  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dates.push(date);
    const entry = entries.find(e => e.date === date && e.validated === true);
    scores.push(entry?.score || 0);
  }

  const chartData = {
    labels: dates.map(d => {
      const [y, m, day] = d.split('-');
      return `${day}/${m}`;
    }),
    datasets: [
      {
        label: 'Score',
        data: scores,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
      },
    },
  };

  const validatedEntries = entries.filter(e => e.validated === true);
  
  const avg7 = validatedEntries.length > 0 
    ? Math.round(validatedEntries.slice(-7).reduce((sum, e) => sum + e.score, 0) / Math.min(7, validatedEntries.length))
    : 0;

  const bestDay = validatedEntries.length > 0 
    ? validatedEntries.reduce((best, e) => e.score > best.score ? e : best, validatedEntries[0])
    : null;

  const streak = calculateStreak(validatedEntries);

  function calculateStreak(entries: DailyEntry[]): number {
    const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const entry = sortedEntries.find(e => e.date === expectedDate);
      
      if (!entry || entry.score < 70) break;
      count++;
    }
    
    return count;
  }

  function openDayDetail(date: string) {
    setSelectedDate(date);
  }

  const selectedEntry = selectedDate ? entries.find(e => e.date === selectedDate) : null;

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h1>📊 Suivi</h1>
        <button className="help-button" onClick={() => setShowHelp(true)}>ℹ️</button>
      </div>

      <Card>
        <div className="period-selector">
          <Button variant={period === 7 ? 'primary' : 'secondary'} size="small" onClick={() => setPeriod(7)}>7j</Button>
          <Button variant={period === 30 ? 'primary' : 'secondary'} size="small" onClick={() => setPeriod(30)}>30j</Button>
          <Button variant={period === 90 ? 'primary' : 'secondary'} size="small" onClick={() => setPeriod(90)}>90j</Button>
        </div>
        
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-label">Moyenne 7j</div>
          <div className="stat-value">{avg7}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Meilleur jour</div>
          <div className="stat-value">{bestDay?.score || 0}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Série ≥70</div>
          <div className="stat-value">{streak}</div>
        </Card>
      </div>

      <Card>
        <h2>Calendrier</h2>
        <div className="calendar-grid">
          {dates.map(date => {
            const entry = entries.find(e => e.date === date && e.validated === true);
            const score = entry?.score || 0;
            return (
              <button
                key={date}
                className={`calendar-day ${score >= 70 ? 'good' : score >= 40 ? 'medium' : 'low'}`}
                onClick={() => openDayDetail(date)}
              >
                <div className="calendar-day-date">{date.split('-')[2]}</div>
                <div className="calendar-day-score">{score}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} title={`Détail du ${selectedDate}`}>
        {selectedEntry && (
          <div className="day-detail">
            <div className="day-detail-score">Score: {selectedEntry.score}/100</div>
            
            <h3>Objectifs complétés</h3>
            <ul className="day-detail-goals">
              {dailyGoals.map(goal => (
                <li key={goal.id} className={selectedEntry.completedGoalIds.includes(goal.id) ? 'completed' : 'incomplete'}>
                  {selectedEntry.completedGoalIds.includes(goal.id) ? '✓' : '○'} {goal.title}
                </li>
              ))}
            </ul>

            {selectedEntry.note && (
              <>
                <h3>Note</h3>
                <p className="day-detail-note">{selectedEntry.note}</p>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Installer sur iPhone">
        <div className="help-content">
          <p>Pour installer cette app sur votre iPhone:</p>
          <ol>
            <li>Ouvrez cette page dans Safari</li>
            <li>Appuyez sur le bouton Partager</li>
            <li>Sélectionnez "Sur l'écran d'accueil"</li>
            <li>Confirmez</li>
          </ol>
          <p>L'app fonctionnera ensuite complètement hors ligne.</p>
        </div>
      </Modal>
    </div>
  );
}
