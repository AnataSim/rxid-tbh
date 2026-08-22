import React, { useState, useEffect } from 'react';
import type { Bounty } from '../types/bounty';
import { Star, Clock, Play, Download, Info } from 'lucide-react';
import { DifficultyBadge } from './DifficultyRatingSection';
import { calculateCountdown } from '../utils/timeUtils';

interface BountyCardProps {
  bounty: Bounty;
  onSelect: (bounty: Bounty) => void;
}

export const BountyCard: React.FC<BountyCardProps> = ({ bounty, onSelect }) => {
  const { beatmap, reward, views, status } = bounty;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!bounty.deadlineAt) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [bounty.deadlineAt]);

  const countdown = calculateCountdown(bounty.deadlineAt);

  // Skillsets (explicit field or inferred fallback for legacy maps)
  const rawSkillsets = (bounty.skillsets && bounty.skillsets.length > 0)
    ? bounty.skillsets
    : (bounty.tags || []).filter(t => !['RANKED', 'LOVED', 'GRAVEYARD', 'APPROVED', 'PENDING'].includes(t.toUpperCase())).filter(Boolean);

  const skillsets = rawSkillsets.length > 0
    ? rawSkillsets
    : (beatmap.starRating >= 7.0 ? ['Stream', 'Aim'] : beatmap.starRating >= 5.5 ? ['Jump', 'Aim'] : ['Reading', 'Aim']);

  return (
    <div className="bounty-card" onClick={() => onSelect(bounty)}>
      {/* Cover */}
      <div className="card-img">
        <img
          src={beatmap.cardUrl || beatmap.coverUrl}
          alt={beatmap.title}
          onError={e => {
            (e.currentTarget as HTMLImageElement).src =
              'https://assets.ppy.sh/beatmaps/2275685/covers/card@2x.jpg';
          }}
        />
        <div className="card-img-fade" />

        {/* TL: Status + Skillset badges */}
        <div className="card-img-tl" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <span className={`label ${beatmap.status.toLowerCase() === 'loved' ? 'label-loved' : beatmap.status.toLowerCase() === 'graveyard' ? 'label-graveyard' : 'label-ranked'}`}>
            {beatmap.status.toUpperCase()}
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {skillsets.slice(0, 2).map((skill, idx) => (
              <span key={idx} className="label label-skillset">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* TR: Star / Duration / Plays */}
        <div className="card-img-tr">
          <span className="stat-mini">
            <span className="star-val">{beatmap.starRating.toFixed(1)}</span>
            <Star size={9} fill="currentColor" color="#93b4ff" />
          </span>
          <span className="stat-mini">
            <Clock size={9} />
            {beatmap.durationFormatted}
          </span>
          <span className="stat-mini">
            <Play size={9} />
            {(views || beatmap.playCount).toLocaleString()}
          </span>
        </div>

        {/* BL: Live Countdown Timer (Bottom-Left) */}
        {countdown && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              zIndex: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(0, 0, 0, 0.75)',
              border: `1px solid ${countdown.isExpired ? '#f87171' : 'rgba(248, 113, 113, 0.6)'}`,
              color: '#f87171',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'var(--mono)',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(4px)',
            }}
            title={countdown.isExpired ? 'Quest Deadline Expired (LIMITED)' : `Time remaining: ${countdown.formatted}`}
          >
            <Clock size={10} color="#f87171" />
            <span>{countdown.badgeText}</span>
          </div>
        )}

        {/* BR: Accumulated community average difficulty rating badge (Bottom-Right) */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 6 }}>
          <DifficultyBadge rating={bounty.avgDifficulty || 0} />
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <div>
          <div className="card-title clamp">{beatmap.title}</div>
          <div className="card-meta" style={{ marginTop: 2 }}>
            by <span>{beatmap.artist}</span>
          </div>
          <div className="card-meta" style={{ marginTop: 1 }}>
            mapper: <span>{beatmap.mapper}</span>
          </div>
        </div>

        <div className="card-bottom">
          <div className="reward-pill">
            {bounty.isFfa ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#ff4d8d', fontWeight: 800, fontSize: 11 }}>Giver:</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 11 }}>{bounty.giver?.username || 'Community'}</span>
              </div>
            ) : bounty.isDualReward ? (
              <>
                <span style={{ color: '#f87171', fontWeight: 800 }}>{(bounty.rewardTier1 ?? 0).toLocaleString()}</span>
                <span style={{ color: 'var(--text-3)', margin: '0 2px', fontWeight: 600 }}>/</span>
                <span style={{ color: '#4ade80', fontWeight: 800 }}>{(bounty.rewardTier2 ?? 0).toLocaleString()}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{reward.currency}</span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{reward.amount.toLocaleString()}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{reward.currency}</span>
              </>
            )}
          </div>

          {status === 'completed' && (
            <span className="label label-done">Cleared</span>
          )}

          <div className="card-actions">
            <button
              className="btn btn-icon btn-sm"
              onClick={e => { e.stopPropagation(); onSelect(bounty); }}
              title="Details"
            >
              <Info size={12} />
            </button>
            <a
              href={`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapsetId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="btn btn-icon btn-sm"
              title="Download"
            >
              <Download size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
