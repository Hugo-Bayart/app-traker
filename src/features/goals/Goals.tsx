import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { getFinalGoals, addFinalGoal, updateFinalGoal, deleteFinalGoal, getDailyGoalsByFinalGoal, addDailyGoal, updateDailyGoal, deleteDailyGoal } from '../../storage/db';
import { FinalGoal, DailyGoal, Pillar } from '../../types';
import './Goals.css';

export function Goals() {
  const [finalGoals, setFinalGoals] = useState<FinalGoal[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinalGoal | null>(null);
  const [editingDailyGoal, setEditingDailyGoal] = useState<DailyGoal | null>(null);
  const [selectedFinalGoal, setSelectedFinalGoal] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newDailyGoalTitle, setNewDailyGoalTitle] = useState('');
  const [newDailyGoalPillar, setNewDailyGoalPillar] = useState<Pillar>('Business');
  const [newDailyGoalWeight, setNewDailyGoalWeight] = useState(3);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    const finals = await getFinalGoals();
    setFinalGoals(finals);
    
    const allDailyGoals: DailyGoal[] = [];
    for (const fg of finals) {
      const dg = await getDailyGoalsByFinalGoal(fg.id);
      allDailyGoals.push(...dg);
    }
    setDailyGoals(allDailyGoals);
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

  return (
    <div className="goals-page">
      <div className="goals-header">
        <h1>🎯 Objectifs</h1>
        <Button onClick={openAddFinalGoal}>+ Objectif final</Button>
      </div>

      {finalGoals.map(fg => {
        const relatedDailyGoals = dailyGoals.filter(dg => dg.finalGoalId === fg.id);
        return (
          <Card key={fg.id} className="final-goal-card">
            <div className="final-goal-header">
              <h2>{fg.title}</h2>
              <div className="final-goal-actions">
                <button onClick={() => openEditFinalGoal(fg)}>✏️</button>
                <button onClick={() => removeFinalGoal(fg.id)}>🗑️</button>
              </div>
            </div>
            
            <div className="daily-goals-section">
              <div className="daily-goals-header">
                <h3>Objectifs journaliers</h3>
                <Button size="small" onClick={() => openAddDailyGoal(fg.id)}>+ Ajouter</Button>
              </div>
              
              {relatedDailyGoals.length === 0 ? (
                <p className="empty-state">Aucun objectif journalier</p>
              ) : (
                <div className="daily-goals-list">
                  {relatedDailyGoals.map(dg => (
                    <div key={dg.id} className="daily-goal-item">
                      <div className="daily-goal-info">
                        <span className="daily-goal-title">{dg.title}</span>
                        <span className={`daily-goal-pillar pillar-${dg.pillar.toLowerCase()}`}>{dg.pillar}</span>
                        <span className="daily-goal-weight">Poids: {dg.weight}</span>
                      </div>
                      <div className="daily-goal-actions">
                        <button onClick={() => openEditDailyGoal(dg)}>✏️</button>
                        <button onClick={() => removeDailyGoal(dg.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGoal ? 'Modifier' : 'Nouvel objectif final'}>
        <div className="form-group">
          <label>Titre</label>
          <input
            type="text"
            value={newGoalTitle}
            onChange={e => setNewGoalTitle(e.target.value)}
            placeholder="Ex: 100k CA"
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
          <label>Poids (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={newDailyGoalWeight}
            onChange={e => setNewDailyGoalWeight(parseInt(e.target.value))}
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
