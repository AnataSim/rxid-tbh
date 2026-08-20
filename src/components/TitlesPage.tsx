import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCosmetics } from '../context/CosmeticContext';
import { getRankTierInfo, CowboyRankSquareFrame, type RankTier } from './CowboyRankBadge';
import { Trophy, Shield, Sparkles, Check, Lock } from 'lucide-react';

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
  minBp: number;
}

export const ALL_RANK_TIERS: RankShowcaseTier[] = [
  {
    tierName: 'Copper',
    title: 'Copper Bounty Hunter',
    rpCriteria: 'Below 249 BP',
    rankCriteria: 'Default 100 BP',
    sampleBp: 100,
    minBp: 0,
    badgeColor: '#ea580c',
    borderColor: 'rgba(234, 88, 12, 0.65)',
    bgTint: 'rgba(194, 65, 12, 0.14)',
    glowShadow: '0 0 20px rgba(234, 88, 12, 0.45)',
    gradient: 'linear-gradient(135deg, #9a3412 0%, #fb923c 100%)',
  },
  {
    tierName: 'Tungsten',
    title: 'Tungsten Bounty Hunter',
    rpCriteria: '250 – 499 BP',
    rankCriteria: 'Novice Tier',
    sampleBp: 350,
    minBp: 250,
    badgeColor: '#94a3b8',
    borderColor: 'rgba(148, 163, 184, 0.65)',
    bgTint: 'rgba(71, 85, 105, 0.16)',
    glowShadow: '0 0 20px rgba(148, 163, 184, 0.45)',
    gradient: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)',
  },
  {
    tierName: 'Silver',
    title: 'Silver Bounty Hunter',
    rpCriteria: '500 – 1,249 BP',
    rankCriteria: 'Veteran Tier',
    sampleBp: 750,
    minBp: 500,
    badgeColor: '#cbd5e1',
    borderColor: 'rgba(203, 213, 225, 0.75)',
    bgTint: 'rgba(148, 163, 184, 0.14)',
    glowShadow: '0 0 20px rgba(203, 213, 225, 0.5)',
    gradient: 'linear-gradient(135deg, #64748b 0%, #f8fafc 100%)',
  },
  {
    tierName: 'Gold',
    title: 'Gold Bounty Hunter',
    rpCriteria: '1,250 – 1,849 BP',
    rankCriteria: 'Elite Tier',
    sampleBp: 1500,
    minBp: 1250,
    badgeColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.8)',
    bgTint: 'rgba(245, 158, 11, 0.14)',
    glowShadow: '0 0 22px rgba(251, 191, 36, 0.55)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #fef08a 100%)',
  },
  {
    tierName: 'Platinum',
    title: 'Platinum Bounty Hunter',
    rpCriteria: '1,850+ BP',
    rankCriteria: 'Master Tier',
    sampleBp: 2000,
    minBp: 1850,
    badgeColor: '#22d3ee',
    borderColor: 'rgba(34, 211, 238, 0.8)',
    bgTint: 'rgba(6, 182, 212, 0.14)',
    glowShadow: '0 0 24px rgba(34, 211, 238, 0.6)',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
  },
  {
    tierName: 'Diamond',
    title: 'Diamond Grandmaster',
    rpCriteria: 'Top 3 (Local)',
    rankCriteria: 'Leaderboard #1, #2, #3',
    sampleBp: 3500,
    minBp: 2500,
    badgeColor: '#c084fc',
    borderColor: 'rgba(192, 132, 252, 0.85)',
    bgTint: 'rgba(168, 85, 247, 0.16)',
    glowShadow: '0 0 26px rgba(168, 85, 247, 0.65)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #38bdf8 100%)',
  },
];

export const TitlesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { equippedRankTier, toggleTier } = useCosmetics();

  const currentBp = currentUser?.bountyPoints && currentUser.bountyPoints > 0 ? currentUser.bountyPoints : 100;
  const currentTierInfo = getRankTierInfo(currentBp, undefined, equippedRankTier || undefined);

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
          Equip accessories & custom rank frames to personalize your avatar and cursor trail!
        </p>
      </div>

      {/* Top Active Title Card */}
      <div className="titles-active-card" style={{ borderColor: currentTierInfo.borderColor, boxShadow: currentTierInfo.glowShadow }}>
        <div className="titles-active-glow" style={{ background: currentTierInfo.badgeColor }} />

        {/* Big Rounded Square Rank Frame Box */}
        <div style={{ marginBottom: 14 }}>
          <CowboyRankSquareFrame bp={currentBp} equippedTier={equippedRankTier || undefined} size={72} />
        </div>

        <div className="titles-active-name" style={{ color: currentTierInfo.badgeColor }}>
          {currentTierInfo.tier} {equippedRankTier ? '(Equipped Cosmetic)' : `(${currentBp} BP)`}
        </div>
        <div className="titles-active-sub">
          {equippedRankTier ? `Active equipped rank accessory theme: ${equippedRankTier}` : 'Your default BP rank title'}
        </div>

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
          Rank Accessories & Cowboy Hat Frames
        </h2>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>6 Unlockable Accessories</span>
      </div>

      {/* All Titles Grid with Equip/Unequip Outer Glowing Card Styling */}
      <div className="titles-grid">
        {ALL_RANK_TIERS.map((item) => {
          const isEquipped = equippedRankTier === item.tierName;
          const isUnlocked = currentBp >= item.minBp || item.tierName === 'Copper';

          return (
            <div
              key={item.tierName}
              className={`title-card ${isEquipped ? 'equipped-cosmetic-glow' : ''}`}
              style={{
                position: 'relative',
                borderColor: isEquipped ? item.badgeColor : isUnlocked ? 'var(--border)' : 'rgba(255,255,255,0.06)',
                boxShadow: isEquipped ? item.glowShadow : 'none',
                transition: 'all 0.25s ease',
                opacity: isUnlocked ? 1 : 0.65,
                background: isEquipped ? item.bgTint : 'var(--bg-card)',
              }}
            >
              {/* Big Rounded Square Rank Frame Box */}
              <CowboyRankSquareFrame bp={item.sampleBp} equippedTier={item.tierName} size={54} />

              {/* Info */}
              <div className="title-card-info">
                <div className="title-card-title" style={{ color: item.badgeColor, fontWeight: 700 }}>
                  {item.tierName}
                </div>
                <div className="title-card-criteria">
                  {item.rpCriteria} · <span style={{ color: 'var(--text-2)' }}>{item.rankCriteria}</span>
                </div>
              </div>

              {/* Equip / Unequip Action Button */}
              {isUnlocked ? (
                <button
                  type="button"
                  onClick={() => toggleTier(item.tierName)}
                  style={{
                    background: isEquipped ? item.gradient : 'var(--bg-3)',
                    color: isEquipped ? '#ffffff' : 'var(--text-1)',
                    border: isEquipped ? `1px solid ${item.borderColor}` : '1px solid var(--border)',
                    boxShadow: isEquipped ? `0 0 14px ${item.borderColor}` : 'none',
                    borderRadius: 99,
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s ease',
                  }}
                  title={isEquipped ? 'Click to unequip / reset to default' : `Equip ${item.tierName} Accessory`}
                >
                  {isEquipped ? (
                    <>
                      <Check size={11} /> EQUIPPED
                    </>
                  ) : (
                    'EQUIP'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 99,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={`Locked (Requires ${item.minBp} BP)`}
                >
                  <Lock size={10} /> LOCKED
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Sparkles size={13} style={{ color: 'var(--gold)' }} />
        Equipping an accessory changes your Avatar Frame and custom Cursor Trail color theme! Click again to unequip.
      </div>
    </div>
  );
};


