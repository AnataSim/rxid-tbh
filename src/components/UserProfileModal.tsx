import React from 'react';
import { X, UserX, Calendar } from 'lucide-react';
import { CowboyRankSquareFrame } from './CowboyRankBadge';
import { normalizeAvatarUrl } from '../services/authService';

export interface UserProfileData {
  id: string;
  username: string;
  avatarUrl?: string;
  countryCode?: string;
  bp: number;
  rank?: number;
  status: 'online' | 'offline';
  clearedCount?: number;
  postedCount?: number;
  hereSince?: string;
}

interface UserProfileModalProps {
  user: UserProfileData;
  onClose: () => void;
  onRemoveFriend?: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onRemoveFriend }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-max-sm"
        onClick={e => e.stopPropagation()}
        style={{ overflow: 'hidden' }}
      >
        {/* Banner header */}
        <div style={{
          position: 'relative',
          height: 110,
          background: 'linear-gradient(135deg, rgba(255, 123, 0, 0.25) 0%, rgba(56, 189, 248, 0.2) 100%)',
          borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            className="btn btn-icon btn-sm"
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.6)', border: 'none' }}
          >
            <X size={14} color="#fff" />
          </button>
        </div>

        {/* Profile Info Header */}
        <div style={{ padding: '0 24px 20px', marginTop: -40, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ position: 'relative' }}>
              <img
                src={normalizeAvatarUrl(user.avatarUrl, user.username)}
                alt={user.username}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 18,
                  objectFit: 'cover',
                  border: '3px solid var(--bg-1)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  background: 'var(--bg-2)',
                }}
              />
              <span style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: user.status === 'online' ? '#34d399' : '#6b7280',
                border: '2px solid var(--bg-1)',
                boxShadow: user.status === 'online' ? '0 0 8px rgba(52,211,153,0.8)' : 'none',
              }} />
            </div>

            <CowboyRankSquareFrame
              bp={user.bp}
              rank={user.rank}
              size={52}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={`https://flagcdn.com/w40/${(user.countryCode || 'id').toLowerCase()}.png`}
              alt={user.countryCode || 'ID'}
              style={{ width: 22, height: 15, borderRadius: 3, objectFit: 'cover', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.4px' }}>
              {user.username}
            </h2>
            <span
              title={(user.username.toLowerCase() === 'sim') ? 'Role: Bounty Giver (BG)' : 'Role: Bounty Hunter (TBH)'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.3px',
                background: user.username.toLowerCase() === 'sim' ? 'rgba(255, 77, 141, 0.15)' : 'rgba(34, 211, 238, 0.15)',
                border: `1px solid ${user.username.toLowerCase() === 'sim' ? 'rgba(255, 77, 141, 0.4)' : 'rgba(34, 211, 238, 0.4)'}`,
                color: user.username.toLowerCase() === 'sim' ? '#ff4d8d' : '#22d3ee',
                boxShadow: user.username.toLowerCase() === 'sim' ? '0 0 10px rgba(255, 77, 141, 0.2)' : '0 0 10px rgba(34, 211, 238, 0.2)',
                lineHeight: 1.2,
                cursor: 'default',
              }}
            >
              {user.username.toLowerCase() === 'sim' ? 'BG' : 'TBH'}
            </span>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> Joined {user.hereSince || 'Aug 2026'}
            </span>
            <span style={{ color: user.status === 'online' ? 'var(--green)' : 'var(--text-3)', fontWeight: 600 }}>
              ● {user.status === 'online' ? 'Online Now' : 'Offline'}
            </span>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginTop: 18,
            padding: 12,
            background: 'var(--bg)',
            border: '1px solid var(--border-md)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Bounty Points</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                {user.bp.toLocaleString()} BP
              </div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Cleared Bounties</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                {user.clearedCount ?? Math.floor(user.bp / 250)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Global Rank</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                #{user.rank || '12'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {onRemoveFriend && (
              <button
                onClick={() => {
                  onRemoveFriend(user.id);
                  onClose();
                }}
                className="btn btn-danger btn-sm"
                style={{ flex: 1, padding: '9px 12px' }}
              >
                <UserX size={14} /> Delete Friend
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1, padding: '9px 12px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
