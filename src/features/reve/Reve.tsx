import { useState, useEffect } from 'react';
import { Dream } from '../../types';
import { getDreams, addDream, updateDream, deleteDream } from '../../storage/db';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { TrashIcon } from '../../components/Icons';
import './Reve.css';

const SUGGESTED_EMOJIS = ['🌍', '🏠', '💰', '❤️', '🎓', '✈️', '🚀', '🏆', '🌟', '💪', '🎨', '📚', '🎵', '🌺', '🧘', '👨‍👩‍👧', '🐾', '⛵', '🎯', '🌙'];

function StarsBg() {
  return (
    <div className="reve-stars" aria-hidden>
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="reve-star" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${(Math.random() * 3).toFixed(2)}s`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          opacity: Math.random() * 0.6 + 0.2,
        }} />
      ))}
    </div>
  );
}

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function AddDreamModal({ isOpen, onClose, onSaved }: AddModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🌟');

  function reset() {
    setTitle('');
    setDescription('');
    setEmoji('🌟');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    const t = title.trim();
    if (!t) return;
    const dream: Dream = {
      id: 'd' + Date.now(),
      title: t,
      description: description.trim() || undefined,
      emoji,
      createdAt: Date.now(),
      accomplished: false,
    };
    await addDream(dream);
    reset();
    onSaved();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nouveau rêve">
      <div className="reve-modal-content">
        <div className="reve-emoji-row">
          <span className="reve-emoji-preview">{emoji}</span>
          <div className="reve-emoji-grid">
            {SUGGESTED_EMOJIS.map(e => (
              <button
                key={e}
                className={`reve-emoji-btn ${emoji === e ? 'selected' : ''}`}
                onClick={() => setEmoji(e)}
              >{e}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Mon rêve *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Voyager au Japon, créer une entreprise…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label>Description <span className="form-optional">(optionnel)</span></label>
          <textarea
            className="form-input form-textarea"
            placeholder="Pourquoi ce rêve est important pour toi…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={300}
          />
        </div>

        <Button
          variant="primary"
          size="large"
          onClick={handleSave}
          disabled={!title.trim()}
          style={{ width: '100%', marginTop: '8px' }}
        >
          Ajouter ce rêve
        </Button>
      </div>
    </Modal>
  );
}

export function Reve() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setDreams(await getDreams());
  }

  async function toggleAccomplished(dream: Dream) {
    await updateDream({ ...dream, accomplished: !dream.accomplished });
    await load();
  }

  async function handleDelete(id: string) {
    await deleteDream(id);
    setDeleteConfirmId(null);
    await load();
  }

  const pending = dreams.filter(d => !d.accomplished);
  const accomplished = dreams.filter(d => d.accomplished);

  return (
    <div className="reve-page">
      {/* ── Header ── */}
      <div className="reve-header">
        <StarsBg />
        <div className="reve-header-content">
          <span className="reve-header-label">Mes rêves</span>
          <h1 className="reve-header-title">Ce que je veux<br />accomplir dans la vie</h1>
          <div className="reve-header-stats">
            <span className="reve-stat">
              <strong>{dreams.length}</strong> rêves
            </span>
            {accomplished.length > 0 && (
              <span className="reve-stat reve-stat--done">
                <strong>{accomplished.length}</strong> accomplis ✦
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Dream list ── */}
      <div className="reve-body">
        {dreams.length === 0 && (
          <div className="reve-empty">
            <span className="reve-empty-icon">🌙</span>
            <p className="reve-empty-title">Aucun rêve pour l'instant</p>
            <p className="reve-empty-sub">Appuie sur + pour noter ce que tu veux accomplir dans ta vie.</p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="reve-section">
            {pending.map(dream => (
              <DreamCard
                key={dream.id}
                dream={dream}
                onToggle={() => toggleAccomplished(dream)}
                onDeleteRequest={() => setDeleteConfirmId(dream.id)}
              />
            ))}
          </div>
        )}

        {accomplished.length > 0 && (
          <div className="reve-section">
            <div className="reve-section-label">Accomplis ✦</div>
            {accomplished.map(dream => (
              <DreamCard
                key={dream.id}
                dream={dream}
                onToggle={() => toggleAccomplished(dream)}
                onDeleteRequest={() => setDeleteConfirmId(dream.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button className="reve-fab" onClick={() => setIsAddOpen(true)} aria-label="Ajouter un rêve">
        <span className="reve-fab-icon">✦</span>
      </button>

      {/* ── Add modal ── */}
      <AddDreamModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={() => { setIsAddOpen(false); load(); }}
      />

      {/* ── Delete confirm modal ── */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Supprimer ce rêve"
      >
        <p style={{ marginBottom: '20px', color: 'var(--clr-text-secondary)' }}>
          Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)} style={{ flex: 1 }}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} style={{ flex: 1 }}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface DreamCardProps {
  dream: Dream;
  onToggle: () => void;
  onDeleteRequest: () => void;
}

function DreamCard({ dream, onToggle, onDeleteRequest }: DreamCardProps) {
  return (
    <div className={`dream-card ${dream.accomplished ? 'dream-card--done' : ''}`}>
      <button className="dream-card-check" onClick={onToggle} aria-label={dream.accomplished ? 'Marquer non accompli' : 'Marquer accompli'}>
        <span className="dream-card-emoji">{dream.emoji || '🌟'}</span>
        {dream.accomplished && <span className="dream-card-check-overlay">✓</span>}
      </button>
      <div className="dream-card-body">
        <span className="dream-card-title">{dream.title}</span>
        {dream.description && (
          <span className="dream-card-desc">{dream.description}</span>
        )}
      </div>
      <button
        className="dream-card-delete"
        onClick={e => { e.stopPropagation(); onDeleteRequest(); }}
        aria-label="Supprimer"
      >
        <TrashIcon size={16} />
      </button>
    </div>
  );
}
