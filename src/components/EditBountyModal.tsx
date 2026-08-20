import React, { useState } from 'react';
import type { Bounty } from '../types/bounty';
import { X, Coins, Plus, Trash2, CheckCircle2, Save } from 'lucide-react';

interface EditBountyModalProps {
  bounty: Bounty;
  onClose: () => void;
  onSaveBounty: (bountyId: string, updates: Partial<Bounty>) => Promise<void> | void;
}

export const EditBountyModal: React.FC<EditBountyModalProps> = ({
  bounty, onClose, onSaveBounty,
}) => {
  const [rewardAmount, setRewardAmount] = useState<string>(String(bounty.reward.amount || 0));
  const [instructions, setInstructions] = useState(bounty.instructions || '');
  const [rules, setRules] = useState<string[]>(bounty.rules || []);
  const [newRule, setNewRule] = useState('');
  const [tagInput, setTagInput] = useState((bounty.tags || []).filter(t => !['RANKED', 'LOVED', 'GRAVEYARD'].includes(t.toUpperCase())).join(', '));
  const [skillsetInput, setSkillsetInput] = useState((bounty.skillsets || []).join(', '));
  const [saving, setSaving] = useState(false);

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
    if (val === '') val = '0';
    setRewardAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const skillsets = skillsetInput.split(',').map(s => s.trim()).filter(Boolean);

    await onSaveBounty(bounty.id, {
      reward: { ...bounty.reward, amount: Number(rewardAmount) || 0 },
      instructions,
      rules,
      tags: [bounty.beatmap.status.toUpperCase(), ...tags],
      skillsets,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-max-md modal-scroll">
        <div className="modal-header">
          <div>
            <div className="modal-title">Edit Bounty</div>
            <div className="modal-subtitle">Update details for {bounty.beatmap.title}</div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Beatmap Header Card */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 'var(--radius)',
              background: 'var(--bg)', border: '1px solid var(--border)',
            }}>
              <img
                src={bounty.beatmap.cardUrl || bounty.beatmap.coverUrl}
                alt={bounty.beatmap.title}
                style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{bounty.beatmap.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Mapped by {bounty.beatmap.mapper}</div>
              </div>
            </div>

            {/* Reward (BP) */}
            <div className="form-group">
              <label className="form-label"><Coins size={11} /> Reward (BP)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text" inputMode="numeric" required
                  value={rewardAmount} onChange={handleRewardChange}
                  className="form-input mono" style={{ paddingRight: 48 }}
                />
                <span style={{ position: 'absolute', right: 12, fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>
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
                className="form-input"
              />
            </div>

            {/* Rule Checklist */}
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
                      type="button" onClick={() => setRules(rules.filter((_, j) => j !== i))}
                      className="btn btn-icon btn-sm" style={{ width: 22, height: 22 }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text" value={newRule} onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newRule.trim()) { setRules([...rules, newRule.trim()]); setNewRule(''); }
                    }
                  }}
                  placeholder="Add rule…" className="form-input" style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  type="button" className="btn btn-ghost btn-sm"
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
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={13} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
