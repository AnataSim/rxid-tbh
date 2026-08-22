import React, { useState, useEffect } from 'react';
import type { Bounty, User } from '../types/bounty';
import { X, Coins, Plus, Trash2, CheckCircle2, Save, UserX, Layers } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EditBountyModalProps {
  bounty: Bounty;
  onClose: () => void;
  onSaveBounty: (bountyId: string, updates: Partial<Bounty>) => Promise<void> | void;
}

export const EditBountyModal: React.FC<EditBountyModalProps> = ({
  bounty, onClose, onSaveBounty,
}) => {
  const [isDualMode, setIsDualMode] = useState<boolean>(Boolean(bounty.isDualReward));
  
  // Single mode state
  const [rewardAmount, setRewardAmount] = useState<string>(String(bounty.reward.amount || 0));
  const [instructions, setInstructions] = useState(bounty.instructions || '');

  // Dual mode state
  const [rewardTier1, setRewardTier1] = useState<string>(String(bounty.rewardTier1 ?? 100));
  const [rewardTier2, setRewardTier2] = useState<string>(String(bounty.rewardTier2 ?? 150));
  const [instructionTier1, setInstructionTier1] = useState<string>(bounty.instructionTier1 || '');
  const [instructionTier2, setInstructionTier2] = useState<string>(bounty.instructionTier2 || '');

  const [rules, setRules] = useState<string[]>(bounty.rules || []);
  const [newRule, setNewRule] = useState('');
  const [tagInput, setTagInput] = useState((bounty.tags || []).filter(t => !['RANKED', 'LOVED', 'GRAVEYARD'].includes(t.toUpperCase())).join(', '));
  const [skillsetInput, setSkillsetInput] = useState((bounty.skillsets || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const [bannedHunters, setBannedHunters] = useState<string[]>(bounty.bannedHunters || []);
  const [bannedUsernames, setBannedUsernames] = useState<string[]>(bounty.bannedUsernames || []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(100));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
        setAllRegisteredUsers(list);
      } catch (err) {
        console.warn('Fetch registered users error in edit modal:', err);
      }
    };
    fetchUsers();
  }, []);

  const parseBpInput = (valStr: string) => {
    let val = valStr.replace(/[^\d]/g, '');
    if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
    if (val === '') val = '0';
    return val;
  };

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRewardAmount(parseBpInput(e.target.value));
  };

  const addBannedUser = (user: User) => {
    if (!bannedHunters.includes(user.id)) {
      setBannedHunters(prev => [...prev, user.id]);
      setBannedUsernames(prev => [...prev, user.username]);
    }
  };

  const removeBannedUser = (userId: string) => {
    const idx = bannedHunters.indexOf(userId);
    if (idx !== -1) {
      setBannedHunters(prev => prev.filter(id => id !== userId));
      setBannedUsernames(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const skillsets = skillsetInput.split(',').map(s => s.trim()).filter(Boolean);

    let finalRewardAmount = 0;
    let finalInstructions = instructions;
    let t1Amount: number | undefined;
    let t2Amount: number | undefined;
    let t1Instr: string | undefined;
    let t2Instr: string | undefined;

    if (isDualMode) {
      t1Amount = Number(rewardTier1) || 0;
      t2Amount = Number(rewardTier2) || 0;
      finalRewardAmount = Math.max(t1Amount, t2Amount);
      t1Instr = instructionTier1;
      t2Instr = instructionTier2;
      finalInstructions = `🟥 Tier 1 (${t1Amount} BP): ${instructionTier1}\n🟩 Tier 2 (${t2Amount} BP): ${instructionTier2}`;
    } else {
      finalRewardAmount = Number(rewardAmount) || 0;
    }

    await onSaveBounty(bounty.id, {
      reward: { ...bounty.reward, amount: finalRewardAmount },
      isDualReward: isDualMode,
      rewardTier1: t1Amount,
      rewardTier2: t2Amount,
      instructionTier1: t1Instr,
      instructionTier2: t2Instr,
      instructions: finalInstructions,
      rules,
      tags: [bounty.beatmap.status.toUpperCase(), ...tags],
      skillsets,
      bannedHunters,
      bannedUsernames,
    });
    setSaving(false);
    onClose();
  };

  const calculatedMaxPool = isDualMode
    ? Math.max(Number(rewardTier1) || 0, Number(rewardTier2) || 0)
    : Number(rewardAmount) || 0;

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

            {/* Dual Mode Toggle Banner */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 'var(--radius)',
              background: isDualMode ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-1)',
              border: `1px solid ${isDualMode ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  padding: 6, borderRadius: 6,
                  background: isDualMode ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg)',
                  color: isDualMode ? '#f87171' : 'var(--text-3)',
                }}>
                  <Layers size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>
                    Dual Reward & Instruction Mode
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                    {isDualMode ? 'ON (2 Hadiah BP: Merah & Hijau, 2 Instruksi)' : 'OFF (1 Hadiah BP: Kuning, 1 Instruksi)'}
                  </div>
                </div>
              </div>

              {/* Custom Switch Toggle */}
              <button
                type="button"
                onClick={() => setIsDualMode(prev => !prev)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 99,
                  border: `1px solid ${isDualMode ? '#4ade80' : 'var(--border)'}`,
                  background: isDualMode ? 'rgba(74, 222, 128, 0.2)' : 'var(--bg)',
                  color: isDualMode ? '#4ade80' : 'var(--text-3)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isDualMode ? '#4ade80' : 'var(--text-3)',
                }} />
                {isDualMode ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* SINGLE REWARD & INSTRUCTION FORM (If OFF) */}
            {!isDualMode ? (
              <>
                <div className="form-group">
                  <label className="form-label"><Coins size={11} /> Reward (BP) - <span style={{ color: 'var(--gold)' }}>Single Tier (Kuning)</span></label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text" inputMode="numeric" required={!isDualMode}
                      value={rewardAmount} onChange={handleRewardChange}
                      className="form-input mono" style={{ paddingRight: 48, color: 'var(--gold)', fontWeight: 700 }}
                    />
                    <span style={{ position: 'absolute', right: 12, fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>
                      BP
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Hunter Instructions</label>
                  <textarea
                    required={!isDualMode} rows={3}
                    value={instructions} onChange={e => setInstructions(e.target.value)}
                    className="form-input"
                  />
                </div>
              </>
            ) : (
              /* DUAL REWARD & INSTRUCTIONS FORM (If ON - Kiri Kanan Side-by-Side) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Left Column: Tier 1 (Red / Merah) */}
                  <div style={{
                    padding: 12, borderRadius: 'var(--radius)',
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    background: 'rgba(248, 113, 113, 0.05)',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
                      Instruksi 1 (Merah / Red)
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: 10, color: '#f87171' }}>Hadiah BP 1 (Merah)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          required={isDualMode}
                          value={rewardTier1}
                          onChange={e => setRewardTier1(parseBpInput(e.target.value))}
                          className="form-input mono"
                          style={{ color: '#f87171', fontWeight: 700, paddingRight: 36, fontSize: 13 }}
                        />
                        <span style={{ position: 'absolute', right: 8, fontSize: 11, fontWeight: 800, color: '#f87171' }}>BP</span>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: 10, color: 'var(--text-2)' }}>Instruksi 1</label>
                      <textarea
                        required={isDualMode} rows={3}
                        value={instructionTier1}
                        onChange={e => setInstructionTier1(e.target.value)}
                        placeholder="e.g. miss 3x"
                        className="form-input"
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Tier 2 (Green / Hijau) */}
                  <div style={{
                    padding: 12, borderRadius: 'var(--radius)',
                    border: '1px solid rgba(74, 222, 128, 0.4)',
                    background: 'rgba(74, 222, 128, 0.05)',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                      Instruksi 2 (Hijau / Green)
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: 10, color: '#4ade80' }}>Hadiah BP 2 (Hijau)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          required={isDualMode}
                          value={rewardTier2}
                          onChange={e => setRewardTier2(parseBpInput(e.target.value))}
                          className="form-input mono"
                          style={{ color: '#4ade80', fontWeight: 700, paddingRight: 36, fontSize: 13 }}
                        />
                        <span style={{ position: 'absolute', right: 8, fontSize: 11, fontWeight: 800, color: '#4ade80' }}>BP</span>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: 10, color: 'var(--text-2)' }}>Instruksi 2</label>
                      <textarea
                        required={isDualMode} rows={3}
                        value={instructionTier2}
                        onChange={e => setInstructionTier2(e.target.value)}
                        placeholder="e.g. ga miss"
                        className="form-input"
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: 11, color: 'var(--gold)', background: 'rgba(234, 179, 8, 0.1)',
                  padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid rgba(234, 179, 8, 0.3)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Coins size={12} />
                  <span>
                    <strong>Total Pool BP requirement:</strong> Max reward value = <strong>{calculatedMaxPool} BP</strong> (diambil dari angka terbesar).
                  </span>
                </div>
              </div>
            )}

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

            {/* Ban Player (Restricted Hunters) */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserX size={12} /> Ban Player (Restricted Hunters)
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                Selected players cannot play or submit proof for this bounty map.
              </div>

              {/* Selected Banned User Pills */}
              {bannedHunters.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {bannedHunters.map((id, index) => (
                    <span
                      key={id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        borderRadius: 99,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      <UserX size={11} />
                      {bannedUsernames[index] || id}
                      <button
                        type="button"
                        onClick={() => removeBannedUser(id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Selector Dropdown */}
              <select
                className="form-input"
                style={{ fontSize: 12 }}
                onChange={e => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const targetUser = allRegisteredUsers.find(u => u.id === selectedId);
                  if (targetUser) addBannedUser(targetUser);
                  e.target.value = '';
                }}
              >
                <option value="">+ Pick a user to ban from this bounty...</option>
                {allRegisteredUsers
                  .filter(u => u.id !== bounty.giver.id && !bannedHunters.includes(u.id))
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.bountyPoints || 100} BP)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={13} />
              {saving ? 'Saving…' : `Save Changes (${calculatedMaxPool} BP)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
