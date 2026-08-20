import {
  collection, doc, setDoc, updateDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppNotification } from '../types/bounty';

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
) {
  if (!userId) return () => {};

  try {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snap) => {
        const list: AppNotification[] = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as unknown as AppNotification))
          .filter(n => n.userId === userId || n.userId === 'all');
        callback(list);
      },
      (err) => {
        console.warn('Firestore notification query error:', err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('Notification subscription failed:', err);
    callback([]);
    return () => {};
  }
}

export async function sendNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
  const docRef = doc(collection(db, 'notifications'));
  const notification: AppNotification = {
    ...n,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    read: false,
  };

  await setDoc(docRef, {
    ...notification,
    createdAtServer: serverTimestamp(),
  }).catch(err => {
    console.warn('Could not write notification to Firestore:', err);
  });
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
}
