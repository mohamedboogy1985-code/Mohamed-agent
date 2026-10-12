/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Modality } from '@google/genai';
import { LiveAPIProvider, useLiveAPIContext } from './contexts/LiveAPIContext';
import { useAgent, useUI, useUser } from './lib/state';
import { createSystemInstructions } from './lib/prompts';
import { ACCOUNTING_FUNCTION_DECLARATIONS } from './lib/accounting-tools';
import { accountingDB } from './lib/accounting-db';

import { Navbar } from './components/Navbar';
import { VoiceConsole } from './components/voice/VoiceConsole';
import { DashboardOverview } from './components/accounting/DashboardOverview';
import { JournalLedger } from './components/accounting/JournalLedger';
import { ChartOfAccountsView } from './components/accounting/ChartOfAccountsView';
import { OfflineSyncView } from './components/accounting/OfflineSyncView';
import { NewEntryModal } from './components/modals/NewEntryModal';
import ErrorScreen from './components/demo/ErrorSreen';

const API_KEY = (process.env.GEMINI_API_KEY || process.env.API_KEY || '') as string;

function AccountingVoiceApp() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const { current } = useAgent();
  const user = useUser();
  const { activeTab, addEventLog } = useUI();

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

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

export default function App() {
  return (
    <LiveAPIProvider apiKey={API_KEY}>
      <AccountingVoiceApp />
    </LiveAPIProvider>
  );
}
