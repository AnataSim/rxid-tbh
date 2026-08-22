export interface CountdownResult {
  isExpired: boolean;
  badgeText: string;
  formatted: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculates countdown until deadlineAt timestamp
 * Returns formatted days, hours, minutes, seconds (e.g. "3d 12h" or "12h 45m" or "LIMITED" when expired)
 */
export function calculateCountdown(deadlineAt?: string): CountdownResult | null {
  if (!deadlineAt) return null;
  const target = new Date(deadlineAt).getTime();
  if (isNaN(target)) return null;

  const diff = target - Date.now();
  if (diff <= 0) {
    return {
      isExpired: true,
      badgeText: 'LIMITED',
      formatted: 'LIMITED',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const formatted = `${daysLeft}d`;

  return {
    isExpired: false,
    badgeText: formatted,
    formatted,
    days: daysLeft,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
}
