/**
 * v4rxDatabase.ts
 *
 * Legacy localStorage helpers have been removed.
 * All data is now in Firebase (Firestore) — see firestoreService.ts
 * osuApi utilities are kept here for reference.
 */

// Re-export osu! URL utilities for convenience
export { parseOsuUrl, getOsuCoverUrls, formatDuration, fetchBeatmapMetadata } from './osuApi';
