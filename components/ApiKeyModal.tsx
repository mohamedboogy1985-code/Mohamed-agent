/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import {
  BUILD_TIME_API_KEY,
  isValidApiKey,
  maskApiKey,
  useApiKey,
} from '@/lib/api-key';
import { useUI } from '@/lib/state';
import { KeyRound, ExternalLink, ShieldCheck, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  /** يُستدعى بعد حفظ مفتاح صالح حتى يبدأ الاتصال الصوتي تلقائياً */
  onSaved?: () => void;
  /** هل يمكن للمستخدم إغلاق النافذة والمتابعة بدون مفتاح؟ */
  allowSkip?: boolean;
}

const AI_STUDIO_URL = 'https://aistudio.google.com/apikey';

export default function ApiKeyModal({ onSaved, allowSkip = true }: ApiKeyModalProps) {
  const { apiKey, source, setApiKey, clearApiKey, closeApiKeyModal } = useApiKey();
  const { addEventLog } = useUI();

  const [value, setValue] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(apiKey);
  }, [apiKey]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = value.trim();

    if (!clean) {
      setError('يرجى لصق مفتاح Gemini API أولاً.');
      return;
    }
    if (!isValidApiKey(clean)) {
      setError(
        'المفتاح المدخل يبدو غير مكتمل. مفتاح Google AI Studio يبدأ عادة بـ AIza ويكون طوله نحو 39 حرفاً.'
      );
      return;
    }

    setError(null);
    setApiKey(clean);
    addEventLog({
      type: 'system',
      text: 'تم حفظ مفتاح Gemini API بنجاح في هذا المتصفح. اضغط على «اتصال صوتي» لبدء المحادثة.',
    });
    onSaved?.();
  };

  return (
    <Modal onClose={allowSkip ? closeApiKeyModal : () => {}}>
      <div dir="rtl" className="flex flex-col gap-5 text-zinc-100">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              مفتاح Gemini API لتشغيل الوكلاء الصوتيين
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              هذا التطبيق يعمل بالذكاء الاصطناعي الصوتي الحيّ (Gemini Live API). لكي يستمع إليك
              المساعد المحاسبي ويردّ بصوته، يلزم مفتاح API مجاني من Google AI Studio.
            </p>
          </div>
        </div>

        <ol className="text-xs text-zinc-300 space-y-1.5 bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
          <li>
            1) افتح صفحة المفاتيح:{' '}
            <a
              href={AI_STUDIO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
            >
              Google AI Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>2) اضغط «Create API key» ثم انسخ المفتاح (يبدأ بـ AIza).</li>
          <li>3) الصقه في الحقل أدناه واضغط «حفظ وتشغيل».</li>
        </ol>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-zinc-300" htmlFor="gemini-api-key">
            مفتاح Gemini API
          </label>
          <div className="relative">
            <input
              id="gemini-api-key"
              dir="ltr"
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
              spellCheck={false}
              className="w-full px-3 py-2.5 pl-10 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              title={show ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl p-2.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-emerald-300/90">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              يُحفظ المفتاح في متصفحك فقط (localStorage) ولا يُرسل إلى أي سيرفر خارجي غير Google.
            </span>
          </div>

          {source === 'env' && BUILD_TIME_API_KEY && (
            <p className="text-[11px] text-zinc-400">
              يوجد مفتاح مُضمَّن من ملف <span className="font-mono">.env</span> (
              <span className="font-mono">{maskApiKey(BUILD_TIME_API_KEY)}</span>) ويمكنك استبداله
              بمفتاح خاص بك.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 transition-colors"
            >
              حفظ وتشغيل
            </button>

            {allowSkip && (
              <button
                type="button"
                onClick={closeApiKeyModal}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                استعراض الواجهة فقط
              </button>
            )}

            {apiKey && (
              <button
                type="button"
                onClick={() => {
                  clearApiKey();
                  setValue('');
                  setError(null);
                  addEventLog({ type: 'system', text: 'تم حذف مفتاح API من هذا المتصفح.' });
                }}
                className="ml-auto px-3 py-2 rounded-xl bg-transparent hover:bg-rose-950/40 text-rose-300 text-[11px] font-medium flex items-center gap-1.5 border border-transparent hover:border-rose-900/60 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف المفتاح الحالي
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
