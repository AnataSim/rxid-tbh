import React from 'react';
import type { Bounty } from '../types/bounty';
import { Star, Clock, Play, Download, Info } from 'lucide-react';
import { DifficultyBadge } from './DifficultyRatingSection';

interface BountyCardProps {
  bounty: Bounty;
  onSelect: (bounty: Bounty) => void;
}

export const BountyCard: React.FC<BountyCardProps> = ({ bounty, onSelect }) => {
  const { beatmap, reward, views, tags, status } = bounty;
  const mainTag = tags.find(t => t !== 'RANKED' && t !== 'LOVED') || '';

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

        {/* TL: Status + tag */}
        <div className="card-img-tl">
          <span className={`label ${beatmap.status.toLowerCase() === 'loved' ? 'label-loved' : 'label-ranked'}`}>
            {beatmap.status}
          </span>
          {mainTag && (
            <span className="label label-tag">{mainTag}</span>
          )}
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

        {/* BR: Accumulated community average difficulty rating badge */}
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
            <span>{reward.amount.toLocaleString()}</span>
            <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{reward.currency}</span>
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
