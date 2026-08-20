import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Scroll, Plus, LogOut, ChevronDown, Award, Bell, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeAvatarUrl } from '../services/authService';
import { CowboyRankBadge } from './CowboyRankBadge';
import { useCosmetics } from '../context/CosmeticContext';
import { subscribeToNotifications, markNotificationAsRead } from '../services/notificationService';
import type { AppNotification } from '../types/bounty';

interface NavbarProps {
  activeTab: 'bounties' | 'leaderboard' | 'titles' | 'rules';
  setActiveTab: (tab: 'bounties' | 'leaderboard' | 'titles' | 'rules') => void;
  onOpenCreateModal: () => void;
  onToggleFriends?: () => void;
  friendsOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, onOpenCreateModal, onToggleFriends, friendsOpen,
}) => {
  const { currentUser, logout, activeRole } = useAuth();
  const { equippedRankTier } = useCosmetics();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen]           = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.id, (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const isGiver = activeRole === 'bounty_giver';

  return (
    <header className="navbar">
      <div className="page-wrap navbar-inner">

        {/* Logo */}
        <button onClick={() => setActiveTab('bounties')} className="nav-logo">
          <div className="merah-putih-neon-box" style={{ width: 34, height: 34 }}>
            <Trophy size={18} color="#ef4444" />
          </div>
          <div className="nav-logo-text">
            rxid<span>.tbh</span>{' '}
            <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 12 }}>/ Bounty</span>
          </div>
        </button>

        {/* Nav Links */}
        <nav className="nav-tabs">
          {[
            { id: 'bounties'    as const, label: 'Board',          icon: <Trophy size={13} /> },
            { id: 'leaderboard' as const, label: 'Leaderboard',    icon: <Zap size={13} /> },
            { id: 'titles'      as const, label: 'Titles & Ranks', icon: <Award size={13} /> },
            { id: 'rules'       as const, label: 'Rules',          icon: <Scroll size={13} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="nav-right" style={{ gap: 10 }}>

          {/* Post Bounty (Icon Only) */}
          {isGiver && (
            <button
              onClick={onOpenCreateModal}
              className="btn btn-primary"
              title="Post Bounty"
              style={{
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Plus size={16} color="#ffffff" />
            </button>
          )}

          {/* Friends Drawer Button */}
          {currentUser && (
            <button
              onClick={onToggleFriends}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: friendsOpen ? 'var(--accent-dim)' : 'var(--bg-1)',
                border: `1px solid ${friendsOpen ? 'var(--accent-mid)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: friendsOpen ? 'var(--accent)' : 'var(--text-2)',
                transition: 'all 0.15s ease',
              }}
              title="Friends & Activity"
            >
              <Users size={15} />
            </button>
          )}

          {/* Notifications Bell */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--bg-1)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  color: 'var(--text-2)',
                }}
                title="Notifications"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      padding: '0 4px',
                      borderRadius: 99,
                      background: '#ff2456',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(255, 36, 86, 0.8)',
                      border: '2px solid var(--bg)',
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notifOpen && (
                <div
                  className="dropdown"
                  style={{ width: 320, right: 0, padding: 0, overflow: 'hidden' }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Notifications</div>
                    {unreadCount > 0 ? (
                      <button
                        onClick={() => {
                          notifications.forEach(n => {
                            if (!n.read) markNotificationAsRead(n.id);
                          });
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                      >
                        Mark all as read
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>0 unread</span>
                    )}
                  </div>

                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                        No notifications yet!
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            background: n.read ? 'transparent' : 'rgba(255,77,141,0.06)',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: n.read ? 'var(--text-2)' : 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
                            {n.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.3 }}>
                            {n.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User menu */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                className="user-chip"
                onClick={() => setUserMenuOpen(v => !v)}
              >
                <img
                  src={normalizeAvatarUrl(currentUser.avatarUrl, currentUser.username)}
                  alt={currentUser.username}
                  onError={e => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(currentUser.username)}&bold=true&size=64`;
                  }}
                />
                <div>
                  <div className="user-chip-name">{currentUser.username}</div>
                  <div className="user-chip-pts">{currentUser.bountyPoints.toLocaleString()} BP</div>
                </div>
                <ChevronDown size={13} style={{ color: 'var(--text-3)', marginLeft: 2 }} />
              </button>

              {userMenuOpen && (
                <div className="dropdown">
                  {/* User info */}
                  <div className="dropdown-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={normalizeAvatarUrl(currentUser.avatarUrl, currentUser.username)}
                        alt={currentUser.username}
                        style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                        onError={e => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(currentUser.username)}&bold=true`;
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{currentUser.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                          Role: <span style={{ color: isGiver ? '#ff4d8d' : '#22d3ee', fontWeight: 600 }}>{isGiver ? 'Bounty Giver (BG)' : 'Bounty Hunter (TBH)'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ padding: '10px 16px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-3)' }}>Bounty Tier</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CowboyRankBadge
                          bp={currentUser.bountyPoints || 100}
                          equippedTier={equippedRankTier || undefined}
                          size="sm"
                          onClick={() => {
                            setActiveTab('titles');
                            setUserMenuOpen(false);
                          }}
                        />
                      </div>
                    </div>
                    {[
                      { label: 'Bounty Points', value: `${(currentUser.bountyPoints || 100).toLocaleString()} BP` },
                      { label: 'PP',            value: `${currentUser.v4rxPp.toLocaleString()} pp` },
                      { label: 'Accuracy',      value: `${currentUser.v4rxAccuracy}%` },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-3)' }}>{s.label}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-1)' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '8px 6px 8px', borderTop: '1px solid var(--border)', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div
                      className="dropdown-item"
                      onClick={handleLogout}
                      style={{ color: 'var(--red)', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LogOut size={13} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Logout</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Bottom Navigation Bar (Only visible on mobile <= 768px) */}
      <nav className="mobile-bottom-nav">
        {[
          { id: 'bounties'    as const, label: 'Board',          icon: <Trophy size={16} /> },
          { id: 'leaderboard' as const, label: 'Leaderboard',    icon: <Zap size={16} /> },
          { id: 'titles'      as const, label: 'Titles & Ranks', icon: <Award size={16} /> },
          { id: 'rules'       as const, label: 'Rules',          icon: <Scroll size={16} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`mobile-nav-item ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};

