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

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    isExpired: false,
    badgeText: formatted,
    formatted,
    days,
    hours,
    minutes,
    seconds,
  };
}
