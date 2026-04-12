import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Progress } from '../../components/Progress';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import {
  getRoadmapPhases, getRoadmapItemsByPhase,
  updateRoadmapItem, addRoadmapPhase, updateRoadmapPhase, deleteRoadmapPhase,
  addRoadmapItem, deleteRoadmapItem,
} from '../../storage/db';
import { RoadmapPhase, RoadmapItem } from '../../types';
import { PencilIcon, TrashIcon } from '../../components/Icons';
import './Frise.css';

export function Frise() {
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [itemsByPhase, setItemsByPhase] = useState<Map<string, RoadmapItem[]>>(new Map());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [globalStats, setGlobalStats] = useState({ total: 0, completed: 0 });
  const [phaseStats, setPhaseStats] = useState<Map<string, { total: number; completed: number }>>(new Map());

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [phaseModal, setPhaseModal] = useState<{ open: boolean; editing?: RoadmapPhase }>({ open: false });
  const [phaseForm, setPhaseForm] = useState({ title: '', country: '', duration: '' });
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadFrise();
  }, []);

  async function loadFrise() {
    const allPhases = await getRoadmapPhases();
    allPhases.sort((a, b) => a.order - b.order);
    setPhases(allPhases);

    const byPhase = new Map<string, RoadmapItem[]>();
    let totalItems = 0;
    let completedItems = 0;
    const phaseStatsMap = new Map<string, { total: number; completed: number }>();

    for (const phase of allPhases) {
      const items = await getRoadmapItemsByPhase(phase.id);
      byPhase.set(phase.id, items);

      const phaseComplete = items.filter(i => i.completed).length;
      phaseStatsMap.set(phase.id, { total: items.length, completed: phaseComplete });

      totalItems += items.length;
      completedItems += phaseComplete;
    }

    setItemsByPhase(byPhase);
    setGlobalStats({ total: totalItems, completed: completedItems });
    setPhaseStats(phaseStatsMap);

    setExpandedPhases(prev => {
      if (prev.size === 0 && allPhases.length > 0) return new Set([allPhases[0].id]);
      return prev;
    });
  }

  async function toggleItem(itemId: string, phaseId: string) {
    const items = itemsByPhase.get(phaseId) || [];
    const item = items.find(i => i.id === itemId);
    if (item) {
      await updateRoadmapItem({ ...item, completed: !item.completed });
      loadFrise();
    }
  }

  function togglePhaseExpand(phaseId: string) {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId);
      return next;
    });
  }

  // --- Phase CRUD ---
  function openAddPhase() {
    setPhaseForm({ title: '', country: '', duration: '' });
    setPhaseModal({ open: true });
  }

  function openEditPhase(phase: RoadmapPhase, e: React.MouseEvent) {
    e.stopPropagation();
    setPhaseForm({ title: phase.title, country: phase.country, duration: phase.duration });
    setPhaseModal({ open: true, editing: phase });
  }

  async function savePhase() {
    if (!phaseForm.title.trim()) return;
    if (phaseModal.editing) {
      await updateRoadmapPhase({ ...phaseModal.editing, ...phaseForm });
    } else {
      const newPhase: RoadmapPhase = {
        id: `phase-${Date.now()}`,
        title: phaseForm.title.trim(),
        country: phaseForm.country.trim(),
        duration: phaseForm.duration.trim(),
        order: phases.length,
      };
      await addRoadmapPhase(newPhase);
    }
    setPhaseModal({ open: false });
    loadFrise();
  }

  async function handleDeletePhase(phaseId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Supprimer cette phase et tous ses items ?')) return;
    await deleteRoadmapPhase(phaseId);
    loadFrise();
  }

  // --- Item CRUD ---
  async function handleAddItem(phaseId: string) {
    const text = (newItemTexts[phaseId] || '').trim();
    if (!text) return;
    const newItem: RoadmapItem = {
      id: `item-${Date.now()}`,
      phaseId,
      title: text,
      completed: false,
    };
    await addRoadmapItem(newItem);
    setNewItemTexts(prev => ({ ...prev, [phaseId]: '' }));
    loadFrise();
  }

  async function handleDeleteItem(itemId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    await deleteRoadmapItem(itemId);
    loadFrise();
  }

  async function saveEditingItem() {
    if (!editingItem) return;
    if (!editingItem.title.trim()) { setEditingItem(null); return; }
    for (const [, items] of itemsByPhase) {
      const item = items.find(i => i.id === editingItem.id);
      if (item) {
        await updateRoadmapItem({ ...item, title: editingItem.title.trim() });
        break;
      }
    }
    setEditingItem(null);
    loadFrise();
  }

  return (
    <div className="frise-page">
      <div className="frise-header">
        <h1>Frise</h1>
        <Button
          variant={editMode ? 'danger' : 'secondary'}
          size="small"
          onClick={() => { setEditMode(m => !m); setEditingItem(null); }}
        >
          {editMode ? 'Terminer' : 'Éditer'}
        </Button>
      </div>

      <Card>
        <div className="global-stats">
          <div className="progress-label">
            Global Progress: {globalStats.completed}/{globalStats.total}
          </div>
          <Progress value={globalStats.completed} max={globalStats.total} />
        </div>
      </Card>

      <div className="phases-container">
        {phases.map(phase => {
          const isExpanded = expandedPhases.has(phase.id);
          const stats = phaseStats.get(phase.id) || { total: 0, completed: 0 };
          const items = itemsByPhase.get(phase.id) || [];

          return (
            <Card key={phase.id} className="frise-phase-card">
              <div className="frise-phase-header" onClick={() => togglePhaseExpand(phase.id)}>
                <div className="phase-info">
                  <h2>{phase.title}</h2>
                  <div className="phase-meta">
                    <span className="phase-country">{phase.country}</span>
                    <span className="phase-duration">{phase.duration}</span>
                  </div>
                </div>
                <div className="phase-progress">
                  {editMode ? (
                    <div className="phase-edit-actions">
                      <button className="icon-btn" onClick={e => openEditPhase(phase, e)} title="Modifier"><PencilIcon /></button>
                      <button className="icon-btn icon-btn--danger" onClick={e => handleDeletePhase(phase.id, e)} title="Supprimer"><TrashIcon /></button>
                    </div>
                  ) : (
                    <div className="progress-number">{stats.completed}/{stats.total}</div>
                  )}
                  <div className="expand-icon">{isExpanded ? '−' : '+'}</div>
                </div>
              </div>

              {isExpanded && (
                <div className="frise-phase-items">
                  <div className="phase-progress-bar">
                    <Progress value={stats.completed} max={stats.total} />
                  </div>
                  <div className="checklist">
                    {items.map(item => (
                      <div key={item.id} className={`frise-item ${item.completed && !editMode ? 'completed' : ''}`}>
                        {editMode && editingItem?.id === item.id ? (
                          <input
                            className="item-edit-input"
                            value={editingItem.title}
                            onChange={e => setEditingItem({ id: item.id, title: e.target.value })}
                            onBlur={saveEditingItem}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEditingItem();
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            {!editMode && (
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleItem(item.id, phase.id)}
                              />
                            )}
                            <span
                              className="item-title"
                              onClick={editMode ? e => { e.stopPropagation(); setEditingItem({ id: item.id, title: item.title }); } : undefined}
                              style={editMode ? { cursor: 'text' } : {}}
                            >
                              {item.title}
                            </span>
                            {editMode && (
                              <button className="icon-btn icon-btn--danger icon-btn--sm" onClick={e => handleDeleteItem(item.id, e)}><TrashIcon /></button>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {editMode && (
                      <div className="add-item-row">
                        <input
                          className="add-item-input"
                          placeholder="Nouvel item..."
                          value={newItemTexts[phase.id] || ''}
                          onChange={e => setNewItemTexts(prev => ({ ...prev, [phase.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddItem(phase.id); }}
                          onClick={e => e.stopPropagation()}
                        />
                        <button className="add-item-btn" onClick={() => handleAddItem(phase.id)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {editMode && (
          <button className="add-phase-btn" onClick={openAddPhase}>
            + Nouvelle phase
          </button>
        )}
      </div>

      <Modal
        isOpen={phaseModal.open}
        onClose={() => setPhaseModal({ open: false })}
        title={phaseModal.editing ? 'Modifier la phase' : 'Nouvelle phase'}
      >
        <div className="phase-form">
          <div className="form-group">
            <label>Titre</label>
            <input
              className="form-input"
              value={phaseForm.title}
              onChange={e => setPhaseForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Préparation départ"
              onKeyDown={e => { if (e.key === 'Enter') savePhase(); }}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Pays / Lieu</label>
            <input
              className="form-input"
              value={phaseForm.country}
              onChange={e => setPhaseForm(f => ({ ...f, country: e.target.value }))}
              placeholder="Ex: France"
            />
          </div>
          <div className="form-group">
            <label>Durée / Période</label>
            <input
              className="form-input"
              value={phaseForm.duration}
              onChange={e => setPhaseForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="Ex: Now → May 2026"
            />
          </div>
          <div className="phase-form-actions">
            <Button variant="secondary" onClick={() => setPhaseModal({ open: false })}>Annuler</Button>
            <Button onClick={savePhase}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
