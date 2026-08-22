export type Role = 'bounty_giver' | 'bounty_hunter' | 'admin';

export interface User {
  id: string;          // Firestore doc ID = Firebase Auth UID
  uid: string;         // Firebase Auth UID (same as id)
  osuId?: string;      // v4rx.me numeric User ID (e.g. 83)
  email: string;
  username: string;    // Display name / v4rx username
  avatarUrl: string;   // https://a.ppy.sh/{osuId} or placeholder
  countryCode?: string;// e.g. 'ID', 'US', 'JP'
  countryFlag?: string;// e.g. '🇮🇩', '🇺🇸', '🇯🇵'
  v4rxRank: number;
  v4rxPp: number;
  v4rxAccuracy: number;
  playCount: number;
  role: Role;
  bountyPoints: number;
  bountiesPostedCount: number;
  bountiesClaimedCount: number;
  title: string;
  createdAt: string;   // e.g. "2026-08-18T00:00:00Z"
  lastLoginAt?: string;// e.g. "2026-08-20T08:18:00Z"
  lastBpUpdatedAt?: string; // Timestamp when BP was last earned/updated
}

export interface BeatmapMetadata {
  beatmapsetId: number;
  beatmapId: number;
  title: string;
  artist: string;
  mapper: string;
  starRating: number;
  durationSeconds: number;
  durationFormatted: string;
  playCount: number;
  status: 'Ranked' | 'Loved' | 'Qualified' | 'Pending' | 'Graveyard';
  coverUrl: string;
  cardUrl: string;
  slimCoverUrl: string;
  postedDate: string;
  updatedDate: string;
  mode: 'osu' | 'taiko' | 'catch' | 'mania';
}

export interface Submission {
  id: string;
  bountyId: string;
  hunterId: string;
  hunterUsername: string;
  hunterAvatar: string;
  proofImageUrl: string;
  replayUrl?: string;
  scoreUrl?: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
  awardedBp?: number;
  bpMultiplier?: number;
  awardedTier?: 1 | 2;
}

export interface Bounty {
  id: string;
  beatmap: BeatmapMetadata;
  giver: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  reward: {
    amount: number;
    currency: 'BP' | 'USD' | 'Supporter';
  };
  isDualReward?: boolean;
  rewardTier1?: number;
  rewardTier2?: number;
  instructionTier1?: string;
  instructionTier2?: string;
  instructions: string;
  rules: string[];
  tags: string[];
  skillsets?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  createdAt: string;
  deadline?: string;
  submissions: Submission[];
  views: number;
  avgDifficulty?: number;
  difficultyRatings?: Record<string, number>;
  bannedHunters?: string[];     // User IDs of banned players
  bannedUsernames?: string[];   // Display usernames of banned players
}

export interface AppNotification {
  id: string;
  userId: string;       // Target user ID or 'all'
  type: 'new_quest' | 'proof_submitted' | 'proof_approved' | 'proof_rejected';
  title: string;
  message: string;
  bountyId?: string;
  createdAt: string;
  read: boolean;
}

