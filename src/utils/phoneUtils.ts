/**
 * Утиліти для роботи з номерами телефону.
 * Поточна підтримка: тільки українські номери.
 * Закордонні номери — фіча в PLAN.md (фаза 1, задача 1.19)
 */

/**
 * Нормалізує український номер до локального формату 0XXXXXXXXX.
 * Саме в такому вигляді зберігаємо в базі.
 *
 *   0671234567       → 0671234567   (вже норм)
 *   380671234567     → 0671234567
 *   +380671234567    → 0671234567
 *   (067) 123-45-67  → 0671234567
 *   067 123 45 67    → 0671234567
 *
 * Якщо номер не розпізнано — повертає оригінал як є.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // 380XXXXXXXXX → 0XXXXXXXXX
  if (/^380\d{9}$/.test(digits)) {
    return `0${digits.slice(3)}`;
  }

  // 0XXXXXXXXX — вже норм
  if (/^0\d{9}$/.test(digits)) {
    return digits;
  }

  // +380XXXXXXXXX → 0XXXXXXXXX
  const stripped = raw.trim().replace(/^\+38/, '');
  const strippedDigits = stripped.replace(/\D/g, '');
  if (/^0\d{9}$/.test(strippedDigits)) {
    return strippedDigits;
  }

  return raw.trim();
}

/**
 * Перевіряє чи номер є валідним українським.
 * Повертає рядок з помилкою або null якщо все ок.
 *
 * Порожній рядок вважається валідним (поле необов'язкове).
 */
export function validatePhone(raw: string): string | null {
  if (!raw.trim()) {return null;}

  const digits = raw.replace(/\D/g, '');

  const isValid =
    /^0\d{9}$/.test(digits) ||
    /^380\d{9}$/.test(digits) ||
    /^\+380\d{9}$/.test(raw.trim());

  if (!isValid) {
    return 'Невірний формат. Приклад: 0971234567';
  }

  return null;
}

/**
 * Перевіряє чи два номери — один і той самий контакт.
 */
export function isSamePhone(a?: string, b?: string): boolean {
  if (!a || !b) {return false;}
  return normalizePhone(a) === normalizePhone(b);
}

/**
 * Форматує номер для відображення: 0671234567 → (067) 123-45-67
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);

  if (/^0\d{9}$/.test(normalized)) {
    return normalized;
  }

  return phone;
}
