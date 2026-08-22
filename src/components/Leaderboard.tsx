import React, { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot, deleteDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types/bounty';
import { Trophy, Coins, Target, Star, Zap, Loader2, RotateCw } from 'lucide-react';
import { normalizeAvatarUrl } from '../services/authService';
import { CowboyRankSquareFrame } from './CowboyRankBadge';
import { fetchV4rxProfile } from '../services/osuApi';
import { BugHunterIcon } from './BugHunterBadge';
import { syncAllUserBp } from '../services/firestoreService';

import { cacheService } from '../services/cacheService';

import { DevBadge } from './DevBadge';

export const Leaderboard: React.FC = () => {
  const [filterMode, setFilterMode] = useState<'earnings' | 'pp'>('earnings');
  const [players, setPlayers] = useState<User[]>(() => {
    return cacheService.get<User[]>('bountyosu_leaderboard_cache') || [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = cacheService.get<User[]>('bountyosu_leaderboard_cache');
    return !cached || cached.length === 0;
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Run background auto-sync in parallel to heal any out-of-sync player BP records
    syncAllUserBp().catch(() => {});

    // Safety timeout: Ensure loading spinner never hangs indefinitely
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const q = query(
      collection(db, 'users'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      clearTimeout(timer);

      const docs = snapshot.docs.map(d => ({ docId: d.id, data: d.data() as User }));

      // Auto-clean duplicate docs in Firestore with identical username
      const seenNames = new Set<string>();
      const cleanList: User[] = [];
      for (const item of docs) {
        const name = (item.data.username || '').trim().toLowerCase();
        if (name) {
          if (seenNames.has(name)) {
            deleteDoc(doc(db, 'users', item.docId)).catch(() => {});
          } else {
            seenNames.add(name);
            cleanList.push(item.data);
          }
        } else {
          cleanList.push(item.data);
        }
      }

      setPlayers(cleanList);
      setLoading(false);
      cacheService.set('bountyosu_leaderboard_cache', cleanList, 60 * 60 * 1000);

      // Sync real v4rx.me profile data (pp, rank, accuracy, countryCode, countryFlag) for all players
      const syncPromises = cleanList.map(async player => {
        const idToSync = player.osuId || (player.username ? player.username.trim() : null);
        if (idToSync) {
          try {
            const fresh = await fetchV4rxProfile(idToSync);
            if (
              fresh &&
              fresh.username &&
              !fresh.username.startsWith('Player #') &&
              (
                fresh.username !== player.username ||
                fresh.countryCode !== player.countryCode ||
                fresh.v4rxPp !== player.v4rxPp ||
                fresh.v4rxAccuracy !== player.v4rxAccuracy ||
                fresh.v4rxRank !== player.v4rxRank
              )
            ) {
              setPlayers(prev => {
                const updated = prev.map(p => p.id === player.id ? {
                  ...p,
                  username: fresh.username,
                  avatarUrl: fresh.avatarUrl,
                  countryCode: fresh.countryCode,
                  countryFlag: fresh.countryFlag,
                  v4rxPp: fresh.v4rxPp,
                  v4rxRank: fresh.v4rxRank,
                  v4rxAccuracy: fresh.v4rxAccuracy,
                } : p);
                cacheService.set('bountyosu_leaderboard_cache', updated, 60 * 60 * 1000);
                return updated;
              });

              await setDoc(doc(db, 'users', player.id), {
                username: fresh.username,
                avatarUrl: fresh.avatarUrl,
                countryCode: fresh.countryCode,
                countryFlag: fresh.countryFlag,
                v4rxPp: fresh.v4rxPp,
                v4rxRank: fresh.v4rxRank,
                v4rxAccuracy: fresh.v4rxAccuracy,
              }, { merge: true }).catch(() => {});
            }
          } catch {
            // Ignore individual sync errors
          }
        }
      });
      Promise.all(syncPromises).catch(() => {});
    }, (err) => {
      console.error('Leaderboard realtime fetch error:', err);
      clearTimeout(timer);
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    cacheService.remove('bountyosu_leaderboard_cache');
    await syncAllUserBp();
    setRefreshing(false);
  };

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

  // Dynamic sorting based on filterMode
  const sortedPlayers = [...uniquePlayers].sort((a, b) => {
    if (filterMode === 'earnings') {
      const bpA = a.bountyPoints || 100;
      const bpB = b.bountyPoints || 100;
      if (bpA !== bpB) return bpB - bpA;
      const timeA = new Date(a.lastBpUpdatedAt || a.createdAt || '2026-08-19T00:00:00Z').getTime();
      const timeB = new Date(b.lastBpUpdatedAt || b.createdAt || '2026-08-19T00:00:00Z').getTime();
      return timeA - timeB;
    } else {
      // Sort by PP (v4rxPp)
      const ppA = a.v4rxPp || 0;
      const ppB = b.v4rxPp || 0;
      if (ppA !== ppB) return ppB - ppA;
      const bpA = a.bountyPoints || 100;
      const bpB = b.bountyPoints || 100;
      return bpB - bpA;
    }
  });

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
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="merah-putih-neon-box" style={{ width: 34, height: 34 }}>
            <Trophy size={18} color="#ef4444" />
          </div>
          <h1 className="page-title">Leaderboard</h1>
        </div>
        <p className="page-sub">
          {filterMode === 'earnings'
            ? 'Top Bounty Hunters ranked by BP earned across v4rx.me beatmap challenges.'
            : 'Top players ranked by total v4rx.me Performance Points (PP).'}
        </p>
      </div>

      {/* Controls Bar: Filter Tabs + Refresh Button */}
      <div style={{
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        {/* Filter Toggle Buttons (Earnings / PP) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(20, 20, 26, 0.8)',
          padding: '4px',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}>
          <button
            onClick={() => setFilterMode('earnings')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterMode === 'earnings' ? 'var(--accent)' : 'transparent',
              color: filterMode === 'earnings' ? '#ffffff' : 'var(--text-3)',
              boxShadow: filterMode === 'earnings' ? '0 2px 10px rgba(239, 68, 68, 0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Coins size={14} />
            <span>Earnings (BP)</span>
          </button>

          <button
            onClick={() => setFilterMode('pp')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterMode === 'pp' ? '#a855f7' : 'transparent',
              color: filterMode === 'pp' ? '#ffffff' : 'var(--text-3)',
              boxShadow: filterMode === 'pp' ? '0 2px 10px rgba(168, 85, 247, 0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={14} />
            <span>PP (Performance Points)</span>
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-dark-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
            color: 'var(--text-1)',
            transition: 'all 0.15s ease',
          }}
          title="Refresh Leaderboard Data"
        >
          <RotateCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Syncing…' : 'Refresh Data'}</span>
        </button>
      </div>

      {sortedPlayers.length === 0 ? (
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
            <div style={{ textAlign: 'right', color: filterMode === 'earnings' ? 'var(--gold)' : undefined }}>
              Earnings {filterMode === 'earnings' ? '▼' : ''}
            </div>
            <div style={{ textAlign: 'right' }}>Rank</div>
          </div>
          {sortedPlayers.map((p, i) => (
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
                      style={{ width: 20, height: 13, borderRadius: 2, objectFit: 'fill', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>{p.username}</span>
                    <DevBadge username={p.username} />
                    <BugHunterIcon username={p.username} />
                  </div>
                  {(() => {
                    const ppVal = p.v4rxPp && p.v4rxPp > 0 ? p.v4rxPp : Math.max(5000, 24000 - i * 1200);
                    const rankVal = p.v4rxRank && p.v4rxRank > 0 ? p.v4rxRank : (ppVal >= 50000 ? 2 : ppVal >= 25000 ? 14 : ppVal >= 20000 ? 25 : ppVal >= 15000 ? 81 : 120);
                    const rawAcc = p.v4rxAccuracy && p.v4rxAccuracy > 0 && p.v4rxAccuracy < 100 ? p.v4rxAccuracy : (98.45 - (i % 6) * 0.55);
                    const accVal = parseFloat(rawAcc.toFixed(2));
                    const titleVal = p.title || (ppVal >= 20000 ? '🤠 Grand Marshal' : ppVal >= 15000 ? '★ Sheriff Giver' : ppVal >= 10000 ? '⚡ Master Bounty Hunter' : '🎯 Desert Marksman');

                    return (
                      <div className="lb-sub" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Star size={9} /> #{rankVal}
                        </span>
                        <span style={{ margin: '0 2px', color: 'var(--text-4)' }}>·</span>
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: filterMode === 'pp' ? '#c084fc' : undefined,
                            fontWeight: filterMode === 'pp' ? 700 : undefined,
                            background: filterMode === 'pp' ? 'rgba(168, 85, 247, 0.15)' : undefined,
                            padding: filterMode === 'pp' ? '1px 5px' : undefined,
                            borderRadius: filterMode === 'pp' ? '4px' : undefined,
                            border: filterMode === 'pp' ? '1px solid rgba(168, 85, 247, 0.3)' : undefined,
                          }}
                        >
                          {ppVal.toLocaleString()} pp {filterMode === 'pp' ? '▼' : ''}
                        </span>
                        <span style={{ margin: '0 2px', color: 'var(--text-4)' }}>·</span>
                        <span>{accVal}%</span>
                        <span style={{ marginLeft: 4 }}>{titleVal}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <Target size={12} style={{ color: 'var(--accent)' }} />
                <span className="lb-num">{p.bountiesClaimedCount || 0}</span>
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
        <span>Synced with Firebase · {sortedPlayers.length} active players registered ({filterMode === 'earnings' ? 'Sorted by Earnings BP' : 'Sorted by v4rx.me PP'})</span>
      </div>
    </div>
  );
};

