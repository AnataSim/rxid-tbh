import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types/bounty';
import { Trophy, Coins, Target, Star, Zap, Loader2 } from 'lucide-react';
import { normalizeAvatarUrl } from '../services/authService';
import { CowboyRankSquareFrame } from './CowboyRankBadge';

export const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('bountyPoints', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ docId: d.id, data: d.data() as User }));

        // Auto-clean duplicate docs in Firestore with identical username
        const seenNames = new Set<string>();
        const cleanList: User[] = [];
        for (const item of docs) {
          const name = (item.data.username || '').trim().toLowerCase();
          if (name) {
            if (seenNames.has(name)) {
              // Delete duplicate document from Firestore
              deleteDoc(doc(db, 'users', item.docId)).catch(() => {});
            } else {
              seenNames.add(name);
              cleanList.push(item.data);
            }
          } else {
            cleanList.push(item.data);
          }
        }

        // Sort cleanList: Primary = BP desc, Secondary Tie-breaker = Earliest timestamp first
        cleanList.sort((a, b) => {
          const bpA = a.bountyPoints || 100;
          const bpB = b.bountyPoints || 100;
          if (bpA !== bpB) {
            return bpB - bpA; // Higher BP ranks higher
          }
          // Tie-breaker: Who earned/reached points earlier ranks higher!
          const timeA = new Date(a.lastBpUpdatedAt || a.createdAt || '2026-08-19T00:00:00Z').getTime();
          const timeB = new Date(b.lastBpUpdatedAt || b.createdAt || '2026-08-19T00:00:00Z').getTime();
          return timeA - timeB; // Earlier timestamp (smaller value) comes FIRST
        });

        setPlayers(cleanList);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const medals      = ['🥇', '🥈', '🥉'];
  const medalColors = ['#e8a020', '#9ca3af', '#b45309'];

  // Filter out any duplicate accounts by unique username or UID
  const uniquePlayers = players.filter((p, index, self) => 
    index === self.findIndex(t => (
      (t.username && p.username)
        ? t.username.trim().toLowerCase() === p.username.trim().toLowerCase()
        : (t.id || t.uid) === (p.id || p.uid)
    ))
  );

  if (loading) {
    return (
      <div className="anim-in" style={{ maxWidth: 760, margin: '0 auto', paddingTop: 80, textAlign: 'center' }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="anim-in" style={{ maxWidth: 760, margin: '0 auto', paddingTop: 32, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="merah-putih-neon-box" style={{ width: 34, height: 34 }}>
            <Trophy size={18} color="#ef4444" />
          </div>
          <h1 className="page-title">Leaderboard</h1>
        </div>
        <p className="page-sub">
          Top Bounty Hunters ranked by vPoints earned across v4rx.me beatmap challenges.
        </p>
      </div>

      {uniquePlayers.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Trophy size={20} /></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Leaderboard masih kosong</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              Mulai claim bounty untuk masuk leaderboard!
            </div>
          </div>
        </div>
      ) : (
        <div className="lb-table">
          <div className="lb-head">
            <div>#</div>
            <div>Player</div>
            <div style={{ textAlign: 'right' }}>Bounties</div>
            <div style={{ textAlign: 'right' }}>Earnings</div>
            <div style={{ textAlign: 'right' }}>Rank</div>
          </div>
          {uniquePlayers.map((p, i) => (
            <div
              key={p.id || p.uid || i}
              className={`lb-row ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}`}
            >
              <div className="lb-rank" style={{ color: i < 3 ? medalColors[i] : undefined }}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </div>
              <div className="lb-user">
                <img
                  src={normalizeAvatarUrl(p.avatarUrl, p.username)}
                  alt={p.username}
                  onError={e => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(p.username)}&bold=true`;
                  }}
                />
                <div>
                  <div className="lb-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img
                      src={`https://flagcdn.com/w40/${(p.countryCode || 'id').toLowerCase()}.png`}
                      alt={p.countryCode || 'ID'}
                      style={{ width: 18, height: 12, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>{p.username}</span>
                  </div>
                  <div className="lb-sub" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {p.v4rxRank > 0 && p.v4rxRank < 9999 && (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Star size={9} /> #{p.v4rxRank}
                        </span>
                        <span style={{ margin: '0 2px', color: 'var(--text-4)' }}>·</span>
                        <span className="mono" style={{ fontSize: 10 }}>{p.v4rxPp.toLocaleString()} pp</span>
                        <span style={{ margin: '0 2px', color: 'var(--text-4)' }}>·</span>
                        <span>{p.v4rxAccuracy}%</span>
                      </>
                    )}
                    {p.title && <span style={{ marginLeft: (p.v4rxRank > 0 && p.v4rxRank < 9999) ? 4 : 0 }}>{p.title}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <Target size={12} style={{ color: 'var(--accent)' }} />
                <span className="lb-num">{p.bountiesClaimedCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <Coins size={13} style={{ color: 'var(--gold)' }} />
                <span className="lb-earn">{(p.bountyPoints || 100).toLocaleString()}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>BP</span>
              </div>
              {/* Big Square Rank Frame Box (Right of Earnings) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <CowboyRankSquareFrame bp={p.bountyPoints || 100} rank={i + 1} size={42} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sync Footer Info */}
      <div style={{
        marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: 'var(--text-3)',
      }}>
        <Zap size={11} style={{ color: 'var(--accent)' }} />
        <span>Synced with Firebase · {uniquePlayers.length} active players registered</span>
      </div>
    </div>
  );
};
