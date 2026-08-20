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

  const bpTiers = [
    { range: '100 – 999 BP', multiplier: 'x1.00', pct: '100%', tag: 'Standard' },
    { range: '1,000 – 1,249 BP', multiplier: 'x0.75', pct: '75%', tag: 'Tier 1' },
    { range: '1,250 – 1,499 BP', multiplier: 'x0.60', pct: '60%', tag: 'Tier 2' },
    { range: '1,500 – 1,699 BP', multiplier: 'x0.45', pct: '45%', tag: 'Tier 3' },
    { range: '1,700 – 1,799 BP', multiplier: 'x0.25', pct: '25%', tag: 'Tier 4' },
    { range: '1,800 – 1,849 BP', multiplier: 'x0.15', pct: '15%', tag: 'High Cap' },
    { range: '1,850+ BP', multiplier: 'x0.80', pct: '80%', tag: 'Platinum Elite' },
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
      <div className="rules-grid" style={{ marginBottom: 24 }}>
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

      {/* BP Recalculation Multiplier Table Card */}
      <div className="rules-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div className="rules-card-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: 'var(--gold)' }}>
            <Trophy size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>BP Award Recalculation Multipliers</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              When a bounty is approved, the awarded BP is scaled based on your current BP range tier.
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}>
          {bpTiers.map((t, i) => (
            <div key={i} style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{t.range}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{t.tag}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  fontWeight: 800,
                  color: t.multiplier === 'x1.00' ? 'var(--green)' : t.multiplier === 'x0.80' ? '#22d3ee' : 'var(--gold)',
                }}>
                  {t.multiplier}
                </span>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>({t.pct})</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
