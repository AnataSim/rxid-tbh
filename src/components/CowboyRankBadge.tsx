import React from 'react';

export type RankTier = 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Tungsten' | 'Copper';

export interface RankTierInfo {
  tier: RankTier;
  division: string;      // "1", "2", "3", "4", "5" or "#1", "#2", "#3"
  title: string;         // e.g. "Diamond #1", "Tungsten 1"
  fullName: string;      // e.g. "Diamond #1 Bounty Hunter"
  badgeColor: string;    // Main accent hex/css
  gradient: string;      // CSS gradient string
  borderColor: string;   // Border stroke
  bgTint: string;        // Mini frame background
  glowShadow: string;    // Glow shadow
  rpRange: string;       // RP or Rank criteria description for UI cards
  isDiamond: boolean;
}

export function getRankTierInfo(bpNumber: number = 100, leaderboardRank?: number, equippedTier?: RankTier): RankTierInfo {
  let bp = bpNumber;
  if (equippedTier) {
    switch (equippedTier) {
      case 'Diamond': bp = 2500; break;
      case 'Platinum': bp = 2000; break;
      case 'Gold': bp = 1500; break;
      case 'Silver': bp = 750; break;
      case 'Tungsten': bp = 350; break;
      case 'Copper': bp = 100; break;
    }
    leaderboardRank = undefined;
  } else if (bpNumber <= 0) {
    bp = 100;
  }

  // 1. Diamond Serial #1, #2, #3 (Top 3 Local Leaderboard)
  if (leaderboardRank === 1) {
    return {
      tier: 'Diamond',
      division: '#1',
      title: 'Diamond #1',
      fullName: 'Diamond #1 Bounty Hunter',
      badgeColor: '#c084fc',
      gradient: 'linear-gradient(135deg, #a855f7 0%, #38bdf8 100%)',
      borderColor: 'rgba(192, 132, 252, 0.8)',
      bgTint: 'rgba(168, 85, 247, 0.16)',
      glowShadow: '0 0 16px rgba(168, 85, 247, 0.45)',
      rpRange: 'Top 1 (Local Leaderboard)',
      isDiamond: true,
    };
  }
  if (leaderboardRank === 2) {
    return {
      tier: 'Diamond',
      division: '#2',
      title: 'Diamond #2',
      fullName: 'Diamond #2 Bounty Hunter',
      badgeColor: '#818cf8',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
      borderColor: 'rgba(129, 140, 248, 0.8)',
      bgTint: 'rgba(99, 102, 241, 0.16)',
      glowShadow: '0 0 14px rgba(99, 102, 241, 0.4)',
      rpRange: 'Top 2 (Local Leaderboard)',
      isDiamond: true,
    };
  }
  if (leaderboardRank === 3) {
    return {
      tier: 'Diamond',
      division: '#3',
      title: 'Diamond #3',
      fullName: 'Diamond #3 Bounty Hunter',
      badgeColor: '#38bdf8',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #22d3ee 100%)',
      borderColor: 'rgba(56, 189, 248, 0.8)',
      bgTint: 'rgba(56, 189, 248, 0.16)',
      glowShadow: '0 0 14px rgba(56, 189, 248, 0.4)',
      rpRange: 'Top 3 (Local Leaderboard)',
      isDiamond: true,
    };
  }

  // 2. Platinum (1850+ BP)
  if (bp >= 1850) {
    return {
      tier: 'Platinum',
      division: 'Master',
      title: 'Platinum',
      fullName: 'Platinum Bounty Hunter',
      badgeColor: '#22d3ee',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
      borderColor: 'rgba(34, 211, 238, 0.55)',
      bgTint: 'rgba(6, 182, 212, 0.14)',
      glowShadow: '0 0 12px rgba(6, 182, 212, 0.3)',
      rpRange: '1,850+ BP',
      isDiamond: false,
    };
  }

  // 3. Gold (1250 – 1849 BP)
  if (bp >= 1250) {
    return {
      tier: 'Gold',
      division: 'Elite',
      title: 'Gold',
      fullName: 'Gold Bounty Hunter',
      badgeColor: '#fbbf24',
      gradient: 'linear-gradient(135deg, #d97706 0%, #fef08a 100%)',
      borderColor: 'rgba(251, 191, 36, 0.55)',
      bgTint: 'rgba(245, 158, 11, 0.14)',
      glowShadow: '0 0 10px rgba(245, 158, 11, 0.25)',
      rpRange: '1,250 – 1,849 BP',
      isDiamond: false,
    };
  }

  // 4. Silver (500 – 1249 BP)
  if (bp >= 500) {
    return {
      tier: 'Silver',
      division: 'Veteran',
      title: 'Silver',
      fullName: 'Silver Bounty Hunter',
      badgeColor: '#cbd5e1',
      gradient: 'linear-gradient(135deg, #64748b 0%, #f8fafc 100%)',
      borderColor: 'rgba(203, 213, 225, 0.45)',
      bgTint: 'rgba(148, 163, 184, 0.14)',
      glowShadow: '0 0 8px rgba(148, 163, 184, 0.2)',
      rpRange: '500 – 1,249 BP',
      isDiamond: false,
    };
  }

  // 5. Tungsten (250 – 499 BP)
  if (bp >= 250) {
    return {
      tier: 'Tungsten',
      division: 'Novice',
      title: 'Tungsten',
      fullName: 'Tungsten Bounty Hunter',
      badgeColor: '#94a3b8',
      gradient: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)',
      borderColor: 'rgba(148, 163, 184, 0.4)',
      bgTint: 'rgba(71, 85, 105, 0.16)',
      glowShadow: '0 0 8px rgba(71, 85, 105, 0.18)',
      rpRange: '250 – 499 BP',
      isDiamond: false,
    };
  }

  // 6. Copper (Below 249 BP - Default 100 BP)
  return {
    tier: 'Copper',
    division: 'Rookie',
    title: 'Copper',
    fullName: 'Copper Bounty Hunter',
    badgeColor: '#ea580c',
    gradient: 'linear-gradient(135deg, #9a3412 0%, #fb923c 100%)',
    borderColor: 'rgba(234, 88, 12, 0.45)',
    bgTint: 'rgba(194, 65, 12, 0.14)',
    glowShadow: '0 0 8px rgba(194, 65, 12, 0.2)',
    rpRange: 'Below 249 BP',
    isDiamond: false,
  };
}

/**
 * Pure SVG Cowboy Hat Icon 🤠 (No Background, Just the Hat Filled with Rank Color/Gradient)
 */
export function CowboyHatIcon({
  tier = 'Copper',
  color = '',
  size = 18,
  className = '',
}: {
  tier?: RankTier;
  color?: string;
  size?: number;
  className?: string;
}) {
  const gradId = `hatGrad-${tier}-${size}`;

  // Rank-tailored gradients & belt colors
  const rankColors: Record<RankTier, { start: string; end: string; band: string }> = {
    Copper:   { start: '#ea580c', end: '#fb923c', band: '#7c2d12' },
    Tungsten: { start: '#475569', end: '#94a3b8', band: '#1e293b' },
    Silver:   { start: '#94a3b8', end: '#f8fafc', band: '#334155' },
    Gold:     { start: '#d97706', end: '#fef08a', band: '#78350f' },
    Platinum: { start: '#06b6d4', end: '#67e8f9', band: '#164e63' },
    Diamond:  { start: '#a855f7', end: '#38bdf8', band: '#581c87' },
  };

  const currentColors = rankColors[tier] || rankColors.Copper;
  const hatFill = color ? color : `url(#${gradId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={currentColors.start} />
          <stop offset="100%" stopColor={currentColors.end} />
        </linearGradient>

        <filter id={`hatShadow-${tier}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor={currentColors.start} floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter={`url(#hatShadow-${tier})`}>
        {/* Hat Crown Main Shape */}
        <path
          d="M9.5 15.5C9.2 10.5 11 5.5 16 5.5C21 5.5 22.8 10.5 22.5 15.5H9.5Z"
          fill={hatFill}
        />

        {/* Crown Center Dip Crease */}
        <path
          d="M12.5 5.8C14 7.2 18 7.2 19.5 5.8C18.2 4.8 13.8 4.8 12.5 5.8Z"
          fill="rgba(0,0,0,0.32)"
        />

        {/* Hat Crown Side Shading Highlights */}
        <path
          d="M10.5 14C10.8 11.5 12 7.5 15 6.5C13.5 8 12.2 11 11.8 14H10.5Z"
          fill="rgba(255,255,255,0.22)"
        />

        {/* Hat Belt / Band Ribbon */}
        <path
          d="M9.2 15C11.5 16.2 20.5 16.2 22.8 15L23.2 17C20.5 18.2 11.5 18.2 8.8 17L9.2 15Z"
          fill={currentColors.band}
        />

        {/* Hat Belt Metallic Buckle */}
        <rect
          x="14.8"
          y="15.2"
          width="2.4"
          height="2.6"
          rx="0.5"
          fill="#fef08a"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="0.4"
        />

        {/* Swept Cowboy Brim */}
        <path
          d="M2.5 19.2C1.2 17.5 4 16 7.5 17C11.5 18.2 20.5 18.2 24.5 17C28 16 30.8 17.5 29.5 19.2C27.2 22.2 22 23.5 16 23.5C10 23.5 4.8 22.2 2.5 19.2Z"
          fill={hatFill}
        />

        {/* Brim Underside Shadow */}
        <path
          d="M3.2 19.5C5 21.2 9.8 22.5 16 22.5C22.2 22.5 27 21.2 28.8 19.5C27 20.8 22.2 21.8 16 21.8C9.8 21.8 5 20.8 3.2 19.5Z"
          fill="rgba(0,0,0,0.3)"
        />
      </g>
    </svg>
  );
}

interface CowboyRankBadgeProps {
  rank?: number;
  bp?: number;
  equippedTier?: RankTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CowboyRankBadge: React.FC<CowboyRankBadgeProps> = ({
  rank,
  bp = 100,
  equippedTier,
  size = 'md',
  showLabel = true,
  className = '',
  onClick,
}) => {
  const info = getRankTierInfo(bp, rank, equippedTier);
  const iconSizes = { sm: 16, md: 20, lg: 26 };

  const badgeClasses = [
    'cowboy-rank-badge',
    `badge-${size}`,
    info.isDiamond ? 'diamond-serial-glow' : '',
    onClick ? 'clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={badgeClasses}
      title={`${info.fullName} (${bp} BP)`}
      onClick={onClick}
      style={{
        background: info.bgTint,
        borderColor: info.borderColor,
        boxShadow: info.glowShadow,
        color: info.badgeColor,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Cowboy Hat Vector Icon - NO Background Box, Just the Hat Filled with Rank Color */}
      <CowboyHatIcon tier={info.tier} size={iconSizes[size]} />

      {/* Divider Bar (Matching Image 3 Pill Design) */}
      {showLabel && <span className="cowboy-rank-divider" style={{ backgroundColor: info.borderColor }} />}

      {/* Division or Serial Number */}
      {showLabel && (
        <span className="cowboy-rank-text" style={{ background: info.gradient }}>
          {info.division}
        </span>
      )}
    </span>
  );
};

/**
 * Big Rounded Square Rank Frame Box 🔲🤠 (Matching Image 1 & 2 "Frame Kotak Gede")
 */
interface CowboyRankSquareFrameProps {
  rank?: number;
  bp?: number;
  equippedTier?: RankTier;
  size?: number; // e.g. 52px, 58px, 64px
  className?: string;
  onClick?: () => void;
}

export const CowboyRankSquareFrame: React.FC<CowboyRankSquareFrameProps> = ({
  rank,
  bp = 100,
  equippedTier,
  size = 58,
  className = '',
  onClick,
}) => {
  const info = getRankTierInfo(bp, rank, equippedTier);
  const iconSize = Math.round(size * 0.62);

  return (
    <div
      className={`cowboy-rank-square-frame ${info.isDiamond ? 'diamond-serial-glow' : ''} ${className}`}
      onClick={onClick}
      title={`${info.fullName} (${bp} BP)`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26), // Smooth rounded corners like Image 1
        background: '#161616',
        border: `1.5px solid ${info.borderColor}`,
        boxShadow: info.glowShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Inner background tint layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: info.bgTint,
          borderRadius: 'inherit',
          pointerEvents: 'none',
        }}
      />

      {/* Pure Cowboy Hat Vector Icon inside the Frame */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <CowboyHatIcon tier={info.tier} size={iconSize} />
      </div>
    </div>
  );
};



