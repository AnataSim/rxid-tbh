import React, { useState, useEffect } from 'react';
import type { Bounty, User, Submission } from '../types/bounty';
import { normalizeAvatarUrl } from '../services/authService';
import {
  X, Star, Clock, Play, RefreshCw, Trash2, Pencil,
  ExternalLink, ShieldCheck, Upload, Coins, Calendar, Trophy, UserX
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DifficultyRatingSection } from './DifficultyRatingSection';

interface BountyDetailModalProps {
  bounty: Bounty | null;
  currentUser: User;
  onClose: () => void;
  onOpenSubmitProof: (bounty: Bounty) => void;
  onOpenReview: (bounty: Bounty) => void;
  onDeleteSubmission?: (bountyId: string, subId: string) => void;
  onRateDifficulty?: (bountyId: string, rating: number) => void;
  onDeleteBounty?: (bountyId: string) => void;
  onEditBounty?: (bounty: Bounty) => void;
}

export const BountyDetailModal: React.FC<BountyDetailModalProps> = ({
  bounty, currentUser, onClose, onOpenSubmitProof, onOpenReview, onDeleteSubmission, onRateDifficulty, onDeleteBounty, onEditBounty,
}) => {
  const { activeRole } = useAuth();
  if (!bounty) return null;
  const { beatmap, giver, reward, instructions, rules, tags } = bounty;
  const isCreator = currentUser.id === giver.id;
  const isGiver = bounty.isFfa ? isCreator : (isCreator || activeRole === 'bounty_giver');
  const isBanned = Boolean(
    (bounty.bannedHunters && bounty.bannedHunters.includes(currentUser.id)) ||
    (bounty.bannedUsernames && bounty.bannedUsernames.some(u => u.toLowerCase() === (currentUser.username || '').toLowerCase()))
  );

  const [subsList, setSubsList] = useState<Submission[]>(bounty.submissions || []);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSubsList(bounty.submissions || []);
  }, [bounty.submissions]);

  const handleRefreshSubmissions = async () => {
    setRefreshing(true);
    try {
      const snap = await getDocs(collection(db, 'bounties', bounty.id, 'submissions'));
      const fresh: Submission[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Submission, 'id'>),
      }));
      setSubsList(fresh);
    } catch (err) {
      console.warn('Refresh submissions error:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleDeleteSub = (subId: string) => {
    setSubsList(prev => prev.filter(s => s.id !== subId));
    if (onDeleteSubmission) {
      onDeleteSubmission(bounty.id, subId);
    }
  };

  const pending = subsList.filter(s => s.status === 'pending');

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-max-lg modal-scroll">
        {/* Top Right Action Buttons (Edit & Delete for Giver & Close) */}
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isGiver && onEditBounty && (
            <button
              type="button"
              onClick={() => onEditBounty(bounty)}
              className="btn btn-icon btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                cursor: 'pointer',
              }}
              title="Edit Bounty"
            >
              <Pencil size={14} />
            </button>
          )}
          {isGiver && onDeleteBounty && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the bounty for "${beatmap.title}"?`)) {
                  onDeleteBounty(bounty.id);
                  onClose();
                }
              }}
              className="btn btn-icon btn-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: 'var(--red)',
                cursor: 'pointer',
              }}
              title="Delete Bounty"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="btn btn-icon"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Banner */}
        <div className="detail-banner">
          <div
            className="detail-banner-bg"
            style={{ backgroundImage: `url(${beatmap.coverUrl})` }}
          />
          <div className="detail-banner-overlay" />
          <div className="detail-banner-content">
            <img
              className="detail-thumb"
              src={beatmap.cardUrl || beatmap.coverUrl}
              alt={beatmap.title}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://assets.ppy.sh/beatmaps/2275685/covers/card@2x.jpg';
              }}
            />
            <div className="detail-info">
              {/* Tags row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <span className={`label ${beatmap.status.toLowerCase() === 'loved' ? 'label-loved' : 'label-ranked'}`}>
                  <Trophy size={9} style={{ display: 'inline', marginRight: 2 }} />
                  {beatmap.status}
                </span>
                {bounty.isDualReward ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 4,
                    background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
                  }}>
                    <Coins size={10} style={{ color: 'var(--gold)' }} />
                    <span style={{ color: '#f87171' }}>{(bounty.rewardTier1 ?? 0).toLocaleString()}</span>
                    <span style={{ color: 'var(--text-3)' }}>/</span>
                    <span style={{ color: '#4ade80' }}>{(bounty.rewardTier2 ?? 0).toLocaleString()}</span>
                    <span style={{ color: 'var(--text-3)', fontSize: 10 }}>BP</span>
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(232,160,32,0.15)', color: 'var(--gold)',
                    fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                  }}>
                    <Coins size={9} />
                    {reward.amount.toLocaleString()} {reward.currency}
                  </span>
                )}
                {tags.slice(0, 3).map((t, i) => (
                  <span key={i} className="label label-tag">{t}</span>
                ))}
              </div>

              <div className="detail-title">{beatmap.title}</div>
              <div className="detail-artist">
                {beatmap.artist} · mapped by{' '}
                <a
                  href={`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapsetId}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  {beatmap.mapper}
                </a>
                {' '}· bounty by <span style={{ color: 'var(--text-1)' }}>{giver.username}</span>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              <span className="stat-mini"><span className="star-val">{beatmap.starRating.toFixed(2)}</span><Star size={9} fill="currentColor" color="#93b4ff" /></span>
              <span className="stat-mini"><Clock size={9} />{beatmap.durationFormatted}</span>
              <span className="stat-mini"><Play size={9} />{beatmap.playCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dates */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> Posted {beatmap.postedDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> Updated {beatmap.updatedDate}
            </span>
          </div>

          {/* Mission Instructions */}
          <div>
            <div className="section-label">Mission Instructions</div>
            {(() => {
              const isDual = Boolean(
                bounty.isDualReward ||
                (bounty.instructionTier1 && bounty.instructionTier2) ||
                (instructions && (instructions.includes('🟩 Tier 2') || instructions.includes('Tier 2 (')))
              );

              if (isDual) {
                let t1Text = bounty.instructionTier1;
                let t2Text = bounty.instructionTier2;

                if (!t1Text && !t2Text && instructions) {
                  if (instructions.includes('🟩 Tier 2')) {
                    const parts = instructions.split('🟩 Tier 2');
                    t1Text = parts[0].replace(/^🟥\s*Tier\s*1\s*\([^)]+\):\s*/i, '').trim();
                    t2Text = ('Tier 2 ' + parts[1]).replace(/^Tier\s*2\s*\([^)]+\):\s*/i, '').trim();
                  } else {
                    t1Text = instructions;
                  }
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Red Tier Card (Top) */}
                    <div style={{
                      padding: '12px 14px', borderRadius: 'var(--radius)',
                      background: 'rgba(248, 113, 113, 0.06)',
                      border: '1px solid rgba(248, 113, 113, 0.35)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
                          Tier 1 Instruction (Red)
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#f87171', fontFamily: 'var(--mono)' }}>
                          {(bounty.rewardTier1 ?? 0).toLocaleString()} BP
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {t1Text || instructions}
                      </div>
                    </div>

                    {/* Green Tier Card (Bottom / Dikebawahin) */}
                    <div style={{
                      padding: '12px 14px', borderRadius: 'var(--radius)',
                      background: 'rgba(74, 222, 128, 0.06)',
                      border: '1px solid rgba(74, 222, 128, 0.35)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                          Tier 2 Instruction (Green)
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#4ade80', fontFamily: 'var(--mono)' }}>
                          {(bounty.rewardTier2 ?? 0).toLocaleString()} BP
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {t2Text || instructions}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div style={{
                  padding: '12px 14px', borderRadius: 'var(--radius)',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {instructions}
                </div>
              );
            })()}
          </div>

          {/* Rules */}
          {rules && rules.length > 0 && (
            <div>
              <div className="section-label">Requirements</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                {rules.map((r, i) => (
                  <div key={i} className="rule-item">
                    <div className="rule-dot" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Submissions</span>
                <span className="sub-status sub-status-pending" style={{ fontSize: 10 }}>
                  {subsList.length} total
                </span>
                {pending.length > 0 && (
                  <span className="sub-status sub-status-pending">
                    {pending.length} pending
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleRefreshSubmissions}
                  className="btn btn-ghost btn-sm"
                  style={{ gap: 4, fontSize: 11 }}
                  title="Refresh submissions list"
                >
                  <RefreshCw
                    size={12}
                    style={{
                      animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                    }}
                  />
                  Refresh
                </button>
                {isGiver && pending.length > 0 && (
                  <button
                    onClick={() => onOpenReview(bounty)}
                    className="btn btn-subtle btn-sm"
                  >
                    <ShieldCheck size={12} /> Review
                  </button>
                )}
              </div>
            </div>

            {subsList.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '28px 16px',
                background: 'var(--bg)', border: '1px dashed var(--border)',
                borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-3)',
              }}>
                No submissions yet — be the first to claim! 🎯
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {subsList.map(sub => (
                  <div key={sub.id} className="sub-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        src={normalizeAvatarUrl(sub.hunterAvatar, sub.hunterUsername)}
                        alt={sub.hunterUsername}
                        style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }}
                        onError={e => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(sub.hunterUsername)}&bold=true`;
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{sub.hunterUsername}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{sub.comment}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={sub.proofImageUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--blue)' }}>
                        Proof <ExternalLink size={10} />
                      </a>
                      <span className={`sub-status sub-status-${sub.status}`}>{sub.status}</span>
                      {isGiver && onDeleteSubmission && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteSub(sub.id);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: 'var(--red)',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 4,
                          }}
                          title="Delete submission"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Rating Section (Below Submissions) */}
          <DifficultyRatingSection
            currentRating={bounty.avgDifficulty || 0}
            userRating={bounty.difficultyRatings?.[currentUser?.id]}
            onRate={(val) => onRateDifficulty && onRateDifficulty(bounty.id, val)}
          />

          {/* Ban Warning Banner (If Current Hunter is Banned) */}
          {isBanned && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius)',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <UserX size={16} />
              <span>You have been restricted by the Bounty Giver from playing or submitting proof to this quest.</span>
            </div>
          )}

          {/* Actions Bar */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            borderTop: '1px solid var(--border)', paddingTop: 16,
          }}>
            {/* Bottom Primary Submit / Review Action Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {isGiver ? (
                !isBanned ? (
                  <>
                    <button
                      onClick={() => onOpenSubmitProof(bounty)}
                      className="btn btn-primary btn-lg"
                      style={{ flex: 1 }}
                    >
                      <Upload size={14} /> Submit Approval
                    </button>
                    <button
                      onClick={() => onOpenReview(bounty)}
                      className="btn btn-subtle btn-lg"
                      style={{ flex: 1 }}
                    >
                      <ShieldCheck size={14} /> Review Proofs ({pending.length})
                    </button>
                  </>
                ) : (
                  <button onClick={() => onOpenReview(bounty)} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    <ShieldCheck size={14} />
                    Review Proofs ({pending.length})
                  </button>
                )
              ) : (
                <button
                  onClick={() => !isBanned && onOpenSubmitProof(bounty)}
                  disabled={isBanned}
                  className="btn btn-primary btn-lg"
                  style={{
                    width: '100%',
                    opacity: isBanned ? 0.5 : 1,
                    cursor: isBanned ? 'not-allowed' : 'pointer',
                    background: isBanned ? 'rgba(239, 68, 68, 0.2)' : undefined,
                    borderColor: isBanned ? 'rgba(239, 68, 68, 0.4)' : undefined,
                    color: isBanned ? '#f87171' : undefined,
                  }}
                  title={isBanned ? 'You are restricted from submitting proof for this bounty map' : 'Submit Approval'}
                >
                  {isBanned ? (
                    <>
                      <UserX size={14} />
                      Banned from this Quest 🚫
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Submit Approval
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
