import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../themes';
import { ArrowLeftIcon, CheckIcon } from '../../components/Icons';
import './Settings.css';

const USER_NAME_KEY = 'goal-tracker-username';

export function Settings() {
  const navigate = useNavigate();
  const { themeId, setThemeId, themes } = useTheme();
  const [userName, setUserName] = useState(() => localStorage.getItem(USER_NAME_KEY) || '');

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
    </div>
  );
}
