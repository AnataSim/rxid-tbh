import React, { useState, useEffect } from 'react';
import type { User, Bounty, BeatmapMetadata } from '../types/bounty';
import { fetchBeatmapMetadata } from '../services/osuApi';
import { X, Link as LinkIcon, Coins, Plus, Trash2, CheckCircle2, Sparkles, UserX, Layers, Clock } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CreateBountyModalProps {
  currentUser: User;
  onClose: () => void;
  onCreateBounty: (bounty: Omit<Bounty, 'id' | 'submissions'>) => void;
  isFfaMode?: boolean;
}

export const CreateBountyModal: React.FC<CreateBountyModalProps> = ({
  currentUser, onClose, onCreateBounty, isFfaMode = false,
}) => {
  const [mapUrl, setMapUrl] = useState('');
  
  // Single mode state
  const [rewardAmount, setRewardAmount] = useState<string>('0');
  const [instructions, setInstructions] = useState('');

  // Dual mode toggle & state
  const [isDualMode, setIsDualMode] = useState(false);
  const [rewardTier1, setRewardTier1] = useState<string>('100');
  const [rewardTier2, setRewardTier2] = useState<string>('150');
  const [instructionTier1, setInstructionTier1] = useState('');
  const [instructionTier2, setInstructionTier2] = useState('');

  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [skillsetInput, setSkillsetInput] = useState('');
  const [metadata, setMetadata] = useState<BeatmapMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [restrictSelfSubmit, setRestrictSelfSubmit] = useState(true);
  const [deadlineDays, setDeadlineDays] = useState<string>('');
  const [deadlineHours, setDeadlineHours] = useState<string>('');
  const [deadlineMinutes, setDeadlineMinutes] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(100));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
        setAllRegisteredUsers(list);
      } catch (err) {
        console.warn('Fetch registered users for ban list error:', err);
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

    let finalRewardAmount = 0;
    let finalInstructions = instructions;
    let t1Amount: number | undefined;
    let t2Amount: number | undefined;
    let t1Instr: string | undefined;
    let t2Instr: string | undefined;

    if (isDualMode) {
      t1Amount = Number(rewardTier1) || 0;
      t2Amount = Number(rewardTier2) || 0;
      // Per rules: total pool BP is taken from the HIGHER number (max BP)
      finalRewardAmount = Math.max(t1Amount, t2Amount);
      t1Instr = instructionTier1;
      t2Instr = instructionTier2;
      finalInstructions = `🟥 Tier 1 (${t1Amount} BP): ${instructionTier1}\n🟩 Tier 2 (${t2Amount} BP): ${instructionTier2}`;
    } else {
      finalRewardAmount = Number(rewardAmount) || 0;
    }

    const finalBannedHunters = isFfaMode
      ? (restrictSelfSubmit ? [currentUser.id] : [])
      : bannedUsers.map(u => u.id);

    const finalBannedUsernames = isFfaMode
      ? (restrictSelfSubmit ? [currentUser.username] : [])
      : bannedUsers.map(u => u.username);

    const newBounty: Omit<Bounty, 'id' | 'submissions'> = {
      isFfa: isFfaMode,
      beatmap: metadata,
      giver: { id: currentUser.id, username: currentUser.username, avatarUrl: currentUser.avatarUrl },
      reward: { amount: isFfaMode ? 0 : finalRewardAmount, currency: isFfaMode ? 'FFA' : 'BP' },
      isDualReward: isFfaMode ? false : isDualMode,
      instructions: finalInstructions,
      rules,
      tags: isFfaMode ? ['FFA', metadata.status.toUpperCase(), ...tags.filter(Boolean)] : [metadata.status.toUpperCase(), ...tags.filter(Boolean)],
      skillsets,
      bannedHunters: finalBannedHunters,
      bannedUsernames: finalBannedUsernames,
      status: 'open',
      createdAt: new Date().toISOString(),
      views: 0,
    };

    if (!isFfaMode && isDualMode) {
      if (t1Amount !== undefined) newBounty.rewardTier1 = t1Amount;
      if (t2Amount !== undefined) newBounty.rewardTier2 = t2Amount;
      if (t1Instr) newBounty.instructionTier1 = t1Instr;
      if (t2Instr) newBounty.instructionTier2 = t2Instr;
    }

    const totalMs = (Number(deadlineDays || 0) * 86400000) +
                    (Number(deadlineHours || 0) * 3600000) +
                    (Number(deadlineMinutes || 0) * 60000);
    if (totalMs > 0) {
      newBounty.deadlineAt = new Date(Date.now() + totalMs).toISOString();
    }

    onCreateBounty(newBounty);
    onClose();
  };

  const calculatedMaxPool = isDualMode
    ? Math.max(Number(rewardTier1) || 0, Number(rewardTier2) || 0)
    : Number(rewardAmount) || 0;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-max-md modal-scroll">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isFfaMode ? (
                <>
                  <span style={{ color: '#ff4d8d' }}>🔥</span> Free-For-All (FFA) Quest
                </>
              ) : (
                'Post New Bounty'
              )}
            </div>
            <div className="modal-subtitle">
              {isFfaMode
                ? 'Community Challenge Mode · No BP deduction · All members can post'
                : 'Create an official beatmap challenge for the community'}
            </div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {isFfaMode && (
              <div style={{
                background: 'rgba(255, 77, 141, 0.08)',
                border: '1px solid rgba(255, 77, 141, 0.3)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                fontSize: 11,
                color: '#ff4d8d',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Sparkles size={16} style={{ flexShrink: 0 }} />
                <div>
                  <strong>High-Security FFA Mode:</strong> Everyone can post FFA quests! Newcomers have a <strong>24-hour cooldown</strong> per post. Beatmap is locked once created.
                </div>
              </div>
            )}

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

            {isFfaMode ? (
              <div className="form-group">
                <label className="form-label">Hunter Instructions</label>
                <textarea
                  required rows={3}
                  value={instructions} onChange={e => setInstructions(e.target.value)}
                  placeholder="Describe community challenge rules or goals for this map…"
                  className="form-input"
                />
              </div>
            ) : (
              /* OFFICIAL MODE: Dual Mode Toggle & Single/Dual BP Reward Inputs */
              <>
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
                    {/* Single Reward */}
                    <div className="form-group">
                      <label className="form-label"><Coins size={11} /> Reward (BP) - <span style={{ color: 'var(--gold)' }}>Single Tier (Kuning)</span></label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          required={!isDualMode}
                          value={rewardAmount}
                          onChange={handleRewardChange}
                          className="form-input mono"
                          style={{ paddingRight: 48, color: 'var(--gold)', fontWeight: 700 }}
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

                    {/* Single Instructions */}
                    <div className="form-group">
                      <label className="form-label">Hunter Instructions</label>
                      <textarea
                        required={!isDualMode} rows={3}
                        value={instructions} onChange={e => setInstructions(e.target.value)}
                        placeholder="Describe exactly what hunters need to do…"
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
              </>
            )}

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

            {/* Bounty Deadline / Timer (Days, Hours, Minutes) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171' }}>
                <Clock size={12} /> Bounty Deadline / Timer (Duration)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Days (d)</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={deadlineDays}
                    onChange={e => setDeadlineDays(e.target.value)}
                    placeholder="e.g. 3"
                    className="form-input"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Hours (h)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={deadlineHours}
                    onChange={e => setDeadlineHours(e.target.value)}
                    placeholder="e.g. 12"
                    className="form-input"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Minutes (m)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={deadlineMinutes}
                    onChange={e => setDeadlineMinutes(e.target.value)}
                    placeholder="e.g. 53"
                    className="form-input"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Set custom duration (e.g. 3 Days, 12 Hours, 53 Mins). When deadline expires, status becomes <strong style={{ color: '#f87171' }}>LIMITED</strong>.
              </div>
            </div>

            {/* Self-Participation Restriction (FFA Mode) OR Ban Player (Official Mode) */}
            {isFfaMode ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 'var(--radius)',
                background: restrictSelfSubmit ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-1)',
                border: `1px solid ${restrictSelfSubmit ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    padding: 6, borderRadius: 6,
                    background: restrictSelfSubmit ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg)',
                    color: restrictSelfSubmit ? '#f87171' : 'var(--text-3)',
                  }}>
                    <UserX size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>
                      Self-Participation Restriction
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                      {restrictSelfSubmit
                        ? 'ON (Pembuat quest dilarang submit/join quest ini)'
                        : 'OFF (Pembuat quest diperbolehkan submit/join quest ini)'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRestrictSelfSubmit(prev => !prev)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 99,
                    border: `1px solid ${restrictSelfSubmit ? '#f87171' : 'var(--border)'}`,
                    background: restrictSelfSubmit ? 'rgba(248, 113, 113, 0.2)' : 'var(--bg)',
                    color: restrictSelfSubmit ? '#f87171' : 'var(--text-3)',
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
                    background: restrictSelfSubmit ? '#f87171' : 'var(--text-3)',
                  }} />
                  {restrictSelfSubmit ? 'ON' : 'OFF'}
                </button>
              </div>
            ) : (
              /* Ban Player (Restricted Hunters) for Official Quests */
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserX size={12} /> Ban Player (Restricted Hunters)
                </label>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                  Selected players cannot play or submit proof for this bounty map.
                </div>

                {/* Selected Banned User Pills */}
                {bannedUsers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {bannedUsers.map(u => (
                      <span
                        key={u.id}
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
                        {u.username}
                        <button
                          type="button"
                          onClick={() => setBannedUsers(prev => prev.filter(b => b.id !== u.id))}
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
                    if (targetUser && !bannedUsers.some(b => b.id === targetUser.id)) {
                      setBannedUsers(prev => [...prev, targetUser]);
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="">+ Pick a user to ban from this bounty...</option>
                  {allRegisteredUsers
                    .filter(u => u.id !== currentUser.id && !bannedUsers.some(b => b.id === u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.bountyPoints || 100} BP)
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button
              type="submit" disabled={!metadata}
              className="btn btn-primary"
              style={{ opacity: !metadata ? 0.4 : 1 }}
            >
              <Sparkles size={13} />
              {isFfaMode ? 'Publish FFA Quest (Free 🚀)' : `Publish Bounty (${calculatedMaxPool} BP)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
