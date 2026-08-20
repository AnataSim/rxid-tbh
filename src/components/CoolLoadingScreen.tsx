import React from 'react';
import { Trophy, ShieldCheck, Cpu } from 'lucide-react';

export const CoolLoadingScreen: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#080706',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* CSS Animations */}
      <style>{`
        @keyframes pulseOrbRed {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.25; }
          50% { transform: scale(1.3) translate(-20px, 15px); opacity: 0.45; }
        }
        @keyframes pulseOrbWhite {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.15; }
          50% { transform: scale(1.35) translate(20px, -15px); opacity: 0.35; }
        }
        @keyframes dualSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
          50% { text-shadow: 0 0 22px rgba(239, 68, 68, 0.8), 0 0 30px rgba(255, 255, 255, 0.5); }
        }
      `}</style>

      {/* Ambient background glowing light orbs */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '35%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(50px)',
          animation: 'pulseOrbRed 6s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '35%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(60px)',
          animation: 'pulseOrbWhite 7s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Cyber Grid Pattern Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />

      {/* Center Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          zIndex: 2,
        }}
      >
        {/* Rotating Dual Arc Spinner + Emblem */}
        <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Outer Pulsing Wave Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '24px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
              animation: 'pulseRing 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />

          {/* Rotating Spinner Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-16px',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#ef4444',
              borderBottomColor: '#ffffff',
              animation: 'dualSpin 1.4s linear infinite',
              filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))',
            }}
          />

          {/* Merah Putih Trophy Emblem */}
          <div
            className="merah-putih-neon-box"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), 0 0 40px rgba(255, 255, 255, 0.3)',
            }}
          >
            <Trophy size={30} color="#ef4444" />
          </div>
        </div>

        {/* Brand Text */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 900,
              letterSpacing: '-0.5px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>rxid</span>
            <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>.tbh</span>
            <span
              style={{
                background: 'linear-gradient(180deg, #ef4444 0%, #ffffff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 900,
                animation: 'textGlow 3s ease-in-out infinite',
              }}
            >
              Bounty
            </span>
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-3)',
              marginTop: '6px',
              letterSpacing: '0.12em',
              fontWeight: 600,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Cpu size={14} style={{ color: '#ef4444' }} />
            <span>Connecting to v4rx Network</span>
          </div>
        </div>

        {/* Shimmering Progress Bar */}
        <div
          style={{
            width: '240px',
            height: '4px',
            borderRadius: '99px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '50%',
              background: 'linear-gradient(90deg, transparent, #ef4444, #ffffff, transparent)',
              borderRadius: '99px',
              animation: 'shimmerLine 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {/* Footer Security Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.68rem',
            color: 'var(--text-3)',
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e' }}>
            <ShieldCheck size={13} /> AES-256-GCM
          </span>
          <span style={{ opacity: 0.3 }}>•</span>
          <span>HMAC-SHA256</span>
          <span style={{ opacity: 0.3 }}>•</span>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>v4rx.me v4</span>
        </div>
      </div>
    </div>
  );
};
