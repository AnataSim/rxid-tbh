import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getRankTierInfo, CowboyRankSquareFrame, type RankTier } from './CowboyRankBadge';
import { Trophy, Shield, Sparkles, Check } from 'lucide-react';

export interface RankShowcaseTier {
  tierName: RankTier;
  title: string;
  rpCriteria: string;
  rankCriteria: string;
  sampleBp: number;
  badgeColor: string;
  borderColor: string;
  bgTint: string;
  glowShadow: string;
  gradient: string;
}

export const ALL_RANK_TIERS: RankShowcaseTier[] = [
  {
    tierName: 'Copper',
    title: 'Copper Bounty Hunter',
    rpCriteria: 'Below 249 BP',
    rankCriteria: 'Default 100 BP',
    sampleBp: 100,
    badgeColor: '#ea580c',
    borderColor: 'rgba(234, 88, 12, 0.5)',
    bgTint: 'rgba(194, 65, 12, 0.14)',
    glowShadow: '0 0 12px rgba(194, 65, 12, 0.25)',
    gradient: 'linear-gradient(135deg, #9a3412 0%, #fb923c 100%)',
  },
  {
    tierName: 'Tungsten',
    title: 'Tungsten Bounty Hunter',
    rpCriteria: '250 – 499 BP',
    rankCriteria: 'Novice Tier',
    sampleBp: 350,
    badgeColor: '#94a3b8',
    borderColor: 'rgba(148, 163, 184, 0.45)',
    bgTint: 'rgba(71, 85, 105, 0.16)',
    glowShadow: '0 0 12px rgba(71, 85, 105, 0.25)',
    gradient: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)',
  },
  {
    tierName: 'Silver',
    title: 'Silver Bounty Hunter',
    rpCriteria: '500 – 1,249 BP',
    rankCriteria: 'Veteran Tier',
    sampleBp: 750,
    badgeColor: '#cbd5e1',
    borderColor: 'rgba(203, 213, 225, 0.5)',
    bgTint: 'rgba(148, 163, 184, 0.14)',
    glowShadow: '0 0 12px rgba(148, 163, 184, 0.25)',
    gradient: 'linear-gradient(135deg, #64748b 0%, #f8fafc 100%)',
  },
  {
    tierName: 'Gold',
    title: 'Gold Bounty Hunter',
    rpCriteria: '1,250 – 1,849 BP',
    rankCriteria: 'Elite Tier',
    sampleBp: 1500,
    badgeColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.6)',
    bgTint: 'rgba(245, 158, 11, 0.14)',
    glowShadow: '0 0 14px rgba(245, 158, 11, 0.3)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #fef08a 100%)',
  },
  {
    tierName: 'Platinum',
    title: 'Platinum Bounty Hunter',
    rpCriteria: '1,850+ BP',
    rankCriteria: 'Master Tier',
    sampleBp: 2000,
    badgeColor: '#22d3ee',
    borderColor: 'rgba(34, 211, 238, 0.6)',
    bgTint: 'rgba(6, 182, 212, 0.14)',
    glowShadow: '0 0 16px rgba(6, 182, 212, 0.35)',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
  },
  {
    tierName: 'Diamond',
    title: 'Diamond Grandmaster',
    rpCriteria: 'Top 3 (Local)',
    rankCriteria: 'Leaderboard #1, #2, #3',
    sampleBp: 3500,
    badgeColor: '#c084fc',
    borderColor: 'rgba(192, 132, 252, 0.8)',
    bgTint: 'rgba(168, 85, 247, 0.16)',
    glowShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #38bdf8 100%)',
  },
];

export const TitlesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const currentBp = currentUser?.bountyPoints && currentUser.bountyPoints > 0 ? currentUser.bountyPoints : 100;
  const currentTierInfo = getRankTierInfo(currentBp);

  // Compute BP progress percentage to next tier
  let nextBpTarget = 250;
  if (currentBp >= 1850) nextBpTarget = 2500;
  else if (currentBp >= 1250) nextBpTarget = 1850;
  else if (currentBp >= 500) nextBpTarget = 1250;
  else if (currentBp >= 250) nextBpTarget = 500;

  const bpToGo = Math.max(0, nextBpTarget - currentBp);
  const progressPct = currentBp >= 2500 ? 100 : Math.min(100, Math.max(10, Math.round((currentBp / nextBpTarget) * 100)));

  return (
    <div className="anim-in" style={{ maxWidth: 860, margin: '0 auto', paddingTop: 32, paddingBottom: 48 }}>
      {/* Header */}
      <div className="titles-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="merah-putih-neon-box" style={{ width: 34, height: 34 }}>
            <Trophy size={18} color="#ef4444" />
          </div>
          <h1 className="page-title">Titles & Cowboy Hat Rank Frames</h1>
        </div>
        <p className="page-sub">
          Titles indicate each user's skill, Bounty Points (BP), and local leaderboard standing.
        </p>
      </div>

      {/* Top Active Title Card (Matching User's Request & Image 1 & 2) */}
      <div className="titles-active-card" style={{ borderColor: currentTierInfo.borderColor }}>
        <div className="titles-active-glow" style={{ background: currentTierInfo.badgeColor }} />

        {/* Big Rounded Square Rank Frame Box (Frame Kotak Gede) */}
        <div style={{ marginBottom: 14 }}>
          <CowboyRankSquareFrame bp={currentBp} size={72} />
        </div>

        <div className="titles-active-name" style={{ color: currentTierInfo.badgeColor }}>
          {currentTierInfo.tier} ({currentBp} BP)
        </div>
        <div className="titles-active-sub">Your current Bounty rank title</div>

        {/* Progress Bar */}
        <div className="titles-progress-bar-wrap">
          <div
            className="titles-progress-bar-fill"
            style={{
              width: `${progressPct}%`,
              background: currentTierInfo.gradient,
            }}
          />
          <div className="titles-progress-text">
            {bpToGo === 0 ? 'MAX TIER ACHIEVED 🎉' : `${bpToGo} BP to next tier`}
          </div>
        </div>
      </div>

      {/* All Titles Grid Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={16} style={{ color: 'var(--text-3)' }} />
          All Rank Cowboy Hat Frames
        </h2>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>6 Rank Tiers</span>
      </div>

      {/* All Titles Grid (Matching Image 1 & 2) */}
      <div className="titles-grid">
        {ALL_RANK_TIERS.map((item) => {
          const isActive = item.tierName.toLowerCase() === currentTierInfo.tier.toLowerCase();

          return (
            <div
              key={item.tierName}
              className={`title-card ${isActive ? 'active-rank' : ''}`}
              style={{
                borderColor: isActive ? item.borderColor : undefined,
              }}
            >
              {/* Big Rounded Square Rank Frame Box (Frame Kotak Gede) */}
              <CowboyRankSquareFrame bp={item.sampleBp} size={54} />

              {/* Info */}
              <div className="title-card-info">
                <div className="title-card-title" style={{ color: item.badgeColor }}>
                  {item.tierName}
                </div>
                <div className="title-card-criteria">
                  {item.rpCriteria} · <span style={{ color: 'var(--text-2)' }}>{item.rankCriteria}</span>
                </div>
              </div>

              {/* Status Badge */}
              {isActive ? (
                <div
                  className="title-card-badge"
                  style={{
                    background: item.bgTint,
                    color: item.badgeColor,
                    border: `1px solid ${item.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Check size={10} /> Active
                </div>
              ) : (
                <div
                  className="title-card-badge"
                  style={{
                    background: 'var(--bg-3)',
                    color: 'var(--text-3)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Unlocked
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Sparkles size={13} style={{ color: 'var(--gold)' }} />
        Rank cowboy hat emblems dynamically update based on your local Bounty Points (BP)!
      </div>
    </div>
  );
};


