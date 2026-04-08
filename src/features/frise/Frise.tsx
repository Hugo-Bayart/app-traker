import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Progress } from '../../components/Progress';
import { getRoadmapPhases, getRoadmapItemsByPhase, updateRoadmapItem } from '../../storage/db';
import { RoadmapPhase, RoadmapItem } from '../../types';
import './Frise.css';

export function Frise() {
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [itemsByPhase, setItemsByPhase] = useState<Map<string, RoadmapItem[]>>(new Map());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [globalStats, setGlobalStats] = useState({ total: 0, completed: 0 });
  const [phaseStats, setPhaseStats] = useState<Map<string, { total: number; completed: number }>>(new Map());

  useEffect(() => {
    loadFrise();
  }, []);

  async function loadFrise() {
    const allPhases = await getRoadmapPhases();
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

    // Expand phase 0 by default
    if (allPhases.length > 0) {
      setExpandedPhases(new Set([allPhases[0].id]));
    }
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

  return (
    <div className="frise-page">
      <div className="frise-header">
        <h1>🗺️ Frise</h1>
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
              <div
                className="frise-phase-header"
                onClick={() => togglePhaseExpand(phase.id)}
              >
                <div className="phase-info">
                  <h2>{phase.title}</h2>
                  <div className="phase-meta">
                    <span className="phase-country">{phase.country}</span>
                    <span className="phase-duration">{phase.duration}</span>
                  </div>
                </div>
                <div className="phase-progress">
                  <div className="progress-number">{stats.completed}/{stats.total}</div>
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
                      <label key={item.id} className={`frise-item ${item.completed ? 'completed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleItem(item.id, phase.id)}
                        />
                        <span className="item-title">{item.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
