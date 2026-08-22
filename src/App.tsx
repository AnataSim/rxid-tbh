import { useState, useEffect, useRef } from 'react';
import type { Bounty, Submission } from './types/bounty';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { BountyCard } from './components/BountyCard';
import { BountyDetailModal } from './components/BountyDetailModal';
import { CreateBountyModal } from './components/CreateBountyModal';
import { SubmitProofModal } from './components/SubmitProofModal';
import { ReviewSubmissionModal } from './components/ReviewSubmissionModal';
import { EditBountyModal } from './components/EditBountyModal';
import { Leaderboard } from './components/Leaderboard';
import { RulesPage } from './components/RulesPage';
import { TitlesPage } from './components/TitlesPage';
import { FriendsPanel } from './components/FriendsPanel';
import { CoolLoadingScreen } from './components/CoolLoadingScreen';
import { BugHunterIcon } from './components/BugHunterBadge';
import { DevBadge } from './components/DevBadge';
import {
  subscribeToBounties,
  createBounty,
  updateBounty,
  submitProof,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  submitDifficultyRating,
  deleteBounty,
} from './services/firestoreService';
import { normalizeAvatarUrl, formatHereSince, formatLastLogin } from './services/authService';
import { CowboyRankSquareFrame } from './components/CowboyRankBadge';
import {
  Search, Plus, Trophy, Coins, CheckCircle2, Target,
  SlidersHorizontal, Loader2, Globe, Download, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { cacheService } from './services/cacheService';

const ITEMS_PER_PAGE = 8;
import { SecurityBadgeModal } from './components/SecurityBadgeModal';

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

import { ToastContainer, type ToastMessage } from './components/ToastNotification';
import { AnimatedBackground } from './components/AnimatedBackground';
import { CursorTrail } from './components/CursorTrail';
import { CosmeticProvider, useCosmetics } from './context/CosmeticContext';

const GithubIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export function AppContent() {
  const { currentUser, loading: authLoading, activeRole } = useAuth();
  const { equippedRankTier } = useCosmetics();
  const isGiver = activeRole === 'bounty_giver';

  const [bounties, setBounties] = useState<Bounty[]>(() => {
    return cacheService.get<Bounty[]>('bountyosu_bounties_list') || [];
  });
  const [dbLoading, setDbLoading] = useState<boolean>(() => {
    const cached = cacheService.get<Bounty[]>('bountyosu_bounties_list');
    return !cached || cached.length === 0;
  });
  const [activeTab, setActiveTab]     = useState<'bounties' | 'leaderboard' | 'titles' | 'rules'>('bounties');
  const [bountySection, setBountySection] = useState<'official' | 'ffa'>('official');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage]   = useState<number>(1);
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>(undefined);
  const [toasts, setToasts]           = useState<ToastMessage[]>([]);

  const getFfaCooldownInfo = (user: any) => {
    if (!user) return { onCooldown: false, hours: 0, mins: 0 };
    const isNewcomer = !user.title || user.title.includes('Newcomer') || (user.bountyPoints || 0) <= 100;
    if (!isNewcomer || !user.lastFfaBountyPostedAt) return { onCooldown: false, hours: 0, mins: 0 };

    const lastPostTime = new Date(user.lastFfaBountyPostedAt).getTime();
    const diffMs = Date.now() - lastPostTime;
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (diffMs >= cooldownMs) return { onCooldown: false, hours: 0, mins: 0 };

    const remainingMs = cooldownMs - diffMs;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return { onCooldown: true, hours, mins };
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, bountySection]);

  const [selectedBounty, setSelectedBounty]   = useState<Bounty | null>(null);
  const [isCreateOpen, setIsCreateOpen]        = useState(false);
  const [submitProofBounty, setSubmitProofBounty] = useState<Bounty | null>(null);
  const [reviewBounty, setReviewBounty]        = useState<Bounty | null>(null);
  const [editingBounty, setEditingBounty]      = useState<Bounty | null>(null);
  const [friendsOpen, setFriendsOpen]          = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  const bannerVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (bannerVideoRef.current) {
      bannerVideoRef.current.defaultMuted = true;
      bannerVideoRef.current.muted = true;
      bannerVideoRef.current.play().catch(err => {
        console.warn('Banner video autoplay:', err);
      });
    }
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Subscribe to Firestore bounties & fetch current user's local leaderboard rank
  useEffect(() => {
    if (!currentUser) { setDbLoading(false); return; }

    setDbLoading(true);
    const unsub = subscribeToBounties((data) => {
      setBounties(data);
      setDbLoading(false);
    });

    // Fetch local leaderboard rank for current user
    const fetchRank = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('bountyPoints', 'desc'), limit(50));
        const snap = await getDocs(q);
        const idx = snap.docs.findIndex(d => d.id === currentUser.id);
        if (idx !== -1) {
          setCurrentUserRank(idx + 1);
        }
      } catch (err) {
        console.warn('Rank fetch error:', err);
      }
    };
    fetchRank();

    return () => unsub();
  }, [currentUser]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateBounty = async (bountyData: Omit<Bounty, 'id' | 'submissions'>) => {
    try {
      const id = await createBounty(bountyData, currentUser);
      const newBounty: Bounty = { ...bountyData, id, submissions: [] };
      setSelectedBounty(newBounty);
      addToast(bountyData.isFfa ? '🔥 Free-For-All Quest Created! 🚀' : 'Bounty Created Successfully! 📜', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create bounty.', 'error');
    }
  };

  const handleSubmitProof = async (sub: Omit<Submission, 'id'>, giverId?: string, beatmapTitle?: string) => {
    await submitProof(sub.bountyId, sub, giverId, beatmapTitle);
    addToast('Approval Submitted Successfully! 🚀', 'success');
  };

  const handleApprove = async (
    bountyId: string, subId: string, hunterId?: string, beatmapTitle?: string, rewardAmount?: number, selectedTier?: 1 | 2, poa?: number
  ) => {
    await approveSubmission(bountyId, subId, hunterId, beatmapTitle, rewardAmount, selectedTier, poa || 0);
    const tierLabel = selectedTier === 1 ? ' [Tier 1 Merah]' : selectedTier === 2 ? ' [Tier 2 Hijau]' : '';
    const poaLabel = poa && poa > 0 ? ` (+${poa} PoA ✨)` : '';
    addToast(`Submission Approved${tierLabel}${poaLabel}! 💰`, 'success');
  };

  const handleReject = async (bountyId: string, subId: string, reason: string, hunterId?: string, beatmapTitle?: string) => {
    await rejectSubmission(bountyId, subId, reason, hunterId, beatmapTitle);
    addToast('Submission Rejected ❌', 'error');
  };

  const handleDeleteSubmission = async (bountyId: string, subId: string) => {
    await deleteSubmission(bountyId, subId);
    addToast('Submission Deleted 🗑️', 'info');
  };

  const handleDeleteBounty = async (bountyId: string) => {
    try {
      await deleteBounty(bountyId);
      addToast('Bounty deleted successfully! 🗑️', 'info');
      setSelectedBounty(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete bounty.', 'error');
    }
  };

  const handleSaveBounty = async (bountyId: string, updates: Partial<Bounty>) => {
    try {
      await updateBounty(bountyId, updates);
      addToast('Bounty updated successfully! ✏️', 'success');
      setEditingBounty(null);
      if (selectedBounty && selectedBounty.id === bountyId) {
        setSelectedBounty(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to update bounty.', 'error');
    }
  };

  const handleRateDifficulty = async (bountyId: string, rating: number) => {
    if (!currentUser) return;
    const newAvg = await submitDifficultyRating(bountyId, currentUser.id, rating);
    addToast(`Rated ${rating.toFixed(1)}/10 ★ (New Avg: ${newAvg.toFixed(1)} ★)`, 'success');
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const getTime = (dateVal: any) => {
    if (!dateVal) return 0;
    if (typeof dateVal === 'string') return new Date(dateVal).getTime() || 0;
    if (typeof dateVal === 'number') return dateVal;
    if (dateVal.seconds) return dateVal.seconds * 1000;
    if (dateVal.toDate && typeof dateVal.toDate === 'function') return dateVal.toDate().getTime();
    return 0;
  };

  const filtered = bounties.filter(b => {
    if (bountySection === 'official' && b.isFfa) return false;
    if (bountySection === 'ffa' && !b.isFfa) return false;

    const q = searchQuery.toLowerCase();
    const match =
      b.beatmap.title.toLowerCase().includes(q) ||
      b.beatmap.artist.toLowerCase().includes(q) ||
      b.beatmap.mapper.toLowerCase().includes(q) ||
      b.giver.username.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q));
    if (!match) return false;
    if (statusFilter === 'completed') return b.status === 'completed';
    return true;
  }).sort((a, b) => {
    const timeA = getTime(a.createdAt);
    const timeB = getTime(b.createdAt);
    if (statusFilter === 'oldest') {
      return timeA - timeB; // Ascending (oldest first)
    }
    return timeB - timeA; // Descending (newest first for 'all', 'completed', 'newest')
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBounties = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const pool      = bounties.reduce((s, b) => s + b.reward.amount, 0);
  const openCount = bounties.filter(b => b.status === 'open').length;
  const doneCount = bounties.filter(b => b.status === 'completed').length;

  const FILTERS = [
    { id: 'all',       label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'newest',    label: 'Newest' },
    { id: 'oldest',    label: 'Oldest' },
  ];

  // ── Auth gate ─────────────────────────────────────────────────────────────

  // Show spinner while Firebase checks auth state
  // Show futuristic animated loading screen while Firebase checks auth state
  if (authLoading) {
    return <CoolLoadingScreen />;
  }

  // Not logged in → show login page
  if (!currentUser) return <LoginPage />;

  // ── Board ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 64, position: 'relative' }}>
      <AnimatedBackground />
      <CursorTrail />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onToggleFriends={() => setFriendsOpen(v => !v)}
        friendsOpen={friendsOpen}
      />

      <div className="page-wrap">
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'titles'      && <TitlesPage />}
        {activeTab === 'rules'       && <RulesPage />}

        {activeTab === 'bounties' && (
          <div className="anim-in">
            {/* ── Video Hero Banner (Steam / Game Menu Style) ── */}
            <div className="hero-video-banner">
              <div className="video-background-wrap">
                <div className="banner-ambient-glow" />
                <video
                  ref={bannerVideoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="banner-video-element"
                  onTimeUpdate={(e) => {
                    if (e.currentTarget.currentTime >= 33.0) {
                      e.currentTarget.currentTime = 0;
                    }
                  }}
                  onCanPlay={() => {
                    if (bannerVideoRef.current) {
                      bannerVideoRef.current.defaultMuted = true;
                      bannerVideoRef.current.muted = true;
                      bannerVideoRef.current.play().catch(() => {});
                    }
                  }}
                >
                  <source src="/assets/bg-video.mp4" type="video/mp4" />
                </video>
                <div className="video-overlay-gradient" />
              </div>

              <div className="hero-banner-content">
                {/* Left Side: Logo Graphic */}
                <div className="banner-mascot-box">
                  <div className="banner-mascot-icon">
                    <Trophy size={36} color="var(--accent)" />
                  </div>
                </div>

                {/* Right Stacked Action Buttons (Matched to user reference photo) */}
                <div className="banner-buttons-stack">
                  <a
                    href="https://v4rx.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banner-action-btn btn-steam-green"
                    title="Download v4rx"
                  >
                    <Download size={15} /> <span className="banner-action-btn-text">Download v4rx</span>
                  </a>

                  <a
                    href="https://osu.ppy.sh/beatmapsets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banner-action-btn btn-dark-outline"
                    title="Beatmaps"
                  >
                    <Globe size={15} /> <span className="banner-action-btn-text">Beatmaps</span>
                  </a>

                  <a
                    href="https://github.com/AnataSim/rxid-tbh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banner-action-btn btn-discord-dark"
                    title="GitHub"
                  >
                    <GithubIcon size={15} /> <span className="banner-action-btn-text">GitHub</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ── Hero ── */}
            <div className="hero-section">
              <div className="hero-user">
                <img
                  className="hero-avatar"
                  src={normalizeAvatarUrl(currentUser.avatarUrl, currentUser.username)}
                  alt={currentUser.username}
                  onError={e => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(currentUser.username)}&bold=true&size=96`;
                  }}
                />
                <div>
                  <div className="hero-greeting" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={`https://flagcdn.com/w40/${(currentUser.countryCode || 'id').toLowerCase()}.png`}
                      alt={currentUser.countryCode || 'ID'}
                      style={{ width: 22, height: 14, borderRadius: 3, objectFit: 'fill', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>{currentUser.username}</span>
                    <DevBadge username={currentUser.username} />
                    <span
                      title={activeRole === 'bounty_giver' ? 'Role: Bounty Giver (BG)' : 'Role: Bounty Hunter (TBH)'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.3px',
                        background: activeRole === 'bounty_giver' ? 'rgba(255, 77, 141, 0.15)' : 'rgba(34, 211, 238, 0.15)',
                        border: `1px solid ${activeRole === 'bounty_giver' ? 'rgba(255, 77, 141, 0.4)' : 'rgba(34, 211, 238, 0.4)'}`,
                        color: activeRole === 'bounty_giver' ? '#ff4d8d' : '#22d3ee',
                        boxShadow: activeRole === 'bounty_giver' ? '0 0 10px rgba(255, 77, 141, 0.2)' : '0 0 10px rgba(34, 211, 238, 0.2)',
                        lineHeight: 1.2,
                        cursor: 'default',
                      }}
                    >
                      {activeRole === 'bounty_giver' ? 'BG' : 'TBH'}
                    </span>
                    <BugHunterIcon username={currentUser.username} />
                  </div>
                  <div className="hero-sub" style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                    <div style={{ color: 'var(--text-3)', fontSize: 12 }}>
                      Here since: <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{formatHereSince(currentUser.createdAt)}</span>
                    </div>
                    <div style={{ color: 'var(--text-3)', fontSize: 12 }}>
                      Last login: <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{formatLastLogin(currentUser.lastLoginAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stats-row">
                {/* Big Square Rank Frame Box (Frame Kotak Gede - Matched height 52px) */}
                <CowboyRankSquareFrame
                  bp={currentUser.bountyPoints || 100}
                  equippedTier={equippedRankTier || undefined}
                  rank={currentUserRank}
                  size={52}
                  onClick={() => setActiveTab('titles')}
                />
                {[
                  { label: 'Total',    value: bounties.length,             icon: <Trophy size={13} style={{ color: 'var(--blue)' }} /> },
                  { label: 'Pool',     value: pool.toLocaleString(),       icon: <Coins size={13} style={{ color: 'var(--gold)' }} /> },
                  { label: 'Open',     value: openCount,                   icon: <Target size={13} style={{ color: 'var(--accent)' }} /> },
                  { label: 'Cleared',  value: doneCount,                   icon: <CheckCircle2 size={13} style={{ color: 'var(--green)' }} /> },
                ].map(s => (
                  <div key={s.label} className="stat-chip">
                    <div className="stat-chip-icon">{s.icon}</div>
                    <div className="stat-chip-content">
                      <div className="stat-chip-label">{s.label}</div>
                      <div className="stat-chip-value">{s.value}</div>
                    </div>
                  </div>
                ))}

                {activeRole === 'bounty_giver' && (
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="btn btn-primary btn-post-bounty-full-bar"
                    title="Post Bounty (Giver Only)"
                  >
                    <Plus size={20} color="#ffffff" />
                    <span className="btn-post-label">Post Bounty Pertama</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Section Selector Bar (Official vs Free-For-All) ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12, marginBottom: 16,
              padding: '12px 16px', borderRadius: 'var(--radius)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => { setBountySection('official'); setCurrentPage(1); }}
                  className={`btn ${bountySection === 'official' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: 99, padding: '7px 18px', fontSize: 13, fontWeight: 700,
                    boxShadow: bountySection === 'official' ? '0 0 12px rgba(255, 77, 141, 0.3)' : 'none',
                  }}
                >
                  🏆 Official Quests ({bounties.filter(b => !b.isFfa).length})
                </button>
                <button
                  onClick={() => { setBountySection('ffa'); setCurrentPage(1); }}
                  className={`btn ${bountySection === 'ffa' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: 99,
                    padding: '7px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    background: bountySection === 'ffa' ? 'linear-gradient(135deg, #ff4d8d, #e11d48)' : undefined,
                    borderColor: bountySection === 'ffa' ? '#ff4d8d' : undefined,
                    color: '#ffffff',
                    boxShadow: bountySection === 'ffa' ? '0 0 16px rgba(255, 77, 141, 0.5)' : undefined,
                  }}
                >
                  🔥 Free-For-All ({bounties.filter(b => Boolean(b.isFfa)).length})
                </button>
              </div>

              <div>
                {bountySection === 'official' && isGiver && (
                  <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
                    <Plus size={14} /> Post Official Bounty
                  </button>
                )}
                {bountySection === 'ffa' && (
                  (() => {
                    const cd = getFfaCooldownInfo(currentUser);
                    return (
                      <button
                        onClick={() => {
                          if (cd.onCooldown) {
                            addToast(`⏳ Cooldown Active: Newcomers can post 1 FFA quest per 24 hours. Available in ${cd.hours}h ${cd.mins}m.`, 'error');
                            return;
                          }
                          setIsCreateOpen(true);
                        }}
                        className="btn"
                        style={{
                          background: cd.onCooldown ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #ff4d8d 0%, #f43f5e 100%)',
                          border: `1px solid ${cd.onCooldown ? 'var(--border)' : '#ff4d8d'}`,
                          color: cd.onCooldown ? 'var(--text-3)' : '#ffffff',
                          fontWeight: 700,
                          fontSize: 12,
                          borderRadius: 99,
                          padding: '6px 16px',
                          cursor: cd.onCooldown ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: cd.onCooldown ? 'none' : '0 0 14px rgba(255, 77, 141, 0.4)',
                        }}
                      >
                        <Plus size={14} />
                        {cd.onCooldown ? `⏳ Cooldown (${cd.hours}h ${cd.mins}m)` : 'Post FFA Quest (Anyone)'}
                      </button>
                    );
                  })()
                )}
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="filter-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <SlidersHorizontal size={13} style={{ color: 'var(--text-3)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Filter</span>
                </div>
                <div className="filter-tabs">
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`filter-tab ${statusFilter === f.id ? 'active' : ''}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="results-counter">
                  <div className="results-num">{filtered.length}</div>
                  <div className="results-txt">result{filtered.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="search-box">
                  <Search size={13} />
                  <input
                    type="text"
                    placeholder="Search maps, artists, mappers…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Main Dashboard Layout ── */}
            <div className="dashboard-grid">
              <div className="dashboard-main-col">
                {/* Bounty Cards Grid */}
                {dbLoading ? (
                  <div className="empty">
                    <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading bounties…</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon"><Target size={20} /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {bounties.length === 0 ? 'Board masih kosong' : 'Tidak ada bounty ditemukan'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                        {bounties.length === 0
                          ? 'Jadilah yang pertama posting bounty di v4rx.me!'
                          : 'Coba ubah filter atau kata kunci pencarian.'}
                      </div>
                    </div>
                    {bounties.length === 0 && isGiver && (
                      <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
                        <Plus size={13} /> Post Bounty Pertama
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="cards-grid">
                      {paginatedBounties.map(b => (
                        <BountyCard key={b.id} bounty={b} onSelect={setSelectedBounty} />
                      ))}
                    </div>

                    {filtered.length > ITEMS_PER_PAGE && (
                      <div className="pagination-wrap">
                        <div className="pagination-info">
                          Showing <strong>{startIndex + 1}</strong> – <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong> bounties
                        </div>
                        <div className="pagination-controls">
                          <button
                            className="pagination-btn"
                            disabled={safeCurrentPage === 1}
                            onClick={() => {
                              setCurrentPage(1);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            title="First Page"
                          >
                            <ChevronsLeft size={15} />
                          </button>
                          <button
                            className="pagination-btn"
                            disabled={safeCurrentPage === 1}
                            onClick={() => {
                              setCurrentPage(prev => Math.max(1, prev - 1));
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            title="Previous Page"
                          >
                            <ChevronLeft size={15} />
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              className={`pagination-btn ${page === safeCurrentPage ? 'active' : ''}`}
                              onClick={() => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            className="pagination-btn"
                            disabled={safeCurrentPage === totalPages}
                            onClick={() => {
                              setCurrentPage(prev => Math.min(totalPages, prev + 1));
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            title="Next Page"
                          >
                            <ChevronRight size={15} />
                          </button>
                          <button
                            className="pagination-btn"
                            disabled={safeCurrentPage === totalPages}
                            onClick={() => {
                              setCurrentPage(totalPages);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            title="Last Page"
                          >
                            <ChevronsRight size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Platform Security Footer */}
        <footer style={{
          marginTop: 48,
          padding: '24px 0 32px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 11,
          color: 'var(--text-3)',
        }}>
          <div>
            v4rx.me Bounty Platform © 2026 · Built for osu! Community
          </div>
          <button
            onClick={() => setSecurityModalOpen(true)}
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 99,
              padding: '5px 12px',
              color: '#22c55e',
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={13} />
            AES-256-GCM & HMAC-SHA256 Encrypted
          </button>
        </footer>
      </div>

      {/* Security Diagnostic Modal */}
      <SecurityBadgeModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
      />

      {/* Modals */}
      {selectedBounty && (
        <BountyDetailModal
          bounty={selectedBounty}
          currentUser={currentUser}
          onClose={() => setSelectedBounty(null)}
          onOpenSubmitProof={b => setSubmitProofBounty(b)}
          onOpenReview={b => setReviewBounty(b)}
          onDeleteSubmission={handleDeleteSubmission}
          onRateDifficulty={handleRateDifficulty}
          onDeleteBounty={handleDeleteBounty}
          onEditBounty={b => setEditingBounty(b)}
        />
      )}
      {editingBounty && (
        <EditBountyModal
          bounty={editingBounty}
          onClose={() => setEditingBounty(null)}
          onSaveBounty={handleSaveBounty}
        />
      )}
      {isCreateOpen && (bountySection === 'ffa' || isGiver) && (
        <CreateBountyModal
          currentUser={currentUser}
          onClose={() => setIsCreateOpen(false)}
          onCreateBounty={handleCreateBounty}
          isFfaMode={bountySection === 'ffa'}
        />
      )}
      {submitProofBounty && (
        <SubmitProofModal
          bounty={submitProofBounty}
          currentUser={currentUser}
          onClose={() => setSubmitProofBounty(null)}
          onSubmit={handleSubmitProof}
        />
      )}
      {reviewBounty && (
        <ReviewSubmissionModal
          bounty={reviewBounty}
          onClose={() => setReviewBounty(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onDeleteSubmission={handleDeleteSubmission}
        />
      )}
      {/* Friends Panel Drawer */}
      <FriendsPanel
        user={currentUser}
        isOpen={friendsOpen}
        onClose={() => setFriendsOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <CosmeticProvider>
      <AppContent />
    </CosmeticProvider>
  );
}

export default App;
