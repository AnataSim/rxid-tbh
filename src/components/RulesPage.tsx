import { ShieldAlert, CheckCircle2, Users, Trophy } from 'lucide-react';

export const RulesPage: React.FC = () => {
  const giverRules = [
    { title: 'Valid osu! Beatmap Link', body: 'Must provide an official osu! beatmap URL (osu.ppy.sh/beatmapsets/…).' },
    { title: 'Non-refundable Bounty Pool', body: 'Once posted, vPoints are locked into escrow until claimed or expired.' },
    { title: 'Clear Requirements', body: 'Mods allowed, target rank, or acc targets must be explicitly specified.' },
    { title: 'Proof Verification', body: 'Must review submitted hunter proof. If rejected without valid cause, points are auto-approved.' },
  ];

  const hunterRules = [
    { title: 'Relax Mods Allowed', body: 'Relax mods (RX) are allowed for bounty challenges. External cheats remain prohibited.' },
    { title: 'Strict Mod & Requirement Match', body: 'Hunter plays must strictly match all mods and target requirements specified by the Bounty Giver (BG).' },
    { title: 'Required Media Proof', body: 'Upload a clear result screen screenshot or a valid .osr replay link.' },
    { title: 'Guaranteed Payout', body: 'Once approved, BP are transferred immediately. No reversals.' },
  ];

  return (
    <div className="anim-in" style={{ maxWidth: 820, margin: '0 auto', paddingTop: 32, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="merah-putih-neon-box" style={{ width: 34, height: 34 }}>
            <Trophy size={18} color="#ef4444" />
          </div>
          <h1 className="page-title">Rules & Conduct</h1>
        </div>
        <p className="page-sub">
          Fair play and verified proof required for all bounty payouts.
        </p>
      </div>

      {/* Cards */}
      <div className="rules-grid">
        {/* Givers */}
        <div className="rules-card">
          <div className="rules-card-head">
            <div className="rules-card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              <Users size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>For Bounty Givers</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>BG</div>
            </div>
          </div>
          <div className="rules-card-body">
            {giverRules.map((r, i) => (
              <div key={i} className="rules-rule-item">
                <div className="rules-check" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  <CheckCircle2 size={9} />
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 12 }}>{r.title}. </span>
                  {r.body}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hunters */}
        <div className="rules-card">
          <div className="rules-card-head">
            <div className="rules-card-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
              <ShieldAlert size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>For Bounty Hunters</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>TBH</div>
            </div>
          </div>
          <div className="rules-card-body">
            {hunterRules.map((r, i) => (
              <div key={i} className="rules-rule-item">
                <div className="rules-check" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                  <CheckCircle2 size={9} />
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 12 }}>{r.title}. </span>
                  {r.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
