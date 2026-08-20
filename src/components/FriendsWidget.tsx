import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Inbox, Search, Check, X, Eye, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { UserProfileModal, type UserProfileData } from './UserProfileModal';
import { normalizeAvatarUrl } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToFriends,
  subscribeToFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  deleteFriend,
} from '../services/firestoreService';

export interface FriendItem extends UserProfileData {
  addedAt?: string;
}

export interface InvitationItem {
  id: string;
  fromUid: string;
  username: string;
  avatarUrl?: string;
  bp: number;
  countryCode?: string;
  sentAt: string;
}

interface FriendsWidgetProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose?: () => void;
}

export const FriendsWidget: React.FC<FriendsWidgetProps> = ({ onToast, onClose }) => {
  const { currentUser } = useAuth();

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'friends' | 'invitations' | 'add'>('friends');
  const [addUsernameInput, setAddUsernameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectUser, setInspectUser] = useState<UserProfileData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to real-time Firestore friends and friendRequests
  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubFriends = subscribeToFriends(currentUser.id, (data) => {
      const mapped: FriendItem[] = data.map(d => ({
        id: d.id || d.friendUid,
        username: d.username,
        avatarUrl: d.avatarUrl,
        status: d.status || 'online',
        bp: d.bp || 100,
        countryCode: d.countryCode || 'id',
        rank: d.rank,
        clearedCount: d.clearedCount,
        postedCount: d.postedCount,
        hereSince: d.hereSince,
        addedAt: d.addedAt,
      }));
      setFriends(mapped);
      setLoading(false);
    });

    const unsubRequests = subscribeToFriendRequests(currentUser.id, (data) => {
      const mapped: InvitationItem[] = data.map(d => ({
        id: d.id,
        fromUid: d.fromUid,
        username: d.username,
        avatarUrl: d.avatarUrl,
        bp: d.bp || 100,
        countryCode: d.countryCode || 'id',
        sentAt: d.sentAt || 'Just now',
      }));
      setInvitations(mapped);
    });

    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [currentUser]);

  // Real Firestore Handlers
  const handleAcceptInvitation = async (inv: InvitationItem) => {
    if (!currentUser) return;
    try {
      await acceptFriendRequest(currentUser.id, currentUser, inv);
      onToast(`Accepted friend request from ${inv.username}! 🎉`, 'success');
    } catch (err: any) {
      onToast(err.message || 'Failed to accept invitation.', 'error');
    }
  };

  const handleDeclineInvitation = async (id: string, name: string) => {
    if (!currentUser) return;
    try {
      await declineFriendRequest(currentUser.id, id);
      onToast(`Declined request from ${name}.`, 'info');
    } catch (err: any) {
      onToast(err.message || 'Failed to decline request.', 'error');
    }
  };

  const handleDeleteFriend = async (friendId: string, name: string) => {
    if (!currentUser) return;
    try {
      await deleteFriend(currentUser.id, friendId);
      onToast(`Removed ${name} from friends.`, 'info');
    } catch (err: any) {
      onToast(err.message || 'Failed to remove friend.', 'error');
    }
  };

  const handleSendAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addUsernameInput.trim();
    if (!name || !currentUser) return;

    if (friends.some(f => f.username.toLowerCase() === name.toLowerCase())) {
      onToast(`${name} is already in your friends list!`, 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendFriendRequest(currentUser, name);
      onToast(`Friend request sent to ${name}! 📩`, 'success');
      setAddUsernameInput('');
      setActiveTab('friends');
    } catch (err: any) {
      onToast(err.message || `Could not find user "${name}".`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = friends.filter(f => f.status === 'online').length;

  return (
    <>
      <div className="friends-widget-wrapper">
        <div className="friends-widget-box">
          {/* Header */}
          <div className="friends-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="friends-icon-badge">
                <Users size={16} color="var(--accent)" />
              </div>
              <div>
                <div className="friends-title">Friends</div>
                <div className="friends-sub">
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{onlineCount} online</span> • {friends.length} total
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Invitations Button */}
              <button
                onClick={() => setActiveTab(activeTab === 'invitations' ? 'friends' : 'invitations')}
                className={`btn btn-icon btn-sm ${activeTab === 'invitations' ? 'active-tab-btn' : ''}`}
                title="View Friend Invitations"
                style={{ position: 'relative' }}
              >
                <Inbox size={14} />
                {invitations.length > 0 && (
                  <span className="invitation-count-badge">{invitations.length}</span>
                )}
              </button>

              {/* Add Friend Button */}
              <button
                onClick={() => setActiveTab(activeTab === 'add' ? 'friends' : 'add')}
                className={`btn btn-icon btn-sm ${activeTab === 'add' ? 'active-tab-btn' : ''}`}
                title="Add Friend"
              >
                <UserPlus size={14} />
              </button>

              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="btn btn-icon btn-sm"
                  title="Close Friends"
                  style={{ marginLeft: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Search bar inside friends widget */}
          {activeTab === 'friends' && friends.length > 0 && (
            <div className="friends-search-row">
              <Search size={12} style={{ color: 'var(--text-3)' }} />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* ── Content View: Add Friend Panel ── */}
          {activeTab === 'add' && (
            <div className="friends-tab-panel anim-in">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={13} color="var(--accent)" /> Add New Friend
              </div>
              <form onSubmit={handleSendAddRequest} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter username (e.g. Cookiezi)"
                  value={addUsernameInput}
                  onChange={e => setAddUsernameInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: 12, padding: '7px 10px' }}
                  disabled={isSubmitting}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    {isSubmitting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('friends')}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Content View: Invitations Panel ── */}
          {activeTab === 'invitations' && (
            <div className="friends-tab-panel anim-in">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: 10 }}>
                Pending Invitations ({invitations.length})
              </div>

              {invitations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--text-3)' }}>
                  No pending invitations 🎉
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {invitations.map(inv => (
                    <div key={inv.id} className="invitation-card">
                      <img
                        src={normalizeAvatarUrl(inv.avatarUrl, inv.username)}
                        alt={inv.username}
                        className="friend-avatar-img"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="friend-name-text">{inv.username}</div>
                        <div className="friend-bp-text">{inv.bp.toLocaleString()} BP • {inv.sentAt}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleAcceptInvitation(inv)}
                          className="btn btn-icon btn-sm btn-accept-inv"
                          title="Accept"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(inv.id, inv.username)}
                          className="btn btn-icon btn-sm btn-decline-inv"
                          title="Decline"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Content View: Friends List ── */}
          {activeTab === 'friends' && (
            <div className="friends-list-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Loader2 size={14} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                  Loading friends...
                </div>
              ) : filteredFriends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', fontSize: 12, color: 'var(--text-3)' }}>
                  {friends.length === 0 ? 'No friends added yet' : 'No friend matches search'}
                </div>
              ) : (
                filteredFriends.map(friend => (
                  <div key={friend.id} className="friend-item-card">
                    {/* Avatar & Status dot */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={normalizeAvatarUrl(friend.avatarUrl, friend.username)}
                        alt={friend.username}
                        className="friend-avatar-img"
                      />
                      <span className={`status-dot ${friend.status}`} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="friend-name-text">{friend.username}</span>
                        {friend.rank && friend.rank <= 3 && (
                          <Sparkles size={10} color="var(--gold)" />
                        )}
                      </div>
                      <div className="friend-bp-text">
                        {friend.bp.toLocaleString()} BP
                      </div>
                    </div>

                    {/* Action buttons (Inspect & Delete) */}
                    <div className="friend-actions">
                      <button
                        onClick={() => setInspectUser(friend)}
                        className="btn btn-icon btn-sm"
                        title="Inspect Profile"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteFriend(friend.id, friend.username)}
                        className="btn btn-icon btn-sm btn-delete-friend"
                        title="Delete Friend"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Inspect Profile Modal */}
      {inspectUser && (
        <UserProfileModal
          user={inspectUser}
          onClose={() => setInspectUser(null)}
          onRemoveFriend={id => handleDeleteFriend(id, inspectUser.username)}
        />
      )}
    </>
  );
};
