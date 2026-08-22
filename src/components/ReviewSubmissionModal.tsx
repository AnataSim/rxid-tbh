import React, { useState } from 'react';
import type { Bounty, Submission } from '../types/bounty';
import { X, CheckCircle, XCircle, ExternalLink, ShieldCheck, Coins, FileText, CheckCircle2, AlertOctagon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ReviewSubmissionModalProps {
  bounty: Bounty;
  onClose: () => void;
  onApprove: (bountyId: string, subId: string, hunterId?: string, beatmapTitle?: string, rewardAmount?: number, selectedTier?: 1 | 2, poa?: number) => void;
  onReject: (bountyId: string, subId: string, reason: string, hunterId?: string, beatmapTitle?: string) => void;
  onDeleteSubmission?: (bountyId: string, subId: string) => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  bounty, onClose, onApprove, onReject, onDeleteSubmission,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'approval' | 'log'>('approval');
  const [rejectId, setRejectId]   = useState<string | null>(null);
  const [reason, setReason]       = useState('');
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [localTierMap, setLocalTierMap]     = useState<Record<string, 1 | 2>>({});
  const [localAwardedBpMap, setLocalAwardedBpMap] = useState<Record<string, number>>({});
  const [deletedIds, setDeletedIds]         = useState<Set<string>>(new Set());
  const [logImagePreview, setLogImagePreview] = useState<string | null>(null);

  // PoA (Point of Appreciation) bonus map per submission ID
  const [poaMap, setPoaMap] = useState<Record<string, string>>({});

  const handleDelete = (subId: string) => {
    setDeletedIds(prev => new Set(prev).add(subId));
    if (onDeleteSubmission) {
      onDeleteSubmission(bounty.id, subId);
    }
  };

  // Compute pending approvals (excluding locally approved/rejected/deleted items)
  const pending = bounty.submissions.filter(s =>
    s.status === 'pending' && !localStatusMap[s.id] && !deletedIds.has(s.id)
  );

  // Compute logs (includes items marked approved/rejected locally or in Firestore, excluding deleted)
  const logs = bounty.submissions.filter(s =>
    (s.status !== 'pending' || localStatusMap[s.id]) && !deletedIds.has(s.id)
  ).map(s => ({
    ...s,
    status: localStatusMap[s.id] || s.status,
    awardedTier: localTierMap[s.id] || s.awardedTier,
    awardedBp: localAwardedBpMap[s.id] !== undefined ? localAwardedBpMap[s.id] : s.awardedBp,
  }));

  const handleConfirmApprove = (sub: Submission, selectedTier?: 1 | 2, tierAmount?: number) => {
    setLocalStatusMap(prev => ({ ...prev, [sub.id]: 'approved' }));
    if (selectedTier) {
      setLocalTierMap(prev => ({ ...prev, [sub.id]: selectedTier }));
    }
    const baseReward = tierAmount !== undefined ? tierAmount : bounty.reward.amount;
    const poaVal = Number(poaMap[sub.id]) || 0;
    const expectedBp = baseReward + poaVal;
    setLocalAwardedBpMap(prev => ({ ...prev, [sub.id]: expectedBp }));

    onApprove(bounty.id, sub.id, sub.hunterId, bounty.beatmap.title, baseReward, selectedTier, poaVal);
  };

  const handleConfirmReject = (sub: Submission, rejectReason: string) => {
    setLocalStatusMap(prev => ({ ...prev, [sub.id]: 'rejected' }));
    onReject(bounty.id, sub.id, rejectReason, sub.hunterId, bounty.beatmap.title);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-max-md modal-scroll">
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
          <div>
            <div className="modal-title">Review Submissions</div>
            <div className="modal-subtitle">{bounty.beatmap.title}</div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Menu Tabs: Approval vs Log */}
        <div style={{
          display: 'flex', gap: 8, padding: '12px 20px',
          borderBottom: '1px solid var(--border)', background: 'var(--bg-1)',
        }}>
          <button
            onClick={() => setActiveTab('approval')}
            className={`btn btn-sm ${activeTab === 'approval' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}
          >
            <ShieldCheck size={13} />
            Approval ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`btn btn-sm ${activeTab === 'log' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}
          >
            <FileText size={13} />
            Log ({logs.length})
          </button>
        </div>

        <div className="modal-body">
          {/* Context Reward Pill */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg)', border: '1px solid var(--border)',
            marginBottom: 16, fontSize: 12,
          }}>
            <span style={{ color: 'var(--text-2)' }}>Reward per approval</span>
            {bounty.isDualReward ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>
                <Coins size={12} style={{ color: 'var(--gold)' }} />
                <span style={{ color: '#f87171' }}>🟥 {(bounty.rewardTier1 ?? 100).toLocaleString()} BP</span>
                <span style={{ color: 'var(--text-3)' }}>/</span>
                <span style={{ color: '#4ade80' }}>🟩 {(bounty.rewardTier2 ?? 150).toLocaleString()} BP</span>
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--gold)' }}>
                <Coins size={12} />
                {bounty.reward.amount.toLocaleString()} {bounty.reward.currency}
              </span>
            )}
          </div>

          {/* TAB 1: APPROVAL (Pending Items Only) */}
          {activeTab === 'approval' && (
            <div>
              {pending.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 16px',
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
                  color: 'var(--text-3)', fontSize: 13,
                }}>
                  <ShieldCheck size={28} style={{ margin: '0 auto 10px', color: 'var(--green)', display: 'block' }} />
                  All pending approvals have been reviewed! 🎉
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pending.map(sub => {
                    const currentPoa = Number(poaMap[sub.id]) || 0;
                    const rbpTier1 = (bounty.rewardTier1 ?? 100) + currentPoa;
                    const rbpTier2 = (bounty.rewardTier2 ?? 150) + currentPoa;
                    const rbpSingle = bounty.reward.amount + currentPoa;

                    return (
                      <div key={sub.id} className="anim-in" style={{
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden', background: 'var(--bg)',
                      }}>
                        {/* Sub header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderBottom: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={sub.hunterAvatar} alt={sub.hunterUsername}
                              style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{sub.hunterUsername}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                                {new Date(sub.submittedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="sub-status sub-status-pending">Pending</span>
                            {onDeleteSubmission && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDelete(sub.id);
                                }}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: 'var(--red)',
                                  cursor: 'pointer', padding: '3px 6px', borderRadius: 4, display: 'flex',
                                }}
                                title="Delete submission"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Comment */}
                        {sub.comment && (
                          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' }}>
                            "{sub.comment}"
                          </div>
                        )}

                        {/* Image Preview */}
                        <a
                          href={sub.proofImageUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', position: 'relative', overflow: 'hidden' }}
                        >
                          <img src={sub.proofImageUrl} alt="Proof"
                            style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                          <div style={{
                            position: 'absolute', bottom: 8, right: 8,
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 4,
                            background: 'rgba(0,0,0,0.65)', fontSize: 10, color: '#aaa',
                          }}>
                            Open full <ExternalLink size={9} />
                          </div>
                        </a>

                        {/* Replay Link */}
                        {sub.replayUrl && (
                          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)' }}>
                            Replay:{' '}
                            <a href={sub.replayUrl} target="_blank" rel="noopener noreferrer"
                              style={{ color: 'var(--blue)', textDecoration: 'underline', fontFamily: 'var(--mono)' }}>
                              {sub.replayUrl}
                            </a>
                          </div>
                        )}

                        {/* Anti-Self Approval Guard / Reject Form / Approve Actions */}
                        {Boolean(currentUser && (sub.hunterId === currentUser.id || sub.hunterUsername?.toLowerCase() === currentUser.username?.toLowerCase())) ? (
                          <div style={{
                            padding: '12px 14px', borderTop: '1px solid var(--border)',
                            background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #f87171',
                            color: '#f87171', fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <AlertOctagon size={18} style={{ flexShrink: 0 }} />
                            <div>
                              <div>Anti-Abuse Security Guard 🚫</div>
                              <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.4 }}>
                                Anda mengunggah submission ini sebagai player. Anda tidak dapat menyetujui/menolak skor Anda sendiri — diperlukan <strong>BG lain</strong> untuk mereview submission ini.
                              </div>
                            </div>
                          </div>
                        ) : rejectId === sub.id ? (
                          <div style={{
                            padding: '12px 14px', borderTop: '1px solid var(--border)',
                            background: 'var(--red-dim)', display: 'flex', flexDirection: 'column', gap: 8,
                          }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)' }}>Rejection reason:</label>
                            <input
                              type="text" value={reason} onChange={e => setReason(e.target.value)}
                              placeholder="e.g. Accuracy below 98.5%…"
                              className="form-input" style={{ fontSize: 12 }}
                            />
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setRejectId(null)}>Cancel</button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  handleConfirmReject(sub, reason || 'Did not meet requirements');
                                  setRejectId(null); setReason('');
                                }}
                              >
                                <XCircle size={12} /> Confirm Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px',
                            borderTop: '1px solid var(--border)',
                          }}>
                            {/* Point of Appreciation (PoA) Input Field */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px', background: 'rgba(234, 179, 8, 0.08)',
                              border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 'var(--radius)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>
                                <Sparkles size={13} />
                                Point of Appreciation (PoA)
                                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>(Optional Bonus BP)</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>+</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={poaMap[sub.id] || ''}
                                  onChange={e => {
                                    const val = e.target.value.replace(/[^\d]/g, '');
                                    setPoaMap(prev => ({ ...prev, [sub.id]: val }));
                                  }}
                                  placeholder="0"
                                  className="form-input mono"
                                  style={{
                                    width: 64, padding: '3px 6px', fontSize: 12, height: 26,
                                    textAlign: 'center', color: 'var(--gold)', fontWeight: 800,
                                    borderColor: currentPoa > 0 ? 'var(--gold)' : undefined,
                                  }}
                                />
                                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)' }}>BP</span>
                              </div>
                            </div>

                            {bounty.isDualReward ? (
                              /* DUAL APPROVAL BUTTONS (RED VS GREEN) */
                              <div style={{ display: 'flex', gap: 8 }}>
                                {/* RED TIER BUTTON */}
                                <button
                                  type="button"
                                  className="btn"
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px 10px',
                                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.35))',
                                    border: '1px solid rgba(239, 68, 68, 0.6)',
                                    color: '#ffffff',
                                    borderRadius: 'var(--radius)',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleConfirmApprove(sub, 1, bounty.rewardTier1 || 100)}
                                  title={bounty.instructionTier1 ? `Instruksi Merah: ${bounty.instructionTier1}` : 'Approve Tier 1'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                                    <CheckCircle size={14} color="#f87171" />
                                    Approve Merah ({rbpTier1.toLocaleString()} BP)
                                  </div>
                                  <div style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.85)',
                                    marginTop: 4,
                                    lineHeight: 1.3,
                                    textAlign: 'center',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    maxWidth: '100%',
                                  }}>
                                    {currentPoa > 0 ? `(Base ${bounty.rewardTier1 ?? 100} + ${currentPoa} PoA)` : bounty.instructionTier1 ? `"${bounty.instructionTier1}"` : 'Tier 1'}
                                  </div>
                                </button>

                                {/* GREEN TIER BUTTON */}
                                <button
                                  type="button"
                                  className="btn"
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px 10px',
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.35))',
                                    border: '1px solid rgba(34, 197, 94, 0.6)',
                                    color: '#ffffff',
                                    borderRadius: 'var(--radius)',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleConfirmApprove(sub, 2, bounty.rewardTier2 || 150)}
                                  title={bounty.instructionTier2 ? `Instruksi Hijau: ${bounty.instructionTier2}` : 'Approve Tier 2'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                                    <CheckCircle size={14} color="#4ade80" />
                                    Approve Hijau ({rbpTier2.toLocaleString()} BP)
                                  </div>
                                  <div style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.85)',
                                    marginTop: 4,
                                    lineHeight: 1.3,
                                    textAlign: 'center',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    maxWidth: '100%',
                                  }}>
                                    {currentPoa > 0 ? `(Base ${bounty.rewardTier2 ?? 150} + ${currentPoa} PoA)` : bounty.instructionTier2 ? `"${bounty.instructionTier2}"` : 'Tier 2'}
                                  </div>
                                </button>

                                {/* REJECT BUTTON */}
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  style={{ flexShrink: 0 }}
                                  onClick={() => setRejectId(sub.id)}
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </div>
                            ) : (
                              /* SINGLE TIER APPROVAL BUTTON */
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className="btn btn-success"
                                  style={{ flex: 1, fontSize: 13 }}
                                  onClick={() => handleConfirmApprove(sub)}
                                >
                                  <CheckCircle size={14} />
                                  Approve & Pay {rbpSingle.toLocaleString()} BP
                                  {currentPoa > 0 ? ` (${bounty.reward.amount} + ${currentPoa} PoA)` : ''}
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => setRejectId(sub.id)}>
                                  <XCircle size={13} /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOG (Historical Audit Log of Approved & Rejected Submissions) */}
          {activeTab === 'log' && (
            <div>
              {logs.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 16px',
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
                  color: 'var(--text-3)', fontSize: 13,
                }}>
                  <FileText size={28} style={{ margin: '0 auto 10px', color: 'var(--text-3)', display: 'block' }} />
                  No submission logs available yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {logs.map(sub => {
                    const isApproved = sub.status === 'approved';

                    return (
                      <div key={sub.id} style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius)',
                        border: `1px solid ${isApproved ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                        background: isApproved ? 'rgba(74, 222, 128, 0.04)' : 'rgba(248, 113, 113, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={sub.hunterAvatar} alt={sub.hunterUsername}
                              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{sub.hunterUsername}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                                {new Date(sub.submittedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge & Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isApproved ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: sub.awardedTier === 1 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(34, 197, 94, 0.18)',
                                  border: `1px solid ${sub.awardedTier === 1 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)'}`,
                                  color: sub.awardedTier === 1 ? '#f87171' : '#4ade80',
                                  padding: '4px 10px',
                                  borderRadius: 99,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                <CheckCircle2 size={12} />
                                APPROVED {sub.awardedTier === 1 ? '(Merah)' : sub.awardedTier === 2 ? '(Hijau)' : ''}
                                (+{sub.awardedBp !== undefined ? sub.awardedBp : (sub.awardedTier === 1 ? bounty.rewardTier1 || 100 : sub.awardedTier === 2 ? bounty.rewardTier2 || 150 : bounty.reward.amount)} {bounty.reward.currency}
                                {sub.bpMultiplier !== undefined && sub.bpMultiplier !== 1.0 ? ` [${sub.bpMultiplier}x]` : ''}
                                {sub.poa !== undefined && sub.poa > 0 ? ` +${sub.poa} PoA ✨` : ''})
                              </span>
                            ) : (
                              <span className="sub-status sub-status-rejected" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertOctagon size={11} /> Rejected
                              </span>
                            )}
                            {onDeleteSubmission && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDelete(sub.id);
                                }}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: 'var(--red)',
                                  cursor: 'pointer', padding: '3px 6px', borderRadius: 4, display: 'flex',
                                }}
                                title="Delete submission"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Rejection Reason */}
                        {!isApproved && sub.rejectionReason && (
                          <div style={{ fontSize: 11, color: 'var(--red)', background: 'rgba(248, 113, 113, 0.1)', padding: '6px 10px', borderRadius: 4 }}>
                            Reason: {sub.rejectionReason}
                          </div>
                        )}

                        {/* Comment */}
                        {sub.comment && (
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            Comment: "{sub.comment}"
                          </div>
                        )}

                        {/* Action: View Proof Image (No Inline Full Image) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {sub.replayUrl ? `Replay: ${sub.replayUrl}` : 'Image proof attached'}
                          </div>
                          <button
                            onClick={() => setLogImagePreview(sub.proofImageUrl)}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 11, gap: 4 }}
                          >
                            <ExternalLink size={11} /> View Proof Image
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modal Image Lightbox Preview for Log Tab */}
          {logImagePreview && (
            <div className="modal-overlay" style={{ zIndex: 999 }} onClick={() => setLogImagePreview(null)}>
              <div className="modal modal-max-sm" style={{ padding: 12, background: '#000000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Proof Image Preview</span>
                  <button className="btn btn-icon btn-sm" onClick={() => setLogImagePreview(null)}><X size={14} /></button>
                </div>
                <img
                  src={logImagePreview}
                  alt="Proof Full"
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                />
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <a href={logImagePreview} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                    Open Original <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
