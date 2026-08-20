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
import { Leaderboard } from './components/Leaderboard';
import { RulesPage } from './components/RulesPage';
import { TitlesPage } from './components/TitlesPage';
import { FriendsPanel } from './components/FriendsPanel';
import { CoolLoadingScreen } from './components/CoolLoadingScreen';
import {
  subscribeToBounties,
  createBounty,
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
} from 'lucide-react';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

import { ToastContainer, type ToastMessage } from './components/ToastNotification';
import { AnimatedBackground } from './components/AnimatedBackground';
import { CursorTrail } from './components/CursorTrail';

const GithubIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export function App() {
  const { currentUser, loading: authLoading, activeRole } = useAuth();
  const isGiver = activeRole === 'bounty_giver';

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [dbLoading, setDbLoading]     = useState(true);
  const [activeTab, setActiveTab]     = useState<'bounties' | 'leaderboard' | 'titles' | 'rules'>('bounties');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>(undefined);
  const [toasts, setToasts]           = useState<ToastMessage[]>([]);

  const [selectedBounty, setSelectedBounty]   = useState<Bounty | null>(null);
  const [isCreateOpen, setIsCreateOpen]        = useState(false);
  const [submitProofBounty, setSubmitProofBounty] = useState<Bounty | null>(null);
  const [reviewBounty, setReviewBounty]        = useState<Bounty | null>(null);
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
    const id = await createBounty(bountyData);
    const newBounty: Bounty = { ...bountyData, id, submissions: [] };
    setSelectedBounty(newBounty);
    addToast('Bounty Created Successfully! 📜', 'success');
  };

  const handleSubmitProof = async (sub: Omit<Submission, 'id'>, giverId?: string, beatmapTitle?: string) => {
    await submitProof(sub.bountyId, sub, giverId, beatmapTitle);
    addToast('Approval Submitted Successfully! 🚀', 'success');
  };

  const handleApprove = async (bountyId: string, subId: string, hunterId?: string, beatmapTitle?: string, rewardAmount?: number) => {
    await approveSubmission(bountyId, subId, hunterId, beatmapTitle, rewardAmount);
    const amountStr = rewardAmount ? `+${rewardAmount} BP` : 'Paid!';
    addToast(`Submission Approved & Paid ${amountStr}! 💰`, 'success');
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

  const handleRateDifficulty = async (bountyId: string, rating: number) => {
    if (!currentUser) return;
    const newAvg = await submitDifficultyRating(bountyId, currentUser.id, rating);
    addToast(`Rated ${rating.toFixed(1)}/10 ★ (New Avg: ${newAvg.toFixed(1)} ★)`, 'success');
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = bounties.filter(b => {
    const q = searchQuery.toLowerCase();
    const match =
      b.beatmap.title.toLowerCase().includes(q) ||
      b.beatmap.artist.toLowerCase().includes(q) ||
      b.beatmap.mapper.toLowerCase().includes(q) ||
      b.giver.username.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q));
    if (!match) return false;
    if (statusFilter === 'open')      return b.status === 'open';
    if (statusFilter === 'completed') return b.status === 'completed';
    if (statusFilter === 'Ranked')    return b.beatmap.status === 'Ranked';
    if (statusFilter === 'Loved')     return b.beatmap.status === 'Loved';
    return true;
  });

  const pool      = bounties.reduce((s, b) => s + b.reward.amount, 0);
  const openCount = bounties.filter(b => b.status === 'open').length;
  const doneCount = bounties.filter(b => b.status === 'completed').length;

  const FILTERS = [
    { id: 'all',       label: 'All' },
    { id: 'open',      label: 'Open' },
    { id: 'completed', label: 'Completed' },
    { id: 'Ranked',    label: 'Ranked' },
    { id: 'Loved',     label: 'Loved' },
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
                  >
                    <Download size={14} /> Download v4rx
                  </a>

                  <a
                    href="https://osu.ppy.sh/beatmapsets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banner-action-btn btn-dark-outline"
                  >
                    <Globe size={14} /> Beatmaps
                  </a>

                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banner-action-btn btn-discord-dark"
                  >
                    <GithubIcon size={14} /> GitHub
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
                      style={{ width: 22, height: 15, borderRadius: 3, objectFit: 'cover', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>{currentUser.username}</span>
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
                    className="btn btn-primary"
                    title="Post Bounty (Giver Only)"
                    style={{
                      width: 52,
                      height: 52,
                      padding: 0,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(255, 77, 141, 0.35)',
                    }}
                  >
                    <Plus size={22} color="#ffffff" />
                  </button>
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
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
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
                  <div className="cards-grid">
                    {filtered.map(b => (
                      <BountyCard key={b.id} bounty={b} onSelect={setSelectedBounty} />
                    ))}
                  </div>
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
        />
      )}
      {isCreateOpen && isGiver && (
        <CreateBountyModal
          currentUser={currentUser}
          onClose={() => setIsCreateOpen(false)}
          onCreateBounty={handleCreateBounty}
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
      {/* Friends Panel Drawer (Matched with AnataSim/wast) */}
      <FriendsPanel
        user={currentUser}
        isOpen={friendsOpen}
        onClose={() => setFriendsOpen(false)}
      />
    </div>
  );
}

export default App;
