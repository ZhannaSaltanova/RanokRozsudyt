export type BlockDuration = 'morning' | '3days' | '7days' | 'forever';

export type BlockedContact = {
  id: string;
  name: string;
  phone?: string;
  reason: string;
  note?: string; // крик душі — необов'язково
  duration: BlockDuration;
  blockedUntil: number | null; // timestamp або null = назавжди
  addedAt: number;
};

export const DURATION_LABELS: Record<BlockDuration, string> = {
  morning: 'До ранку',
  '3days': '3 дні',
  '7days': '7 днів',
  forever: 'Назавжди',
};

export function calcBlockedUntil(duration: BlockDuration): number | null {
  const now = new Date();

  if (duration === 'forever') {
    return null;
  }
  if (duration === 'morning') {
    const morning = new Date();
    morning.setHours(8, 0, 0, 0);
    if (morning <= now) {
      morning.setDate(morning.getDate() + 1);
    }
    return morning.getTime();
  }
  if (duration === '3days') {
    return now.getTime() + 3 * 24 * 60 * 60 * 1000;
  }
  // 7days
  return now.getTime() + 7 * 24 * 60 * 60 * 1000;
}

export function getTimeLeftLabel(blockedUntil: number | null): string {
  if (blockedUntil === null) {
    return 'Назавжди';
  }

  const diff = blockedUntil - Date.now();
  if (diff <= 0) {
    return 'Закінчилось';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}`;
  }
  if (hours >= 1) {
    return `${hours} год`;
  }
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} хв`;
}
