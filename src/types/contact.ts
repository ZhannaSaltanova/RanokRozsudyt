export type BlockDuration = 'morning' | '3days' | '7days' | 'forever' | 'custom';

export type BlockedContact = {
  id: string;
  name: string;
  phones: string[]; // всі заблоковані номери
  reason: string;
  note?: string;
  duration: BlockDuration;
  customHours?: number;
  blockedUntil: number | null;
  addedAt: number;
};

export const DURATION_LABELS: Record<BlockDuration, string> = {
  morning: 'До ранку',
  '3days': '3 дні',
  '7days': '7 днів',
  forever: 'Назавжди',
  custom: 'Свій варіант',
};

export function calcBlockedUntil(
  duration: BlockDuration,
  customHours?: number,
): number | null {
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
  if (duration === '7days') {
    return now.getTime() + 7 * 24 * 60 * 60 * 1000;
  }
  // custom
  if (duration === 'custom' && customHours && customHours > 0) {
    return now.getTime() + customHours * 60 * 60 * 1000;
  }
  return now.getTime() + 24 * 60 * 60 * 1000; // fallback
}

export function getTimeLeftLabel(blockedUntil: number | null): string {
  if (blockedUntil === null) {
    return 'Назавжди';
  }

  const diff = blockedUntil - Date.now();
  if (diff <= 0) {
    return 'Закінчилось';
  }

  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours >= 48) {
    const days = Math.round(hours / 24);
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}`;
  }
  if (hours >= 1) {
    return `${hours} год`;
  }
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} хв`;
}
