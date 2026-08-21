import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Check, 
  X, 
  AlertCircle, 
  ChevronRight
} from 'lucide-react';
import type { User } from '../types/bounty';
import { 
  sendFriendInvitation, 
  subscribeToIncomingRequests, 
  subscribeToFriendsList, 
  acceptFriendInvitation, 
  rejectFriendInvitation, 
  searchUsernames,
  type FriendRequest, 
  type FriendUser,
  type UserSearchResult
} from '../services/friendService';

interface FriendsPanelProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectFriend?: (friend: FriendUser) => void;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({
  user,
  isOpen,
  onClose,
  onSelectFriend,
}) => {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  
  // Modals inside panel
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false);
  
  // Form states & Live search autocomplete
  const [targetUsername, setTargetUsername] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Live search effect as user types targetUsername
  useEffect(() => {
    const clean = targetUsername.trim();
    if (!clean) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const currentUid = user?.id || user?.uid;
      const currentUsername = user?.username;
      const results = await searchUsernames(clean, currentUid, currentUsername);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [targetUsername, user]);

  // Subscribe to real-time friends and invitations if user logged in
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setIncomingRequests([]);
      return;
    }

    const currentUid = user.id || user.uid;

    const unsubRequests = subscribeToIncomingRequests(user, (reqs) => {
      setIncomingRequests(reqs);
    });

    const unsubFriends = subscribeToFriendsList(currentUid, (list) => {
      setFriends(list);
    });

    return () => {
      unsubRequests();
      unsubFriends();
    };
  }, [user]);

  if (!user) return null;

  const hasPendingInvitations = incomingRequests.length > 0;

  const sendInvitationToName = async (usernameToInvite: string) => {
    setSendFeedback(null);
    const clean = usernameToInvite.trim();
    if (!clean) return;

    setSendLoading(true);
    setSearchResults([]);

    try {
      await sendFriendInvitation(user, clean);
      setSendFeedback({ type: 'success', msg: `✅ Undangan pertemanan berhasil dikirim ke "${clean}"!` });
      setTargetUsername('');
    } catch (err: any) {
      setSendFeedback({ type: 'error', msg: err.message || 'Gagal mengirim undangan.' });
    } finally {
      setSendLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendInvitationToName(targetUsername);
  };

  const handleAccept = async (req: FriendRequest) => {
    try {
      await acceptFriendInvitation(user, req);
    } catch (err: any) {
      console.warn('Gagal menerima undangan:', err);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const currentUid = user.id || user.uid;
      await rejectFriendInvitation(currentUid, requestId);
    } catch (err: any) {
      console.warn('Gagal menolak undangan:', err);
    }
  };

  return (
    <>
      {/* ── Outer Overlay Backdrop ────────────────────────────────────────── */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* ── Right Sliding Panel Container ──────────────────────────────────── */}
      <aside
        style={{
          width: '320px',
          background: 'var(--bg-1)',
          borderLeft: '1px solid var(--border-md)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: '60px',
          right: 0,
          bottom: 0,
          height: 'calc(100vh - 60px)',
          zIndex: 999,
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-1)', fontWeight: 800, fontSize: '0.95rem' }}>
            <Users size={18} style={{ color: 'var(--accent)' }} />
            <span>Friends System</span>
            <span
              style={{
                fontSize: '0.7rem',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              {friends.length}
            </span>
          </div>

          <button
            onClick={onClose}
            title="Tutup Panel Teman"
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border-md)',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--text-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Top 2 Action Buttons: Add Friend & Invitation ───────────────── */}
        <div style={{ padding: '14px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)' }}>
          {/* Add Friend Button */}
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setSendFeedback(null);
            }}
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: '10px',
              border: '1px solid var(--accent-mid)',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <UserPlus size={14} /> Add Friend
          </button>

          {/* Invitation Button (With Red Notification Badge) */}
          <button
            onClick={() => setIsInvitationsOpen(true)}
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border-md)',
              background: hasPendingInvitations ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-2)',
              color: hasPendingInvitations ? '#ef4444' : 'var(--text-1)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              position: 'relative',
            }}
          >
            <Mail size={14} /> Invitation
            {hasPendingInvitations && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid var(--bg-1)',
                  boxShadow: '0 0 8px #ef4444',
                }}
              />
            )}
          </button>
        </div>

        {/* ── Friends List Body ───────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {friends.length === 0 ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-3)' }}>
              <Users size={28} style={{ color: 'var(--border-hi)', marginBottom: '10px' }} />
              <p style={{ fontSize: '0.8rem', margin: '0 0 4px', color: 'var(--text-1)', fontWeight: 600 }}>Belum ada teman</p>
              <p style={{ fontSize: '0.72rem', margin: 0, color: 'var(--text-3)' }}>
                Tekan <strong>Add Friend</strong> untuk mengirim undangan pertemanan.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  onClick={() => onSelectFriend && onSelectFriend(friend)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {friend.photoURL ? (
                      <img
                        src={friend.photoURL}
                        alt={friend.username}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent)' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent), #f97316)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {friend.username}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} /> Online
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Modal 1: Add Friend Modal ───────────────────────────────────────── */}
      {isAddModalOpen && (
        <div
          onClick={() => setIsAddModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--bg-1)',
              border: '1px solid var(--border-md)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-1)', fontWeight: 800, fontSize: '1rem' }}>
                <UserPlus size={18} style={{ color: 'var(--accent)' }} />
                <span>Tambah Teman</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                Masukkan Username atau UID Teman:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Ketik username / UID (cth: Sim atau 85)..."
                  className="input-clean"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg)', border: '1px solid var(--border-md)', color: 'var(--text-1)' }}
                />

                {/* Real-time Search Suggestions Dropdown */}
                {targetUsername.trim().length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '6px',
                      background: 'var(--bg-1)',
                      border: '1px solid var(--accent-mid)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '6px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {isSearching ? (
                      <div style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center' }}>
                        Mencari username &quot;{targetUsername}&quot;...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center' }}>
                        User &quot;{targetUsername}&quot; tidak ditemukan
                      </div>
                    ) : (
                      searchResults.map((res) => {
                        const isMe = res.isSelf || res.uid === user.id || res.uid === user.uid;

                        return (
                          <div
                            key={res.uid}
                            onClick={() => {
                              if (isMe) {
                                setSendFeedback({ type: 'error', msg: 'Kamu tidak dapat mengirim undangan ke akun sendiri.' });
                                return;
                              }
                              sendInvitationToName(res.displayName);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius)',
                              background: 'var(--bg)',
                              opacity: isMe ? 0.6 : 1,
                              cursor: isMe ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {res.photoURL ? (
                                <img src={res.photoURL} alt={res.displayName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--accent), #f97316)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {res.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>{res.displayName}</span>
                                {isMe && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', background: 'var(--bg-2)', padding: '2px 6px', borderRadius: '4px' }}>
                                    Kamu
                                  </span>
                                )}
                              </div>
                            </div>

                            <span style={{ fontSize: '0.72rem', color: isMe ? 'var(--text-3)' : 'var(--accent)', fontWeight: 600 }}>
                              {isMe ? 'Akun Kamu' : 'Pilih ✓'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {sendFeedback && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: sendFeedback.type === 'success' ? '#22c55e' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {sendFeedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{sendFeedback.msg}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sendLoading}
                  className="btn btn-primary btn-sm"
                >
                  {sendLoading ? 'Mengirim...' : 'Kirim Undangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Invitations Modal ─────────────────────────────────────── */}
      {isInvitationsOpen && (
        <div
          onClick={() => setIsInvitationsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-1)',
              border: '1px solid var(--border-md)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-1)', fontWeight: 800, fontSize: '1rem' }}>
                <Mail size={18} style={{ color: '#ef4444' }} />
                <span>Undangan Pertemanan ({incomingRequests.length})</span>
              </div>
              <button
                onClick={() => setIsInvitationsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {incomingRequests.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-3)' }}>
                <Mail size={28} style={{ color: 'var(--border-hi)', marginBottom: '8px' }} />
                <p style={{ fontSize: '0.82rem', margin: 0, color: 'var(--text-2)' }}>Tidak ada undangan pertemanan baru.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {req.fromPhotoURL ? (
                        <img
                          src={req.fromPhotoURL}
                          alt={req.fromUsername}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), #f97316)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                          }}
                        >
                          {req.fromUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>{req.fromUsername}</div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Mengirim undangan</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleAccept(req)}
                        title="Terima"
                        style={{
                          background: '#22c55e',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        <Check size={14} /> Terima
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        title="Tolak"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
