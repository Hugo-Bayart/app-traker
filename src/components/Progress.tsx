import '../styles/Progress.css';

interface ProgressProps {
  value: number;
  max?: number;
}

function getProgressColor(pct: number): string {
  if (pct >= 66) return 'var(--clr-accent1)';
  if (pct >= 33) return 'var(--clr-accent2)';
  return 'var(--clr-accent3)';
}

export function Progress({ value, max = 100 }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const color = getProgressColor(percentage);

  return (
    <div className="progress-container">
      <div
        className="progress-bar"
        style={{ width: `${percentage}%`, '--progress-color': color } as React.CSSProperties}
      />
    </div>
  );
}
