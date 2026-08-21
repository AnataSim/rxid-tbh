import React from 'react';

export function isDevUser(username?: string): boolean {
  if (!username) return false;
  const u = username.trim().toLowerCase();
  return u === 'unclem' || u === '2';
}

export const DevBadge: React.FC<{ username?: string }> = ({ username }) => {
  if (!isDevUser(username)) return null;

  return (
    <span
      title="Role: Developer (DEV)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.4px',
        background: 'rgba(168, 85, 247, 0.18)',
        border: '1px solid rgba(168, 85, 247, 0.45)',
        color: '#c084fc',
        boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)',
        lineHeight: 1.2,
        cursor: 'default',
        flexShrink: 0,
      }}
    >
      DEV
    </span>
  );
};
