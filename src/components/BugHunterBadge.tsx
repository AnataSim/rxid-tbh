import React from 'react';
import { Bug } from 'lucide-react';

export function isBugHunter(username?: string): boolean {
  if (!username) return false;
  const u = username.trim().toLowerCase();
  return u === 'sim' || u === 'darkww' || u === 'transcensionism';
}

export const BugHunterIcon: React.FC<{ username?: string }> = ({ username }) => {
  if (!isBugHunter(username)) return null;

  return (
    <span
      title="Bug Hunter Badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: 6,
        background: 'rgba(16, 185, 129, 0.18)',
        border: '1px solid rgba(16, 185, 129, 0.45)',
        color: '#10b981',
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
        cursor: 'help',
        flexShrink: 0,
      }}
    >
      <Bug size={13} color="#10b981" />
    </span>
  );
};
