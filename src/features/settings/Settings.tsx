import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../themes';
import { ArrowLeftIcon, CheckIcon } from '../../components/Icons';
import { exportAllData, importAllData } from '../../storage/db';
import './Settings.css';

const USER_NAME_KEY = 'goal-tracker-username';

export function Settings() {
  const navigate = useNavigate();
  const { themeId, setThemeId, themes } = useTheme();
  const [userName, setUserName] = useState(() => localStorage.getItem(USER_NAME_KEY) || '');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus('Sauvegarde téléchargée ✓');
    setTimeout(() => setBackupStatus(null), 3000);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importAllData(text);
      setBackupStatus('Données restaurées ✓ — Recharge l\'app');
    } catch {
      setBackupStatus('Erreur : fichier invalide');
    }
    if (importRef.current) importRef.current.value = '';
    setTimeout(() => setBackupStatus(null), 4000);
  }

  function handleNameChange(v: string) {
    setUserName(v);
    localStorage.setItem(USER_NAME_KEY, v);
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back" onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="settings-title">Réglages</h1>
      </div>

      <section className="settings-section">
        <h2 className="settings-section-label">Apparence</h2>

        <div className="theme-list">
          {themes.map((theme: Theme) => {
            const isActive = theme.id === themeId;
            return (
              <button
                key={theme.id}
                className={`theme-card ${isActive ? 'theme-card--active' : ''}`}
                onClick={() => setThemeId(theme.id)}
              >
                {/* Mini preview */}
                <div
                  className="theme-preview"
                  style={{ background: theme.vars.bg, border: `2px solid ${theme.vars.border}` }}
                >
                  <div
                    className="theme-preview-bar"
                    style={{ background: theme.vars.accent1 }}
                  />
                  <div
                    className="theme-preview-dots"
                  >
                    <span style={{ background: theme.vars.accent2 }} />
                    <span style={{ background: theme.vars.accent3 }} />
                  </div>
                </div>

                {/* Info */}
                <div className="theme-info">
                  <span className="theme-name">{theme.name}</span>
                  <span className="theme-desc">{theme.description}</span>
                </div>

                {/* Active indicator */}
                <div className={`theme-check ${isActive ? 'theme-check--active' : ''}`}>
                  {isActive ? <CheckIcon size={14} /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-label">Compte</h2>
        <div className="settings-card">
          <label className="settings-field-label">Prénom</label>
          <input
            className="settings-field-input"
            type="text"
            value={userName}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Ton prénom..."
          />
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-label">Sauvegarde</h2>
        <div className="settings-card backup-card">
          <p className="backup-desc">Exporte tes données pour les sauvegarder ou les restaurer après réinstallation.</p>
          <div className="backup-actions">
            <button className="backup-btn backup-btn--export" onClick={handleExport}>
              Exporter mes données
            </button>
            <button className="backup-btn backup-btn--import" onClick={() => importRef.current?.click()}>
              Restaurer une sauvegarde
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
          {backupStatus && <p className="backup-status">{backupStatus}</p>}
        </div>
      </section>
    </div>
  );
}
