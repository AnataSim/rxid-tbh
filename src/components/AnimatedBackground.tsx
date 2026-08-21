import React, { useMemo } from 'react';

const DARKWW_AVATAR = 'https://v4rx.me/user/avatar/63.png';

export const AnimatedBackground: React.FC = () => {
  // Generate floating ember dust particles along left and right side margins only
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const isLeft = i % 2 === 0;
      const leftVal = isLeft
        ? (i * 1.4 + Math.random() * 2) % 16 + 1
        : 83 + ((i * 1.4 + Math.random() * 2) % 16);

      return {
        id: i,
        left: `${leftVal}%`,
        size: 2 + (i % 3),
        duration: 11 + (i % 8) * 1.5,
        delay: -(i * 0.7),
      };
    });
  }, []);

  return (
    <div className="bg-ambient-container">
      {/* darkww avatar as full-screen blurred background */}
      <div
        style={{
          position: 'absolute',
          inset: '-40px',
          backgroundImage: `url(${DARKWW_AVATAR})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px) brightness(0.18) saturate(1.4)',
          transform: 'scale(1.08)',
          opacity: 0.85,
          zIndex: 0,
        }}
      />
      {/* dark overlay on top of the blurred BG */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(11,10,8,0.72) 0%, rgba(11,10,8,0.60) 100%)',
          zIndex: 1,
        }}
      />

      {/* Animated Glowing Orbs placed along Outer Edges & Corners */}
      <div className="bg-orb bg-orb-top-left" style={{ zIndex: 2 }} />
      <div className="bg-orb bg-orb-top-right" style={{ zIndex: 2 }} />
      <div className="bg-orb bg-orb-bottom-left" style={{ zIndex: 2 }} />
      <div className="bg-orb bg-orb-bottom-right" style={{ zIndex: 2 }} />

      {/* Floating Ember Particles along Side Margins */}
      {particles.map(p => (
        <div
          key={p.id}
          className="ember-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            zIndex: 3,
          }}
        />
      ))}
    </div>
  );
};
