import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types/bounty';
import { fetchV4rxProfile, countryCodeToEmoji } from './osuApi';

// ── Helpers ──────────────────────────────────────────────────────────────────

export function buildAvatarUrl(osuId?: string, username?: string): string {
  if (osuId) {
    const cleanId = osuId
      .replace(/.*\/user\/avatar\//i, '')
      .replace(/\.png$/i, '')
      .replace(/.*\/user\/profile\.php\?id=/i, '')
      .replace(/.*\/u\//i, '')
      .replace(/.*\/player\//i, '')
      .replace(/.*\/users\//i, '')
      .trim();

    if (/^\d+$/.test(cleanId)) {
      return `https://v4rx.me/user/avatar/${cleanId}.png`;
    }
    if (osuId.startsWith('http://') || osuId.startsWith('https://')) {
      const ppyMatch = osuId.match(/a\.ppy\.sh\/(\d+)/i);
      if (ppyMatch) {
        return `https://v4rx.me/user/avatar/${ppyMatch[1]}.png`;
      }
      return osuId;
    }
  }

  const name = username || 'Player';
  return `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(name)}&bold=true&size=128`;
}

export function normalizeAvatarUrl(url?: string, username?: string): string {
  if (!url) return buildAvatarUrl(undefined, username);
  if (url.includes('a.ppy.sh')) {
    const match = url.match(/a\.ppy\.sh\/(\d+)/);
    if (match) return `https://v4rx.me/user/avatar/${match[1]}.png`;
  }
  return url;
}

export function formatHereSince(dateStr?: string): string {
  if (!dateStr) return 'Wed Aug 19 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Wed Aug 19 2026';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[d.getUTCDay()];
    const monthName = months[d.getUTCMonth()];
    const dayNum = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${dayName} ${monthName} ${dayNum} ${year}`;
  } catch {
    return 'Wed Aug 19 2026';
  }
}

export function formatLastLogin(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Just now';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
  } catch {
    return 'Just now';
  }
}

function assignTitle(pp: number): string {
  if (pp >= 20000) return '🤠 Grand Marshal';
  if (pp >= 15000) return '★ Sheriff Giver';
  if (pp >= 10000) return '⚡ Master Bounty Hunter';
  if (pp >= 5000)  return '🎯 Desert Marksman';
  return '🌵 Newcomer';
}

// ── Auth operations ───────────────────────────────────────────────────────────

export interface RegisterData {
  email: string;
  password: string;
  username: string;      // Their display name / v4rx username
  osuId?: string;        // Optional: their osu! user ID for avatar
  countryCode?: string;  // e.g. 'ID'
  countryFlag?: string;  // e.g. '🇮🇩'
  v4rxPp?: number;
  v4rxRank?: number;
  v4rxAccuracy?: number;
}

/**
 * Register a new user: Firebase Auth + Firestore profile doc
 */
export async function registerUser(data: RegisterData): Promise<User> {
  const {
    email, password, username, osuId,
    countryCode = 'ID', countryFlag,
    v4rxPp = 0, v4rxRank = 81, v4rxAccuracy = 0,
  } = data;

  // 1. Auto-fetch real v4rx profile data for ANY new registering member!
  let finalUsername = username;
  let finalOsuId = osuId || '';
  let finalAvatar = buildAvatarUrl(osuId, username);
  let finalCountryCode = countryCode;
  let finalFlag = countryFlag || countryCodeToEmoji(countryCode);
  let finalRank = v4rxRank;
  let finalPp = v4rxPp;
  let finalAcc = v4rxAccuracy;

  const targetIdToFetch = osuId || username;
  if (targetIdToFetch) {
    try {
      const fresh = await fetchV4rxProfile(targetIdToFetch);
      if (fresh && fresh.username && !fresh.username.startsWith('Player #')) {
        finalUsername = fresh.username;
        if (fresh.id) finalOsuId = fresh.id;
        finalAvatar = fresh.avatarUrl;
        finalCountryCode = fresh.countryCode;
        finalFlag = fresh.countryFlag;
        if (fresh.v4rxRank > 0) finalRank = fresh.v4rxRank;
        if (fresh.v4rxPp > 0) finalPp = fresh.v4rxPp;
        if (fresh.v4rxAccuracy > 0) finalAcc = fresh.v4rxAccuracy;
      }
    } catch {
      // Ignore fetch error, proceed with fallback
    }
  }

  // 2. Create Firebase Auth user
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = cred.user;

  // 3. Update displayName
  await updateProfile(firebaseUser, { displayName: finalUsername });

  // 4. Build Firestore profile with guaranteed real v4rx data
  const title  = assignTitle(finalPp);
  const nowIso = new Date().toISOString();

  const isGiverAccount = ['sim', 'darkww', '63', '85'].includes(finalUsername.trim().toLowerCase()) || (finalOsuId ? ['63', '85'].includes(finalOsuId.trim()) : false);

  const profile: User = {
    id:                  firebaseUser.uid,
    uid:                 firebaseUser.uid,
    osuId:               finalOsuId,
    email,
    username:            finalUsername,
    avatarUrl:           finalAvatar,
    countryCode:         finalCountryCode,
    countryFlag:         finalFlag,
    v4rxRank:            finalRank,
    v4rxPp:              finalPp,
    v4rxAccuracy:        finalAcc,
    playCount:           0,
    role:                isGiverAccount ? 'bounty_giver' : 'bounty_hunter',
    bountyPoints:        100,
    bountiesPostedCount: 0,
    bountiesClaimedCount:0,
    title,
    createdAt:           nowIso,
    lastLoginAt:         nowIso,
  };

  // 5. Save to Firestore
  await setDoc(doc(db, 'users', firebaseUser.uid), {
    ...profile,
    createdAtServer: serverTimestamp(),
    lastLoginServer: serverTimestamp(),
  });

  return profile;
}

/**
 * Login: Firebase email/password or UID/password, then fetch Firestore profile
 */
export async function loginUser(emailOrUid: string, password: string): Promise<User> {
  let targetEmail = emailOrUid.trim();

  // If input doesn't contain '@', resolve numeric UID or username from Firestore
  if (!targetEmail.includes('@')) {
    let resolvedEmail: string | null = null;
    try {
      const qOsuId = query(collection(db, 'users'), where('osuId', '==', targetEmail));
      const snapOsuId = await getDocs(qOsuId);
      if (!snapOsuId.empty) {
        resolvedEmail = (snapOsuId.docs[0].data() as User).email || null;
      } else {
        const qUsername = query(collection(db, 'users'), where('username', '==', targetEmail));
        const snapUsername = await getDocs(qUsername);
        if (!snapUsername.empty) {
          resolvedEmail = (snapUsername.docs[0].data() as User).email || null;
        }
      }
    } catch (err) {
      console.warn('Failed to resolve email from UID:', err);
    }

    if (resolvedEmail) {
      targetEmail = resolvedEmail;
    } else {
      throw new Error(`UID / Username "${targetEmail}" belum terdaftar. Silakan Register di tab Register terlebih dahulu.`);
    }
  }

  const cred = await signInWithEmailAndPassword(auth, targetEmail, password);
  const profile = await fetchUserProfile(cred.user.uid);
  if (!profile) throw new Error('Profile not found. Please register first.');
  return profile;
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetch user profile from Firestore by UID
 */
export async function fetchUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const profile = snap.data() as User;

  // Automatically ensure account Sim and darkww are assigned Bounty Giver (BG) role
  const lowerName = (profile.username || '').trim().toLowerCase();
  const isGiverAccount = ['sim', 'darkww', '63', '85'].includes(lowerName) || (profile.osuId ? ['63', '85'].includes(profile.osuId.trim()) : false);
  if (isGiverAccount && profile.role !== 'bounty_giver') {
    profile.role = 'bounty_giver';
    setDoc(doc(db, 'users', uid), { role: 'bounty_giver' }, { merge: true }).catch(() => {});
  }

  // Auto-heal profiles stored with fallback "Player #..." or missing data
  if (profile.osuId || profile.username) {
    const targetId = profile.osuId || profile.username.trim();
    if (targetId) {
      try {
        const fresh = await fetchV4rxProfile(targetId);
        if (fresh && fresh.username && !fresh.username.startsWith('Player #')) {
          profile.username = fresh.username;
          profile.avatarUrl = fresh.avatarUrl;
          profile.countryCode = fresh.countryCode;
          profile.countryFlag = fresh.countryFlag;
          profile.v4rxRank = fresh.v4rxRank;
          profile.v4rxPp = fresh.v4rxPp;
          profile.v4rxAccuracy = fresh.v4rxAccuracy;
          profile.title = assignTitle(fresh.v4rxPp);
          setDoc(doc(db, 'users', uid), {
            username: fresh.username,
            avatarUrl: fresh.avatarUrl,
            countryCode: fresh.countryCode,
            countryFlag: fresh.countryFlag,
            v4rxRank: fresh.v4rxRank,
            v4rxPp: fresh.v4rxPp,
            v4rxAccuracy: fresh.v4rxAccuracy,
            title: profile.title,
          }, { merge: true }).catch(() => {});
        }
      } catch {
        // Ignore background sync errors
      }
    }
  }

  // Fallbacks for missing fields
  if (!profile.countryCode) profile.countryCode = 'ID';
  if (!profile.countryFlag) profile.countryFlag = '🇮🇩';
  if (!profile.createdAt)   profile.createdAt   = '2026-08-19T00:00:00Z';
  if (!profile.bountyPoints || profile.bountyPoints <= 0) profile.bountyPoints = 100;
  const nowIso = new Date().toISOString();
  if (!profile.lastLoginAt) profile.lastLoginAt = nowIso;

  // Update last login timestamp in background
  setDoc(doc(db, 'users', uid), { lastLoginAt: nowIso, lastLoginServer: serverTimestamp() }, { merge: true }).catch(() => {});

  // Auto-migrate legacy avatar URLs (e.g. pointing to a.ppy.sh) to v4rx.me
  if (profile.avatarUrl && profile.avatarUrl.includes('a.ppy.sh')) {
    const match = profile.avatarUrl.match(/a\.ppy\.sh\/(\d+)/);
    if (match) {
      profile.avatarUrl = `https://v4rx.me/user/avatar/${match[1]}.png`;
      // Update firestore doc asynchronously
      setDoc(doc(db, 'users', uid), { avatarUrl: profile.avatarUrl }, { merge: true }).catch(() => {});
    }
  }

  return profile;
}

/**
 * Convert Firebase Auth user → minimal User (used during auth state restore)
 */
export function firebaseUserToMinimal(fbUser: FirebaseUser): Partial<User> {
  return {
    uid:       fbUser.uid,
    id:        fbUser.uid,
    email:     fbUser.email ?? '',
    username:  fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Player',
    avatarUrl: buildAvatarUrl(undefined, fbUser.displayName ?? 'Player'),
  };
}
