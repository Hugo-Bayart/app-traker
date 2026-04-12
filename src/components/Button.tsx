import { ReactNode, CSSProperties } from 'react';
import '../styles/Button.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

export function Button({ children, onClick, variant = 'primary', size = 'medium', className = '', disabled, style }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}
