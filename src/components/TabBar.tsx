import { Link, useLocation } from 'react-router-dom';
import '../styles/TabBar.css';

const IconReve = () => (
  <svg viewBox="0 0 24 24">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const IconGoals = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <line x1="12" y1="2.5" x2="12" y2="4.5" />
    <line x1="12" y1="19.5" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="4.5" y2="12" />
    <line x1="19.5" y1="12" x2="21.5" y2="12" />
  </svg>
);

const IconToday = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polyline points="8,14 11,17 16,12" />
  </svg>
);

const IconInsights = () => (
  <svg viewBox="0 0 24 24">
    <polyline points="3,18 8,12 13,15 21,6" />
    <line x1="3" y1="21" x2="21" y2="21" />
  </svg>
);

const IconFrise = () => (
  <svg viewBox="0 0 24 24">
    <line x1="12" y1="3" x2="12" y2="21" />
    <polyline points="6,9 12,3 18,9" />
    <line x1="6" y1="15" x2="18" y2="15" />
    <line x1="6" y1="19" x2="18" y2="19" />
  </svg>
);

export function TabBar() {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Rêves', Icon: IconReve },
    { path: '/goals', label: 'Objectifs', Icon: IconGoals },
    { path: '/today', label: "Aujourd'hui", Icon: IconToday },
    { path: '/insights', label: 'Suivi', Icon: IconInsights },
    { path: '/frise', label: 'Frise', Icon: IconFrise },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`tab-item ${location.pathname === tab.path ? 'active' : ''}`}
        >
          <span className="tab-icon"><tab.Icon /></span>
          <span className="tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
