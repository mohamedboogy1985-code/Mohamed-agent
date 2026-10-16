/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modality } from '@google/genai';
import { LiveAPIProvider, useLiveAPIContext } from './contexts/LiveAPIContext';
import { useAgent, useUI, useUser } from './lib/state';
import { isValidApiKey, useApiKey } from './lib/api-key';
import { createSystemInstructions } from './lib/prompts';
import { ACCOUNTING_FUNCTION_DECLARATIONS } from './lib/accounting-tools';
import { accountingDB } from './lib/accounting-db';

import ApiKeyModal from './components/ApiKeyModal';
import { Navbar } from './components/Navbar';
import { VoiceConsole } from './components/voice/VoiceConsole';
import { DashboardOverview } from './components/accounting/DashboardOverview';
import { JournalLedger } from './components/accounting/JournalLedger';
import { ChartOfAccountsView } from './components/accounting/ChartOfAccountsView';
import { OfflineSyncView } from './components/accounting/OfflineSyncView';
import { NewEntryModal } from './components/modals/NewEntryModal';
import ErrorScreen from './components/demo/ErrorSreen';

function AccountingVoiceApp() {
  const { client, connected, connect, setConfig } = useLiveAPIContext();
  const { current } = useAgent();
  const user = useUser();
  const { activeTab, addEventLog } = useUI();
  const { apiKey, isModalOpen, openApiKeyModal } = useApiKey();

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // بدء الاتصال الصوتي تلقائياً بعد حفظ مفتاح API من الواجهة
  const pendingAutoConnect = useRef(false);
  const handleKeySaved = useCallback(() => {
    pendingAutoConnect.current = true;
  }, []);

  useEffect(() => {
    if (pendingAutoConnect.current && isValidApiKey(apiKey) && !connected) {
      pendingAutoConnect.current = false;
      connect();
    }
  }, [apiKey, connected, connect]);

  // Update Live API configuration with accounting tools & system prompt
  useEffect(() => {
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: current.voice },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: createSystemInstructions(current, user),
          },
        ],
      },
      tools: [
        {
          functionDeclarations: ACCOUNTING_FUNCTION_DECLARATIONS,
        },
      ],
    });
  }, [setConfig, current, user]);

  // Initial greeting when voice session is established
  useEffect(() => {
    if (connected) {
      client.send(
        {
          text: `ابدأ بالتحية للأستاذ (${user.name}) باللغة العربية، وعرّف عن نفسك كـ (${current.name}) من (${user.companyName}) واذكر بجملة واحدة موجزة أنك جاهز لمساعدته في استعلام الأرصدة وتسجيل القيود المحاسبية للنقابة بالجنيه المصري (ج.م).`,
        },
        true
      );
      addEventLog({
        type: 'system',
        text: `تم بدء الجلسة الصوتية الحية مع ${current.name} بنجاح.`,
      });
    }
  }, [connected, client, user.name, user.companyName, current.name, addEventLog]);

  // Monitor sync queue count
  const checkPendingSync = async () => {
    try {
      const q = await accountingDB.getSyncQueue();
      const unsynced = q.filter((i) => !i.synced).length;
      setPendingSyncCount(unsynced);
    } catch (e) {
      console.error('Failed to check sync queue', e);
    }
  };

  useEffect(() => {
    checkPendingSync();
    accountingDB.on('change', checkPendingSync);
    const interval = setInterval(checkPendingSync, 30000);
    return () => {
      accountingDB.off('change', checkPendingSync);
      clearInterval(interval);
    };
  }, []);

  // Online / offline listeners & automatic sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      addEventLog({
        type: 'system',
        text: 'تمت استعادة الاتصال بالإنترنت. جاري مزامنة القيود المحلية تلقائياً...',
      });
      const { syncedCount } = await accountingDB.syncPending();
      if (syncedCount > 0) {
        setPendingSyncCount(0);
        addEventLog({
          type: 'system',
          text: `تمت مزامنة ${syncedCount} قيود بنجاح إلى السحابة.`,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      addEventLog({
        type: 'system',
        text: 'انقطع الاتصال بالإنترنت. تم تفعيل وضع عدم الاتصال (IndexedDB). القيود ستُحفظ محلياً.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addEventLog]);

  const handleManualSync = async () => {
    const { syncedCount } = await accountingDB.syncPending();
    await checkPendingSync();
    if (syncedCount > 0) {
      addEventLog({
        type: 'system',
        text: `تمت مزامنة ${syncedCount} قيود معلقة.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      <ErrorScreen />
      {isModalOpen && <ApiKeyModal onSaved={handleKeySaved} />}

      {/* تنبيه عند غياب مفتاح API */}
      {!isValidApiKey(apiKey) && !isModalOpen && (
        <div className="bg-amber-950/50 border-b border-amber-800/60 text-amber-200 text-xs px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
          <AlertTriangleIcon />
          <span>
            لم يتم إدخال مفتاح Gemini API بعد — لن يعمل المساعد الصوتي حتى تضيف مفتاحك.
          </span>
          <button
            onClick={openApiKeyModal}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-[11px]"
          >
            إدخال المفتاح الآن
          </button>
        </div>
      )}

      <Navbar
        onSync={handleManualSync}
        pendingSyncCount={pendingSyncCount}
        isOnline={isOnline}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice Console & Interactive Avatar (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <VoiceConsole />
          </div>

          {/* Right Column: Accounting System Tabs (7 cols) */}
          <div className="lg:col-span-7">
            {activeTab === 'overview' && <DashboardOverview />}
            {activeTab === 'journal' && <JournalLedger />}
            {activeTab === 'accounts' && <ChartOfAccountsView />}
            {activeTab === 'offline_sync' && (
              <OfflineSyncView
                onSync={handleManualSync}
                pendingSyncCount={pendingSyncCount}
                isOnline={isOnline}
              />
            )}
          </div>
        </div>
      </main>

      <NewEntryModal />
    </div>
  );
}

/** أيقونة التنبيه الداخلية (تفادي تكرار الاستيراد) */
function AlertTriangleIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function App() {
  const { apiKey } = useApiKey();

  return (
    // يتغيّر المزوّد تلقائياً عند تغيير المفتاح لأن useLiveApi يعيد إنشاء عميل Gemini
    <LiveAPIProvider apiKey={apiKey}>
      <AccountingVoiceApp />
    </LiveAPIProvider>
  );
}
