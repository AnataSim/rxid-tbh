import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types/bounty';

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromUsername: string;
  fromPhotoURL?: string | null;
  toUid: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FriendUser {
  uid: string;
  username: string;
  photoURL?: string | null;
  osuId?: string;
  v4rxRank?: number;
  addedAt: string;
}

export interface UserSearchResult {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  osuId?: string;
  isSelf?: boolean;
}

/**
 * Sends a friend invitation matching Firestore security rules:
 * Path: /users/{targetUid}/friendRequests/{fromUid}
 */
/**
 * Sends a friend invitation matching Firestore security rules:
 * Path: /users/{targetUid}/friendRequests/{fromUid}
 */
export const sendFriendInvitation = async (
  fromUser: User, 
  targetUsernameOrUid: string
): Promise<void> => {
  const cleanTarget = targetUsernameOrUid.trim().toLowerCase();
  if (!cleanTarget) throw new Error('Masukkan username atau UID yang valid.');

  const currentUid = fromUser.id || fromUser.uid;
  const currentUsername = (fromUser.username || '').trim().toLowerCase();

  // 1. Search 'users' collection in Firestore strictly for registered accounts
  const usersSnap = await getDocs(collection(db, 'users'));
  let targetUser: { uid: string; username: string; photoURL: string | null } | null = null;

  usersSnap.forEach((d) => {
    const data = d.data();
    const username = (data.username || data.email?.split('@')[0] || '').toLowerCase();
    const osuIdStr = (data.osuId || '').toString().toLowerCase();

    if (username === cleanTarget || osuIdStr === cleanTarget || d.id.toLowerCase() === cleanTarget) {
      targetUser = {
        uid: d.id,
        username: data.username || targetUsernameOrUid.trim(),
        photoURL: data.avatarUrl || data.photoURL || null,
      };
    }
  });

  if (!targetUser) {
    throw new Error(`User atau UID "${targetUsernameOrUid}" tidak ditemukan di sistem.`);
  }

  const validTarget = targetUser as { uid: string; username: string; photoURL: string | null };
  const targetUid = validTarget.uid;

  if (targetUid === currentUid || (currentUsername && validTarget.username.trim().toLowerCase() === currentUsername)) {
    throw new Error('Kamu tidak dapat mengirim undangan pertemanan ke diri sendiri.');
  }

  // 2. Check if already friends at /users/{currentUid}/friends/{targetUid}
  const friendDocRef = doc(db, 'users', currentUid, 'friends', targetUid);
  const friendSnap = await getDoc(friendDocRef);
  if (friendSnap.exists()) {
    throw new Error(`Kamu sudah berteman dengan "${validTarget.username}".`);
  }

  // 3. Create new friend request at /users/{targetUid}/friendRequests/{fromUid}
  const requestDocRef = doc(db, 'users', targetUid, 'friendRequests', currentUid);
  const existingSnap = await getDoc(requestDocRef);
  if (existingSnap.exists()) {
    throw new Error(`Undangan pertemanan ke "${validTarget.username}" sudah dikirim sebelumnya.`);
  }

  const newRequest: Omit<FriendRequest, 'id'> = {
    fromUid: currentUid,
    fromUsername: fromUser.username || 'User',
    fromPhotoURL: fromUser.avatarUrl || null,
    toUid: targetUid,
    toUsername: validTarget.username,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await setDoc(requestDocRef, newRequest);
};

/**
 * Real-time subscription to incoming pending friend invitations under:
 * Path: /users/{currentUid}/friendRequests
 */
export const subscribeToIncomingRequests = (
  userOrUid: User | string, 
  onData: (requests: FriendRequest[]) => void
) => {
  const uid = typeof userOrUid === 'string' ? userOrUid : (userOrUid.id || userOrUid.uid);
  if (!uid) return () => {};

  const reqsCol = collection(db, 'users', uid, 'friendRequests');

  return onSnapshot(reqsCol, (snapshot) => {
    const list: FriendRequest[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.status === 'pending') {
        list.push({ id: d.id, ...data } as FriendRequest);
      }
    });
    onData(list);
  }, (err) => console.warn('Gagal memuat undangan pertemanan:', err));
};

/**
 * Real-time subscription to user's accepted friends list under:
 * Path: /users/{currentUid}/friends
 */
export const subscribeToFriendsList = (
  uid: string,
  onData: (friends: FriendUser[]) => void
) => {
  if (!uid) return () => {};
  const friendsCol = collection(db, 'users', uid, 'friends');

  return onSnapshot(friendsCol, (snapshot) => {
    const list: FriendUser[] = [];
    snapshot.forEach((d) => {
      list.push({ uid: d.id, ...d.data() } as FriendUser);
    });
    onData(list);
  }, (err) => console.warn('Gagal memuat daftar teman:', err));
};

/**
 * Accepts a friend invitation and synchronizes both friends subcollections.
 */
export const acceptFriendInvitation = async (
  currentUser: User,
  request: FriendRequest
): Promise<void> => {
  const now = new Date().toISOString();
  const currentUid = currentUser.id || currentUser.uid;
  const myPhoto = currentUser.avatarUrl || null;
  const myName = currentUser.username || 'User';

  // 1. Add sender to recipient's friends subcollection (/users/{currentUid}/friends/{fromUid})
  await setDoc(doc(db, 'users', currentUid, 'friends', request.fromUid), {
    uid: request.fromUid,
    username: request.fromUsername,
    photoURL: request.fromPhotoURL || null,
    addedAt: now,
  });

  // 2. Add recipient to sender's friends subcollection (/users/{fromUid}/friends/{currentUid})
  await setDoc(doc(db, 'users', request.fromUid, 'friends', currentUid), {
    uid: currentUid,
    username: myName,
    photoURL: myPhoto,
    addedAt: now,
  });

  // 3. Remove pending request from recipient's friendRequests subcollection
  await deleteDoc(doc(db, 'users', currentUid, 'friendRequests', request.id));
};

/**
 * Rejects/cancels a friend invitation.
 */
export const rejectFriendInvitation = async (currentUid: string, requestId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', currentUid, 'friendRequests', requestId));
};

/**
 * Searches strictly for existing users in Firestore.
 * Does NOT return dummy synthetic candidates if the user doesn't exist in database!
 */
export const searchUsernames = async (
  searchQuery: string,
  currentUid?: string,
  currentUsername?: string
): Promise<UserSearchResult[]> => {
  const clean = searchQuery.trim().toLowerCase();
  if (!clean) return [];

  try {
    const resultsMap = new Map<string, UserSearchResult>();

    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((d) => {
      const uid = d.id;
      const data = d.data();
      const username = data.username || data.email?.split('@')[0] || 'User';
      const osuIdStr = (data.osuId || '').toString().toLowerCase();

      if (
        username.toLowerCase().includes(clean) ||
        osuIdStr.includes(clean) ||
        uid.toLowerCase().includes(clean) ||
        (data.email && data.email.toLowerCase().includes(clean))
      ) {
        const isSelf = uid === currentUid || (currentUsername && username.trim().toLowerCase() === currentUsername.trim().toLowerCase());
        resultsMap.set(uid, {
          uid,
          displayName: username,
          photoURL: data.avatarUrl || data.photoURL || null,
          osuId: data.osuId,
          isSelf: Boolean(isSelf),
        });
      }
    });

    return Array.from(resultsMap.values()).slice(0, 8);
  } catch (err) {
    console.warn('Gagal mencari username:', err);
    return [];
  }
};
