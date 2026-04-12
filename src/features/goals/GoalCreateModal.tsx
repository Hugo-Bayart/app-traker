import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Goal, DailyAction, MeasureType } from '../../types';
import { addGoal, addDailyAction } from '../../storage/db';
import { TrashIcon } from '../../components/Icons';
import './GoalCreateModal.css';

const TYPE_OPTIONS: Array<{
  type: MeasureType;
  label: string;
  abbr: string;
  example: string;
  defaultUnit: string;
  color: string;
}> = [
  { type: 'weight',      label: 'Poids',         abbr: 'KG',  example: '90kg → 75kg',   defaultUnit: 'kg', color: '#3B82F6' },
  { type: 'savings',     label: 'Économies',      abbr: '€',   example: '0 → 5 000€',    defaultUnit: '€',  color: '#10B981' },
  { type: 'distance',    label: 'Distance',       abbr: 'KM',  example: '0 → 500km',     defaultUnit: 'km', color: '#F59E0B' },
  { type: 'time',        label: 'Temps',          abbr: 'H',   example: '0 → 100h',      defaultUnit: 'h',  color: '#8B5CF6' },
  { type: 'count',       label: 'Comptage',       abbr: '#',   example: '0 → 50 unités', defaultUnit: '',   color: '#6B7280' },
  { type: 'custom',      label: 'Personnalisé',   abbr: '~',   example: 'Unité libre',   defaultUnit: '',   color: '#14B8A6' },
  { type: 'qualitative', label: 'Qualitatif',     abbr: 'OK',  example: 'Régularité',    defaultUnit: '',   color: '#EF4444' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function GoalCreateModal({ isOpen, onClose, onSaved }: Props) {
  const [step, setStep] = useState(1);

  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Step 2
  const [measureType, setMeasureType] = useState<MeasureType | null>(null);
  const [startValue, setStartValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [weightDirection, setWeightDirection] = useState<'lose' | 'gain'>('lose');

  // Step 3
  const [actions, setActions] = useState<string[]>([]);
  const [newActionText, setNewActionText] = useState('');

  function reset() {
    setStep(1);
    setTitle(''); setDescription(''); setTargetDate('');
    setMeasureType(null); setStartValue(''); setTargetValue(''); setUnit(''); setWeightDirection('lose');
    setActions([]); setNewActionText('');
  }

  function handleClose() { reset(); onClose(); }

  function handleSelectType(type: MeasureType) {
    setMeasureType(type);
    const opt = TYPE_OPTIONS.find(o => o.type === type);
    if (opt && !unit) setUnit(opt.defaultUnit);
  }

  function addAction() {
    const text = newActionText.trim();
    if (!text) return;
    setActions(prev => [...prev, text]);
    setNewActionText('');
  }

  async function handleSave() {
    if (!measureType || !title.trim()) return;
    const goalId = 'g' + Date.now();
    const goal: Goal = {
      id: goalId,
      title: title.trim(),
      description: description.trim() || undefined,
      createdAt: Date.now(),
      targetDate: targetDate || undefined,
      measureType,
      unit: unit || undefined,
      startValue:    startValue !== '' ? Number(startValue) : undefined,
      currentValue:  startValue !== '' ? Number(startValue) : undefined,
      targetValue:   targetValue !== '' ? Number(targetValue) : undefined,
      weightDirection: measureType === 'weight' ? weightDirection : undefined,
    };
    await addGoal(goal);
    for (let i = 0; i < actions.length; i++) {
      const action: DailyAction = {
        id: 'a' + Date.now() + i,
        goalId,
        title: actions[i],
        createdAt: Date.now(),
      };
      await addDailyAction(action);
    }
    reset();
    onSaved();
  }

  const stepTitles = ['Nouvel objectif', 'Type de mesure', 'Actions quotidiennes'];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={stepTitles[step - 1]}>
      {/* Step dots */}
      <div className="create-steps">
        {[1, 2, 3].map(s => (
          <div key={s} className={`create-step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`} />
        ))}
      </div>

      {/* ── Step 1: Basic info ── */}
      {step === 1 && (
        <div className="create-step-content">
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Perdre du poids, Économiser..."
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && title.trim()) setStep(2); }}
            />
          </div>
          <div className="form-group">
            <label>Description <span className="optional-label">optionnel</span></label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Pourquoi cet objectif ?" rows={2}
            />
          </div>
          <div className="form-group">
            <label>Date limite <span className="optional-label">optionnel</span></label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div className="modal-actions">
            <Button onClick={() => setStep(2)} disabled={!title.trim()}>Suivant →</Button>
            <Button variant="secondary" onClick={handleClose}>Annuler</Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Measure type ── */}
      {step === 2 && (
        <div className="create-step-content">
          <div className="measure-grid">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                className={`measure-card ${measureType === opt.type ? 'measure-card--active' : ''}`}
                style={measureType === opt.type ? { borderColor: opt.color } : {}}
                onClick={() => handleSelectType(opt.type)}
              >
                <div className="measure-badge" style={{ background: opt.color }}>{opt.abbr}</div>
                <span className="measure-card-label">{opt.label}</span>
                <span className="measure-card-example">{opt.example}</span>
              </button>
            ))}
          </div>

          {measureType && measureType !== 'qualitative' && (
            <div className="measure-values">
              <div className="measure-values-row">
                <div className="form-group">
                  <label>Départ</label>
                  <input type="number" value={startValue} onChange={e => setStartValue(e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Objectif</label>
                  <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="100" />
                </div>
                <div className="form-group form-group--narrow">
                  <label>Unité</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg" />
                </div>
              </div>
              {measureType === 'weight' && (
                <div className="weight-direction">
                  <button className={`direction-btn ${weightDirection === 'lose' ? 'active' : ''}`} onClick={() => setWeightDirection('lose')}>Perdre</button>
                  <button className={`direction-btn ${weightDirection === 'gain' ? 'active' : ''}`} onClick={() => setWeightDirection('gain')}>Prendre</button>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <Button onClick={() => setStep(3)} disabled={!measureType}>Suivant →</Button>
            <Button variant="secondary" onClick={() => setStep(1)}>← Retour</Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Daily actions ── */}
      {step === 3 && (
        <div className="create-step-content">
          <p className="actions-hint">Ajoute les habitudes quotidiennes pour avancer vers cet objectif. C'est optionnel.</p>
          <div className="actions-list">
            {actions.length === 0 && <p className="actions-empty">Aucune action — tu pourras en ajouter plus tard.</p>}
            {actions.map((action, i) => (
              <div key={i} className="action-item">
                <span className="action-item-title">{action}</span>
                <button className="action-delete-btn" onClick={() => setActions(prev => prev.filter((_, idx) => idx !== i))}>
                  <TrashIcon size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="action-add-row">
            <input
              type="text" value={newActionText}
              onChange={e => setNewActionText(e.target.value)}
              placeholder="Ex: Courir 30 min..."
              onKeyDown={e => { if (e.key === 'Enter') addAction(); }}
              autoFocus
            />
            <button className="action-add-btn" onClick={addAction}>+</button>
          </div>
          <div className="modal-actions">
            <Button onClick={handleSave}>Créer l'objectif</Button>
            <Button variant="secondary" onClick={() => setStep(2)}>← Retour</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
