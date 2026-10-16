/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { isValidApiKey, useApiKey } from '@/lib/api-key';
import React, { useEffect, useState } from 'react';

export interface ExtendedErrorType {
  code?: number;
  message?: string;
  status?: string;
}

export default function ErrorScreen() {
  const { client } = useLiveAPIContext();
  const { openApiKeyModal } = useApiKey();
  const [error, setError] = useState<{ message?: string } | null>(null);

  useEffect(() => {
    function onError(error: ErrorEvent) {
      console.error(error);
      setError(error);
    }

    client.on('error', onError);

    return () => {
      client.off('error', onError);
    };
  }, [client]);

  if (!error) {
    return <div style={{ display: 'none' }} />;
  }

  const raw = error.message || '';
  let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  let hint: string | null = null;
  let tryAgainOption = true;
  let showKeyButton = false;

  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
    errorMessage = 'تم استهلاك الحصة المجانية اليومية لـ Gemini Live API.';
    hint = 'حاول مرة أخرى غداً، أو استخدم مفتاح API من حساب Google آخر.';
    tryAgainOption = false;
  } else if (
    raw.includes('API key') ||
    raw.includes('API_KEY') ||
    raw.includes('UNAUTHENTICATED') ||
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('401') ||
    raw.includes('403')
  ) {
    errorMessage = 'مفتاح Gemini API غير صالح أو غير مصرّح له بالوصول.';
    hint = 'تأكد من نسخ المفتاح كاملاً من Google AI Studio ثم أعد إدخاله من زر «المفتاح».';
    showKeyButton = true;
  } else if (raw.includes('not connected') || raw.includes('Client is not connected')) {
    errorMessage = 'لا يوجد اتصال نشط بالمساعد الصوتي.';
    hint = 'اضغط على زر «اتصال صوتي» لبدء جلسة جديدة.';
  } else if (raw.toLowerCase().includes('network') || raw.toLowerCase().includes('fetch')) {
    errorMessage = 'تعذر الوصول إلى خدمة Gemini. تحقق من اتصال الإنترنت.';
    hint = 'إذا كنت على شبكة مؤسسية فقد يكون الاتصال بخدمات Google محجوباً.';
  }

  return (
    <div className="error-screen" dir="rtl">
      <div style={{ fontSize: 48 }}>💔</div>
      <div
        className="error-message-container"
        style={{ fontSize: 22, lineHeight: 1.4, opacity: 0.9 }}
      >
        {errorMessage}
        {hint ? (
          <div style={{ fontSize: 15, opacity: 0.6, marginTop: 12 }}>{hint}</div>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {tryAgainOption ? (
          <button
            className="close-button"
            onClick={() => {
              setError(null);
            }}
          >
            إغلاق
          </button>
        ) : null}
        {showKeyButton ? (
          <button
            className="close-button"
            onClick={() => {
              setError(null);
              openApiKeyModal();
            }}
          >
            إدخال مفتاح API
          </button>
        ) : null}
      </div>
      {raw ? (
        <div
          className="error-raw-message-container"
          style={{ fontSize: 13, lineHeight: 1.4, opacity: 0.35, direction: 'ltr' }}
        >
          {raw}
        </div>
      ) : null}
    </div>
  );
}
