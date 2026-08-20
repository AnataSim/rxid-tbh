import React, { useState } from 'react';
import { Star, Award, Check } from 'lucide-react';

export function getDifficultyColor(rating: number): string {
  if (!rating || rating === 0) return '#64748b'; // 0: Slate Grey (Unrated)
  if (rating < 3.0) return '#3b82f6'; // 1-2: Blue
  if (rating < 5.0) return '#22c55e'; // 3-4: Green
  if (rating < 7.0) return '#eab308'; // 5-6: Yellow
  if (rating < 9.0) return '#a855f7'; // 7-8: Purple
  return '#18181b';                   // 9-10: Black / Onyx
}

export function getDifficultyLabel(rating: number): string {
  if (!rating || rating === 0) return 'Unrated (0/10)';
  if (rating < 3.0) return 'Easy / Beginner (1-2)';
  if (rating < 5.0) return 'Normal / Skilled (3-4)';
  if (rating < 7.0) return 'Hard / Insane (5-6)';
  if (rating < 9.0) return 'Expert / Extra (7-8)';
  return 'Extreme / Demonic (9-10)';
}

export const DifficultyStars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  const color = getDifficultyColor(rating);
  const isBlack = rating >= 9.0;
  const isUnrated = !rating || rating === 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: 10 }).map((_, idx) => {
        const starNum = idx + 1;
        let fillFraction = 0;
        if (!isUnrated) {
          if (rating >= starNum) {
            fillFraction = 1;
          } else if (rating > idx && rating < starNum) {
            fillFraction = rating - idx;
          }
        }

        const gradId = `star-grad-${idx}-${rating.toFixed(1).replace('.', '_')}-${Math.random().toString().slice(2, 6)}`;

        return (
          <svg key={idx} width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <defs>
              <linearGradient id={gradId}>
                <stop offset={`${fillFraction * 100}%`} stopColor={isBlack ? '#27272a' : color} />
                <stop offset={`${fillFraction * 100}%`} stopColor="rgba(255,255,255,0.08)" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={`url(#${gradId})`}
              stroke={isUnrated ? '#475569' : isBlack ? '#52525b' : color}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
};

export const DifficultyBadge: React.FC<{ rating: number; style?: React.CSSProperties }> = ({ rating, style }) => {
  const color = getDifficultyColor(rating);
  const isBlack = rating >= 9.0;
  const isUnrated = !rating || rating === 0;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 6,
        background: isUnrated ? 'rgba(30, 41, 59, 0.7)' : isBlack ? '#18181b' : `${color}22`,
        border: `1.5px solid ${isUnrated ? '#475569' : isBlack ? '#52525b' : color}`,
        boxShadow: isUnrated ? '0 2px 6px rgba(0,0,0,0.5)' : isBlack ? '0 2px 10px rgba(0,0,0,0.8)' : `0 2px 10px ${color}33`,
        color: isUnrated ? '#94a3b8' : isBlack ? '#f4f4f5' : color,
        fontSize: 11,
        fontFamily: 'var(--mono)',
        fontWeight: 800,
        zIndex: 5,
        backdropFilter: 'blur(6px)',
        ...style,
      }}
      title={`Community Average Rating: ${rating ? rating.toFixed(1) : '0.0'} / 10 (${getDifficultyLabel(rating)})`}
    >
      <Star size={11} fill={isUnrated ? 'none' : isBlack ? '#f4f4f5' : color} style={{ color: isUnrated ? '#94a3b8' : isBlack ? '#f4f4f5' : color }} />
      <span>{rating ? rating.toFixed(1) : '0.0'} ★</span>
    </div>
  );
};

interface DifficultyRatingSectionProps {
  currentRating?: number;
  userRating?: number;
  onRate: (rating: number) => void;
}

export const DifficultyRatingSection: React.FC<DifficultyRatingSectionProps> = ({
  currentRating = 0,
  userRating,
  onRate,
}) => {
  const [val, setVal] = useState<number>(userRating ?? currentRating ?? 0);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(parseFloat(e.target.value).toFixed(1));
    if (!isNaN(num) && num >= 0.0 && num <= 10.0) {
      setVal(num);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val < 1.0) return; // Rating must be at least 1.0
    onRate(val);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const currentColor = getDifficultyColor(val);

  return (
    <div
      style={{
        marginTop: 16,
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} style={{ color: currentColor }} />
            Community Difficulty Rating (Tingkat Kesulitan)
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            Input 1.0/10 to 10.0/10 to rate map difficulty
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Overall Average:</span>
          <DifficultyBadge rating={currentRating} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* Input field */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            min="0.0"
            max="10.0"
            step="0.1"
            value={val}
            onChange={handleChange}
            className="form-input mono"
            style={{ width: 80, padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontSize: 13 }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>/ 10</span>
        </div>

        {/* Range slider for smooth input */}
        <input
          type="range"
          min="0.0"
          max="10.0"
          step="0.1"
          value={val}
          onChange={handleChange}
          style={{ flex: 1, minWidth: 120, accentColor: currentColor, cursor: 'pointer' }}
        />

        {/* Progress Stars Component to the right of input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px', borderRadius: 8, background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
          <DifficultyStars rating={val} size={15} />
          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--mono)', color: currentColor }}>
            {val.toFixed(1)}/10
          </span>
        </div>

        {/* Submit rating button */}
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={val < 1.0}
          style={{
            marginLeft: 'auto',
            background: submitted ? 'var(--green)' : undefined,
            borderColor: submitted ? 'var(--green)' : undefined,
            opacity: val < 1.0 ? 0.6 : 1,
            cursor: val < 1.0 ? 'not-allowed' : 'pointer',
          }}
        >
          {submitted ? (
            <>
              <Check size={12} /> Saved!
            </>
          ) : (
            'Rate Difficulty'
          )}
        </button>
      </form>
    </div>
  );
};
