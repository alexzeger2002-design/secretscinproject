import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ring-1 ring-white/5 ${className}`}>
      {children}
    </div>
  );
}
