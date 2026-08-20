import React, { useMemo } from 'react';

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
      {/* Animated Glowing Orbs placed along Outer Edges & Corners */}
      <div className="bg-orb bg-orb-top-left" />
      <div className="bg-orb bg-orb-top-right" />
      <div className="bg-orb bg-orb-bottom-left" />
      <div className="bg-orb bg-orb-bottom-right" />

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
          }}
        />
      ))}
    </div>
  );
};
