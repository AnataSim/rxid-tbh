import React, { useState, useEffect } from 'react';
import type { User, Bounty, BeatmapMetadata } from '../types/bounty';
import { fetchBeatmapMetadata } from '../services/osuApi';
import { X, Link as LinkIcon, Coins, Plus, Trash2, CheckCircle2, Sparkles } from 'lucide-react';

interface CreateBountyModalProps {
  currentUser: User;
  onClose: () => void;
  onCreateBounty: (bounty: Omit<Bounty, 'id' | 'submissions'>) => void;
}

export const CreateBountyModal: React.FC<CreateBountyModalProps> = ({
  currentUser, onClose, onCreateBounty,
}) => {
  const [mapUrl, setMapUrl] = useState('');
  const [rewardAmount, setRewardAmount] = useState<string>('0');
  const [instructions, setInstructions] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [skillsetInput, setSkillsetInput] = useState('');
  const [metadata, setMetadata] = useState<BeatmapMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (/^0\d+/.test(val)) {
      val = val.replace(/^0+/, '');
    }
    if (val === '') val = '0';
    setRewardAmount(val);
  };

  useEffect(() => {
    if (!mapUrl) return;
    const t = setTimeout(async () => {
      setLoading(true);
      setMetadata(await fetchBeatmapMetadata(mapUrl));
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [mapUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadata) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const skillsets = skillsetInput.split(',').map(s => s.trim()).filter(Boolean);
    onCreateBounty({
      beatmap: metadata,
      giver: { id: currentUser.id, username: currentUser.username, avatarUrl: currentUser.avatarUrl },
      reward: { amount: Number(rewardAmount) || 0, currency: 'BP' },
      instructions, rules,
      tags: [metadata.status.toUpperCase(), ...tags.filter(Boolean)],
      skillsets,
      status: 'open',
      createdAt: new Date().toISOString(),
      views: 0,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-max-md modal-scroll">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Post New Bounty</div>
            <div className="modal-subtitle">Create a beatmap challenge for the community</div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Map URL */}
            <div className="form-group">
              <label className="form-label">
                <LinkIcon size={11} /> osu! Beatmapset URL
              </label>
              <input
                type="text" required
                value={mapUrl} onChange={e => setMapUrl(e.target.value)}
                placeholder="https://osu.ppy.sh/beatmapsets/..."
                className="form-input"
              />
            </div>

            {/* Preview */}
            {loading && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                Fetching beatmap…
              </div>
            )}
            {!loading && metadata && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 'var(--radius)',
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>
                <img
                  src={metadata.cardUrl || metadata.coverUrl}
                  alt={metadata.title}
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="label label-ranked" style={{ fontSize: 10 }}>{metadata.status}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>★ {metadata.starRating}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{metadata.durationFormatted}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{metadata.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Mapped by {metadata.mapper}</div>
                </div>
                <span className="label label-open" style={{ flexShrink: 0 }}>✓ Valid</span>
              </div>
            )}

            {/* Reward */}
            <div className="form-group">
              <label className="form-label"><Coins size={11} /> Reward (BP)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={rewardAmount}
                  onChange={handleRewardChange}
                  className="form-input mono"
                  style={{ paddingRight: 48 }}
                />
                <span style={{
                  position: 'absolute',
                  right: 12,
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--gold)',
                  fontFamily: 'var(--mono)',
                  pointerEvents: 'none',
                }}>
                  BP
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="form-group">
              <label className="form-label">Hunter Instructions</label>
              <textarea
                required rows={3}
                value={instructions} onChange={e => setInstructions(e.target.value)}
                placeholder="Describe exactly what hunters need to do…"
                className="form-input"
              />
            </div>

            {/* Rules */}
            <div className="form-group">
              <label className="form-label">Rule Checklist</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                {rules.map((r, i) => (
                  <div key={i} className="rule-item-removable">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      {r}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRules(rules.filter((_, j) => j !== i))}
                      className="btn btn-icon btn-sm"
                      style={{ width: 22, height: 22, flexShrink: 0 }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text" value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newRule.trim()) { setRules([...rules, newRule.trim()]); setNewRule(''); }
                    }
                  }}
                  placeholder="Add rule…"
                  className="form-input"
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { if (newRule.trim()) { setRules([...rules, newRule.trim()]); setNewRule(''); } }}
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                type="text" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="HDDT, FC, 99% Acc"
                className="form-input"
              />
            </div>

            {/* Skillset */}
            <div className="form-group">
              <label className="form-label">Skillset (comma separated)</label>
              <input
                type="text" value={skillsetInput}
                onChange={e => setSkillsetInput(e.target.value)}
                placeholder="e.g. Aim, Jump, Stream, Reading, Stamina"
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button
              type="submit" disabled={!metadata}
              className="btn btn-primary"
              style={{ opacity: !metadata ? 0.4 : 1 }}
            >
              <Sparkles size={13} />
              Publish Bounty
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
