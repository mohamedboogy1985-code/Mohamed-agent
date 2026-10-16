/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

/**
 * إدارة مفتاح Gemini API وقت التشغيل.
 *
 * أولويات الحصول على المفتاح:
 *  1) المفتاح الذي يُدخله المستخدم من الواجهة (يُحفظ في localStorage على جهازه فقط).
 *  2) المفتاح الموجود في ملف .env وقت البناء (GEMINI_API_KEY / API_KEY).
 *
 * ملاحظة: يتصل المتصفح مباشرة بخدمة Gemini Live API، لذلك يظهر المفتاح داخل
 * جهاز المستخدم فقط ولا يُرسل إلى أي سيرفر وسيط.
 */

const STORAGE_KEY = 'chatterbots.gemini_api_key';

/** المفتاح القادم من ملف .env وقت البناء (يستبدله Vite نصياً — راجع vite.config.ts) */
export const BUILD_TIME_API_KEY: string = (
  (process.env.GEMINI_API_KEY as string) ||
  (process.env.API_KEY as string) ||
  ''
).trim();

/** هل يبدو المفتاح صالحاً من حيث الشكل؟ (واجهات Gemini تبدأ عادة بـ AIza...) */
export function isValidApiKey(key?: string | null): boolean {
  const k = (key || '').trim();
  if (k.length < 20) return false;
  if (/^(your|MY|changeme|xxx)/i.test(k)) return false;
  return true;
}

export function maskApiKey(key: string): string {
  const k = (key || '').trim();
  if (!k) return '—';
  if (k.length <= 10) return '••••••';
  return `${k.slice(0, 6)}••••••${k.slice(-4)}`;
}

function readStoredKey(): string {
  try {
    return (window.localStorage.getItem(STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

function writeStoredKey(key: string) {
  try {
    if (key) window.localStorage.setItem(STORAGE_KEY, key);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('تعذر حفظ مفتاح API محلياً:', e);
  }
}

export interface ApiKeyState {
  apiKey: string;
  /** مصدر المفتاح الحالي: من الواجهة أم من ملف .env */
  source: 'local' | 'env' | 'none';
  isModalOpen: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;
}

export const useApiKey = create<ApiKeyState>((set) => {
  const stored = readStoredKey();
  const initial = stored || BUILD_TIME_API_KEY;
  return {
    apiKey: initial,
    source: stored ? 'local' : BUILD_TIME_API_KEY ? 'env' : 'none',
    // افتح نافذة إدخال المفتاح تلقائياً إذا لم يوجد مفتاح صالح
    isModalOpen: !isValidApiKey(initial),

    setApiKey: (key: string) => {
      const clean = (key || '').trim();
      writeStoredKey(clean);
      set({
        apiKey: clean,
        source: clean ? 'local' : BUILD_TIME_API_KEY ? 'env' : 'none',
        isModalOpen: false,
      });
    },

    clearApiKey: () => {
      writeStoredKey('');
      const fallback = BUILD_TIME_API_KEY;
      set({
        apiKey: fallback,
        source: fallback ? 'env' : 'none',
        isModalOpen: !isValidApiKey(fallback),
      });
    },

    openApiKeyModal: () => set({ isModalOpen: true }),
    closeApiKeyModal: () => set({ isModalOpen: false }),
  };
});
