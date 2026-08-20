import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, getDoc, getDocs, increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Bounty, Submission, User } from '../types/bounty';
import { sendNotification } from './notificationService';
import { fetchBeatmapMetadata } from './osuApi';

// ── Collections ───────────────────────────────────────────────────────────────
const BOUNTIES_COL = 'bounties';
const USERS_COL    = 'users';

// ── User ──────────────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, USERS_COL, uid));
  return snap.exists() ? (snap.data() as User) : null;
}

// ── Bounties ──────────────────────────────────────────────────────────────────

/**
 * Subscribe to all bounties in real-time (ordered by createdAt desc)
 */
export function subscribeToBounties(
  callback: (bounties: Bounty[]) => void
): Unsubscribe {
  const q = query(
    collection(db, BOUNTIES_COL),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const bounties: Bounty[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Fetch submissions subcollection
      const subSnap = await getDocs(
        collection(db, BOUNTIES_COL, docSnap.id, 'submissions')
      );
      const submissions: Submission[] = subSnap.docs.map(s => ({
        id: s.id,
        ...(s.data() as Omit<Submission, 'id'>),
      }));

      let beatmap = data.beatmap;
      // Auto-enrich fallback beatmap titles or outdated star/duration metadata in Firestore
      if (
        !beatmap ||
        !beatmap.title ||
        beatmap.title.startsWith('Beatmap Set #') ||
        beatmap.artist === 'osu! Artist' ||
        beatmap.starRating === 7.5 ||
        beatmap.starRating === 7.49 ||
        beatmap.durationFormatted === '02:40'
      ) {
        const setId = beatmap?.beatmapsetId || 465035;
        const mapId = beatmap?.beatmapId;
        const queryId = mapId ? `${setId}#osu/${mapId}` : setId.toString();
        const fresh = await fetchBeatmapMetadata(queryId);
        beatmap = { ...beatmap, ...fresh };
        // Asynchronously update Firestore document with 100% fresh real metadata
        updateDoc(doc(db, BOUNTIES_COL, docSnap.id), { beatmap }).catch(() => {});
      }

      bounties.push({
        id: docSnap.id,
        ...(data as Omit<Bounty, 'id' | 'submissions'>),
        beatmap,
        submissions,
      });
    }

    callback(bounties);
  });
}

/**
 * Create a new bounty in Firestore + send broadcast notification
 */
export async function createBounty(
  bountyData: Omit<Bounty, 'id' | 'submissions'>
): Promise<string> {
  const ref = await addDoc(collection(db, BOUNTIES_COL), {
    ...bountyData,
    createdAtServer: serverTimestamp(),
  });

  // Notify all hunters of new quest
  sendNotification({
    userId: 'all',
    type: 'new_quest',
    title: '📜 New Quest Posted!',
    message: `${bountyData.giver.username} posted a new bounty for ${bountyData.beatmap.title} (${bountyData.reward.amount} ${bountyData.reward.currency})`,
    bountyId: ref.id,
  }).catch(() => {});

  return ref.id;
}

/**
 * Update an existing bounty in Firestore
 */
export async function updateBounty(
  bountyId: string,
  updates: Partial<Bounty>
): Promise<void> {
  const bountyRef = doc(db, BOUNTIES_COL, bountyId);
  await updateDoc(bountyRef, {
    ...updates,
    updatedAtServer: serverTimestamp(),
  });
}

/**
 * Submit a proof to a bounty's submissions subcollection + notify giver + touch parent doc
 */
export async function submitProof(
  bountyId: string,
  submissionData: Omit<Submission, 'id'>,
  giverId?: string,
  beatmapTitle?: string
): Promise<string> {
  const ref = await addDoc(
    collection(db, BOUNTIES_COL, bountyId, 'submissions'),
    {
      ...submissionData,
      submittedAtServer: serverTimestamp(),
    }
  );

  // IMPORTANT: Touch parent bounty document so onSnapshot real-time listener updates for BG & Hunters instantly
  await updateDoc(doc(db, BOUNTIES_COL, bountyId), {
    lastSubmissionAt: new Date().toISOString(),
    updatedAtServer: serverTimestamp(),
  }).catch(() => {});

  if (giverId) {
    sendNotification({
      userId: giverId,
      type: 'proof_submitted',
      title: '📥 New Proof Submitted!',
      message: `${submissionData.hunterUsername} submitted proof for ${beatmapTitle || 'your bounty'}`,
      bountyId,
    }).catch(() => {});
  }

  return ref.id;
}

/**
 * Calculate BP Multiplier based on current hunter BP:
 * 100-999    : x1
 * 1000-1249  : x0.75
 * 1250-1499  : x0.6
 * 1500-1699  : x0.45
 * 1700-1799  : x0.25
 * 1800-1850  : x0.15 (1800 to 1849)
 * 1850+      : x0.8
 */
export function getBpMultiplier(currentBp: number = 100): number {
  if (currentBp >= 1850) return 0.8;
  if (currentBp >= 1800) return 0.15;
  if (currentBp >= 1700) return 0.25;
  if (currentBp >= 1500) return 0.45;
  if (currentBp >= 1250) return 0.6;
  if (currentBp >= 1000) return 0.75;
  return 1.0;
}

export function calculateAwardedBp(baseReward: number, currentBp: number = 100): { awardedBp: number; multiplier: number } {
  const multiplier = getBpMultiplier(currentBp);
  const awardedBp = Math.round(baseReward * multiplier);
  return { awardedBp, multiplier };
}

/**
 * Approve a submission → sets submission status to 'approved', bounty to 'completed', awards scaled BP to hunter based on current BP tier, and notifies hunter
 */
export async function approveSubmission(
  bountyId: string,
  submissionId: string,
  hunterId?: string,
  beatmapTitle?: string,
  rewardAmount?: number
): Promise<void> {
  const baseReward = rewardAmount || 100;
  let amountToAward = baseReward;
  let activeMultiplier = 1.0;

  if (hunterId) {
    const hunterProfile = await getUserProfile(hunterId);
    const currentBp = hunterProfile?.bountyPoints || 100;
    const calc = calculateAwardedBp(baseReward, currentBp);
    amountToAward = calc.awardedBp;
    activeMultiplier = calc.multiplier;
  }

  await updateDoc(
    doc(db, BOUNTIES_COL, bountyId, 'submissions', submissionId),
    {
      status: 'approved',
      awardedBp: amountToAward,
      bpMultiplier: activeMultiplier,
    }
  );
  await updateDoc(doc(db, BOUNTIES_COL, bountyId), {
    status: 'completed',
    updatedAtServer: serverTimestamp(),
  });

  if (hunterId) {
    // Award the actual scaled bounty reward amount to hunter + record timestamp for tie-breaker
    const nowIso = new Date().toISOString();
    updateDoc(doc(db, USERS_COL, hunterId), {
      bountyPoints: increment(amountToAward),
      bountiesClaimedCount: increment(1),
      lastBpUpdatedAt: nowIso,
      lastBpUpdatedAtServer: serverTimestamp(),
    }).catch(() => {});

    // Send success notification to hunter with multiplier details if scaled
    const multiplierNote = activeMultiplier !== 1.0 ? ` (${activeMultiplier}x multiplier)` : '';
    sendNotification({
      userId: hunterId,
      type: 'proof_approved',
      title: '🎉 Quest Cleared! (Approved)',
      message: `Your proof for ${beatmapTitle || 'the bounty'} was approved! You earned +${amountToAward} BP!${multiplierNote}`,
      bountyId,
    }).catch(() => {});
  }
}

/**
 * Reject a submission with a reason + notify hunter
 */
export async function rejectSubmission(
  bountyId: string,
  submissionId: string,
  reason: string,
  hunterId?: string,
  beatmapTitle?: string
): Promise<void> {
  await updateDoc(
    doc(db, BOUNTIES_COL, bountyId, 'submissions', submissionId),
    { status: 'rejected', rejectionReason: reason }
  );

  await updateDoc(doc(db, BOUNTIES_COL, bountyId), {
    updatedAtServer: serverTimestamp(),
  }).catch(() => {});

  if (hunterId) {
    sendNotification({
      userId: hunterId,
      type: 'proof_rejected',
      title: '❌ Proof Rejected',
      message: `Your submission for ${beatmapTitle || 'the bounty'} was rejected: "${reason}"`,
      bountyId,
    }).catch(() => {});
  }
}

/**
 * Delete a submission from a bounty.
 * If the submission was approved:
 * 1. Deducts exact awarded BP from the hunter's user record in Firestore (-awardedBp).
 * 2. Decrements the hunter's bountiesClaimedCount (-1).
 * 3. Reverts the parent bounty status back to 'open'.
 * 4. Updates leaderboard real-time state.
 */
export async function deleteSubmission(
  bountyId: string,
  submissionId: string
): Promise<void> {
  const subRef = doc(db, BOUNTIES_COL, bountyId, 'submissions', submissionId);
  const subSnap = await getDoc(subRef);

  let hunterId: string | undefined = undefined;
  let hunterUsername: string | undefined = undefined;
  let isApproved = false;
  let awardedBpToDelete: number | undefined = undefined;

  if (subSnap.exists()) {
    const subData = subSnap.data() as Submission;
    hunterId = subData.hunterId;
    hunterUsername = subData.hunterUsername;
    isApproved = subData.status === 'approved';
    awardedBpToDelete = subData.awardedBp;
  }

  // Fetch parent bounty to get fallback reward amount if awardedBp is not stored
  const bountyRef = doc(db, BOUNTIES_COL, bountyId);
  const bountySnap = await getDoc(bountyRef);
  let baseReward = 100;

  if (bountySnap.exists()) {
    const bData = bountySnap.data() as Bounty;
    baseReward = bData.reward?.amount || 100;
  }

  const finalDeductAmount = awardedBpToDelete !== undefined ? awardedBpToDelete : baseReward;

  // Delete submission doc
  await deleteDoc(subRef);

  // If deleted submission was approved, deduct BP & reset bounty to open
  if (isApproved) {
    let userRef = hunterId ? doc(db, USERS_COL, hunterId) : null;
    let userSnap = userRef ? await getDoc(userRef) : null;

    // Fallback search by username if hunterId document not found directly
    if ((!userSnap || !userSnap.exists()) && hunterUsername) {
      const q = query(collection(db, USERS_COL));
      const allUsersSnap = await getDocs(q);
      const matchedDoc = allUsersSnap.docs.find(d => {
        const u = d.data();
        return u.username && u.username.toLowerCase() === hunterUsername!.toLowerCase();
      });
      if (matchedDoc) {
        userRef = doc(db, USERS_COL, matchedDoc.id);
        userSnap = matchedDoc;
      }
    }

    if (userRef && userSnap && userSnap.exists()) {
      const userData = userSnap.data();
      const currentBp = userData.bountyPoints || 0;
      const currentCount = userData.bountiesClaimedCount || 0;

      const newBp = Math.max(0, currentBp - finalDeductAmount);
      const newCount = Math.max(0, currentCount - 1);

      await updateDoc(userRef, {
        bountyPoints: newBp,
        bountiesClaimedCount: newCount,
        updatedAtServer: serverTimestamp(),
      }).catch(() => {});
    }

    // Revert parent bounty status back to 'open'
    await updateDoc(bountyRef, {
      status: 'open',
      updatedAtServer: serverTimestamp(),
    }).catch(() => {});
  } else {
    // Touch parent doc for real-time listener update
    await updateDoc(bountyRef, {
      updatedAtServer: serverTimestamp(),
    }).catch(() => {});
  }
}

/**
 * Submit user difficulty rating for a bounty (1.0 to 10.0) + recalculate avgDifficulty
 */
export async function submitDifficultyRating(
  bountyId: string,
  userId: string,
  rating: number
): Promise<number> {
  const rounded = parseFloat(rating.toFixed(1));
  const bountyRef = doc(db, BOUNTIES_COL, bountyId);
  const snap = await getDoc(bountyRef);

  if (snap.exists()) {
    const data = snap.data();
    const map: Record<string, number> = data.difficultyRatings || {};
    map[userId] = rounded;

    const values = Object.values(map);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = parseFloat((sum / values.length).toFixed(1));

    await updateDoc(bountyRef, {
      difficultyRatings: map,
      avgDifficulty: avg,
      updatedAtServer: serverTimestamp(),
    });

    return avg;
  }
  return rounded;
}

// ── Friends & Requests ───────────────────────────────────────────────────────

export interface FriendDocData {
  id: string;
  friendUid: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'offline';
  bp: number;
  countryCode?: string;
  rank?: number;
  clearedCount?: number;
  postedCount?: number;
  hereSince?: string;
  addedAt?: string;
}

export interface FriendRequestDocData {
  id: string;
  fromUid: string;
  username: string;
  avatarUrl?: string;
  bp: number;
  countryCode?: string;
  sentAt: string;
}

export function subscribeToFriends(
  userId: string,
  callback: (friends: FriendDocData[]) => void
): Unsubscribe {
  const friendsRef = collection(db, USERS_COL, userId, 'friends');
  return onSnapshot(friendsRef, (snapshot) => {
    const friends: FriendDocData[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FriendDocData, 'id'>),
    }));
    callback(friends);
  }, (err) => {
    console.warn('Friends subscribe error:', err);
    callback([]);
  });
}

export function subscribeToFriendRequests(
  userId: string,
  callback: (requests: FriendRequestDocData[]) => void
): Unsubscribe {
  const reqRef = collection(db, USERS_COL, userId, 'friendRequests');
  return onSnapshot(reqRef, (snapshot) => {
    const requests: FriendRequestDocData[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FriendRequestDocData, 'id'>),
    }));
    callback(requests);
  }, (err) => {
    console.warn('Friend requests subscribe error:', err);
    callback([]);
  });
}

export async function sendFriendRequest(
  fromUser: { id: string; username: string; avatarUrl?: string; bountyPoints?: number; countryCode?: string },
  targetUsername: string
): Promise<void> {
  // Query user by username
  const q = query(collection(db, USERS_COL));
  const snap = await getDocs(q);
  const targetDoc = snap.docs.find(d => {
    const u = d.data();
    return u.username && u.username.toLowerCase() === targetUsername.toLowerCase();
  });

  if (!targetDoc) {
    throw new Error(`User "${targetUsername}" not found.`);
  }

  const targetId = targetDoc.id;
  if (targetId === fromUser.id) {
    throw new Error('You cannot add yourself as a friend.');
  }

  // Add friendRequest to target user's subcollection
  await setDoc(doc(db, USERS_COL, targetId, 'friendRequests', fromUser.id), {
    fromUid: fromUser.id,
    username: fromUser.username,
    avatarUrl: fromUser.avatarUrl || '',
    bp: fromUser.bountyPoints || 100,
    countryCode: fromUser.countryCode || 'id',
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAtServer: serverTimestamp(),
  });

  // Send notification to target user
  sendNotification({
    userId: targetId,
    type: 'new_quest',
    title: '👥 New Friend Request!',
    message: `${fromUser.username} sent you a friend request.`,
  }).catch(() => {});
}

export async function acceptFriendRequest(
  currentUserId: string,
  currentUser: { username: string; avatarUrl?: string; bountyPoints?: number; countryCode?: string },
  invitation: FriendRequestDocData
): Promise<void> {
  // 1. Add friend to currentUser's friends subcollection
  await setDoc(doc(db, USERS_COL, currentUserId, 'friends', invitation.fromUid), {
    friendUid: invitation.fromUid,
    username: invitation.username,
    avatarUrl: invitation.avatarUrl || '',
    status: 'online',
    bp: invitation.bp || 100,
    countryCode: invitation.countryCode || 'id',
    addedAt: new Date().toISOString(),
  });

  // 2. Add currentUser as friend in requester's friends subcollection
  await setDoc(doc(db, USERS_COL, invitation.fromUid, 'friends', currentUserId), {
    friendUid: currentUserId,
    username: currentUser.username,
    avatarUrl: currentUser.avatarUrl || '',
    status: 'online',
    bp: currentUser.bountyPoints || 100,
    countryCode: currentUser.countryCode || 'id',
    addedAt: new Date().toISOString(),
  });

  // 3. Delete invitation doc from currentUser's friendRequests subcollection
  await deleteDoc(doc(db, USERS_COL, currentUserId, 'friendRequests', invitation.id));
}

export async function declineFriendRequest(
  currentUserId: string,
  requestId: string
): Promise<void> {
  await deleteDoc(doc(db, USERS_COL, currentUserId, 'friendRequests', requestId));
}

export async function deleteFriend(
  currentUserId: string,
  friendUid: string
): Promise<void> {
  await deleteDoc(doc(db, USERS_COL, currentUserId, 'friends', friendUid));
  await deleteDoc(doc(db, USERS_COL, friendUid, 'friends', currentUserId)).catch(() => {});
}

/**
 * Delete a bounty document from Firestore.
 * If the bounty has approved submission(s), for each approved submission:
 * 1. Deducts reward BP from the hunter's user record in Firestore (-rewardAmount BP).
 * 2. Decrements the hunter's bountiesClaimedCount (-1).
 * 3. Cleans up all submission subcollection documents.
 * 4. Deletes the parent bounty document.
 */
export async function deleteBounty(bountyId: string): Promise<void> {
  const bountyRef = doc(db, BOUNTIES_COL, bountyId);
  const bountySnap = await getDoc(bountyRef);
  let rewardAmount = 100;

  if (bountySnap.exists()) {
    const bData = bountySnap.data() as Bounty;
    rewardAmount = bData.reward?.amount || 100;
  }

  // Fetch all submissions for this bounty
  const subSnap = await getDocs(collection(db, BOUNTIES_COL, bountyId, 'submissions'));

  for (const sDoc of subSnap.docs) {
    const sData = sDoc.data() as Submission;
    const isApproved = sData.status === 'approved';
    const hunterId = sData.hunterId;
    const hunterUsername = sData.hunterUsername;

    if (isApproved) {
      let userRef = hunterId ? doc(db, USERS_COL, hunterId) : null;
      let userSnap = userRef ? await getDoc(userRef) : null;

      // Fallback search by username
      if ((!userSnap || !userSnap.exists()) && hunterUsername) {
        const q = query(collection(db, USERS_COL));
        const allUsersSnap = await getDocs(q);
        const matchedDoc = allUsersSnap.docs.find(d => {
          const u = d.data();
          return u.username && u.username.toLowerCase() === hunterUsername.toLowerCase();
        });
        if (matchedDoc) {
          userRef = doc(db, USERS_COL, matchedDoc.id);
          userSnap = matchedDoc;
        }
      }

      if (userRef && userSnap && userSnap.exists()) {
        const userData = userSnap.data();
        const currentBp = userData.bountyPoints || 0;
        const currentCount = userData.bountiesClaimedCount || 0;

        const deductBp = sData.awardedBp !== undefined ? sData.awardedBp : rewardAmount;
        const newBp = Math.max(0, currentBp - deductBp);
        const newCount = Math.max(0, currentCount - 1);

        await updateDoc(userRef, {
          bountyPoints: newBp,
          bountiesClaimedCount: newCount,
          updatedAtServer: serverTimestamp(),
        }).catch(() => {});
      }
    }

    // Delete submission document
    await deleteDoc(sDoc.ref).catch(() => {});
  }

  // Delete parent bounty document
  await deleteDoc(bountyRef);
}

/**
 * Reset user BP to 100 and bountiesClaimedCount to 0 in Firestore
 */
export async function resetUserBp(userId: string, targetBp: number = 100): Promise<void> {
  const userRef = doc(db, USERS_COL, userId);
  await updateDoc(userRef, {
    bountyPoints: targetBp,
    bountiesClaimedCount: 0,
    updatedAtServer: serverTimestamp(),
  });
}

