// --- LockRule ---

export type LockRule = {
  startHour: number; // година початку підвищеного ризику (напр. 22)
  endHour: number;   // година завершення (напр. 8)
  weekendsOnly: boolean; // тільки пт/сб/нд чи щодня
};

export const DEFAULT_LOCK_RULE: LockRule = {
  startHour: 22,
  endHour: 8,
  weekendsOnly: false,
};

export function isLockActive(rule: LockRule = DEFAULT_LOCK_RULE): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=нд, 1=пн, ..., 5=пт, 6=сб

  if (rule.weekendsOnly) {
    const isRiskyDay = day === 5 || day === 6 || day === 0;
    if (!isRiskyDay) {return false;}
  }

  // overnight: наприклад 22:00 → 08:00
  if (rule.startHour > rule.endHour) {
    return hour >= rule.startHour || hour < rule.endHour;
  }
  return hour >= rule.startHour && hour < rule.endHour;
}

// --- AttemptLog ---

export type AttemptAction = 'call' | 'message';
export type AttemptResult = 'passed' | 'blocked' | 'abandoned';

export type AttemptLog = {
  id: string;
  contactId: string;
  contactName: string;
  action: AttemptAction;
  result: AttemptResult;
  timestamp: number;
  riskScore: number;
};

// --- PartyMode ---

export type PartyModeDuration = '3h' | 'morning' | 'night' | 'custom';

export type PartyMode = {
  label: string;
  duration: PartyModeDuration;
  activatedAt: number;
  activeUntil: number; // timestamp
};

export const PARTY_MODE_OPTIONS: {
  label: string;
  emoji: string;
  duration: PartyModeDuration;
  description: string;
}[] = [
  {label: 'Я на вечірці', emoji: '🎉', duration: '3h', description: 'Заблокувати на 3 години'},
  {label: 'До ранку', emoji: '🌙', duration: 'morning', description: 'Заблокувати до 08:00'},
  {label: "П'ятниця", emoji: '🍷', duration: 'night', description: 'Заблокувати до 10:00'},
];

export function calcPartyModeUntil(duration: PartyModeDuration): number {
  const now = new Date();

  if (duration === '3h') {
    return now.getTime() + 3 * 60 * 60 * 1000;
  }
  if (duration === 'morning') {
    const t = new Date();
    t.setHours(8, 0, 0, 0);
    if (t <= now) {t.setDate(t.getDate() + 1);}
    return t.getTime();
  }
  if (duration === 'night') {
    const t = new Date();
    t.setHours(10, 0, 0, 0);
    if (t <= now) {t.setDate(t.getDate() + 1);}
    return t.getTime();
  }
  // custom — fallback до ранку
  const t = new Date();
  t.setHours(8, 0, 0, 0);
  if (t <= now) {t.setDate(t.getDate() + 1);}
  return t.getTime();
}

// --- Risk scoring ---

export type RiskInput = {
  isLockTime: boolean;       // нічний час за LockRule
  isWeekend: boolean;        // пт/сб/нд
  isBlockedContact: boolean; // контакт у списку захисту
  partyModeActive: boolean;  // ручний режим "я п'ю"
  failedSoberTest: boolean;  // провалений тест у цій сесії
  repeatedAttempts: number;  // спроби за останні 5 хв
};

export function calculateRiskScore(input: RiskInput): number {
  let score = 0;

  if (input.isLockTime) {score += 25;}
  if (input.isWeekend) {score += 15;}
  if (input.isBlockedContact) {score += 30;}
  if (input.partyModeActive) {score += 20;}
  if (input.failedSoberTest) {score += 30;}
  if (input.repeatedAttempts >= 2) {score += 15;}
  if (input.repeatedAttempts >= 4) {score += 25;}

  return Math.min(score, 100);
}

export type ProtectionLevel =
  | 'allow'
  | 'cooldown'
  | 'sober_test'
  | 'block_until_morning';

export function getProtectionLevel(score: number): ProtectionLevel {
  if (score >= 80) {return 'block_until_morning';}
  if (score >= 60) {return 'sober_test';}
  if (score >= 30) {return 'cooldown';}
  return 'allow';
}

export const PROTECTION_LEVEL_LABELS: Record<ProtectionLevel, string> = {
  allow: 'Дозволено',
  cooldown: 'Пауза перед рішенням',
  sober_test: 'Потрібна перевірка',
  block_until_morning: 'Заблоковано до ранку',
};

// Скільки хвилин cooldown залежно від рівня ризику
export function getCooldownMinutes(score: number): number {
  if (score >= 70) {return 15;}
  if (score >= 50) {return 5;}
  return 1;
}
