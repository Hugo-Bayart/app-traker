import { Link, useLocation } from 'react-router-dom';
import '../styles/TabBar.css';

export function TabBar() {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Objectifs', icon: '🎯' },
    { path: '/today', label: "Aujourd'hui", icon: '✓' },
    { path: '/insights', label: 'Suivi', icon: '📊' },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`tab-item ${location.pathname === tab.path ? 'active' : ''}`}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
