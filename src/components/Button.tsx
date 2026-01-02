import { ReactNode } from 'react';
import '../styles/Button.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Button({ children, onClick, variant = 'primary', size = 'medium', className = '' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}
