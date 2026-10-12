/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { accountingDB, SyncItem } from '@/lib/accounting-db';
import {
  Database,
  HardDrive,
  RefreshCw,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Wifi,
  WifiOff,
  CloudUpload,
} from 'lucide-react';

interface OfflineSyncViewProps {
  onSync: () => Promise<void>;
  pendingSyncCount: number;
  isOnline: boolean;
}

export const OfflineSyncView: React.FC<OfflineSyncViewProps> = ({
  onSync,
  pendingSyncCount,
  isOnline,
}) => {
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Check if running inside Electron desktop container
  const isElectron =
    typeof window !== 'undefined' &&
    ((window as any).electronAPI !== undefined ||
      window.navigator.userAgent.toLowerCase().includes('electron'));

  const loadQueue = async () => {
    try {
      const q = await accountingDB.getSyncQueue();
      setSyncQueue(q);
    } catch (e) {
      console.error('Failed to load sync queue', e);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [pendingSyncCount]);

  const handleManualSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      await onSync();
      await loadQueue();
      setMessage('تمت المزامنة بنجاح وحفظ كافة القيود.');
    } catch (e) {
      setMessage('حدث خطأ أثناء المزامنة.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await accountingDB.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounting-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('تم تصدير النسخة الاحتياطية بنجاح.');
    } catch (e) {
      console.error('Export error', e);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين البيانات إلى القيود النموذجية؟')) {
      await accountingDB.resetSampleData();
      await loadQueue();
      setMessage('تمت إعادة تعيين البيانات النموذجية.');
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-6 text-zinc-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            المزامنة المحلية وتقنيات Electron & IndexedDB
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            إدارة التخزين المحلي والعمل دون اتصال ومزامنة القيود تلقائياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={syncing || !isOnline}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              !isOnline
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>مزامنة القيود المعلقة</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Grid: Storage cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Network & Offline Status */}
        <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300">حالة الشبكة</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="text-sm font-bold text-white">
            {isOnline ? 'متصل بالإنترنت' : 'وضع عدم الاتصال (Offline)'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {isOnline
              ? 'البيانات تُزامن مباشرة مع محرك الذكاء الاصطناعي.'
              : 'يتم حفظ القيود محلياً في IndexedDB ريثما يتوفر الاتصال.'}
          </p>
        </div>

        {/* IndexedDB Database Status */}
        <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300">قاعدة البيانات المحلية</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-sm font-bold text-white">IndexedDB (Active)</div>
          <p className="text-[11px] text-zinc-500 mt-1">
            مخزن الكائنات: الحسابات، قيود اليومية، العملاء والموردين.
          </p>
        </div>

        {/* Electron Container Status */}
        <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300">بيئة سطح المكتب</span>
            <Laptop className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white">
            {isElectron ? 'Electron Desktop Mode' : 'Web & PWA Mode'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {isElectron
              ? 'يعمل كتطبيق سطح مكتب متكامل مع وصول للملفات المحلية.'
              : 'يعمل بكامل المزايا عبر تقنيات الويب الحديثة ومتوافق مع Electron.'}
          </p>
        </div>
      </div>

      {/* Sync Queue Table */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-amber-400" />
            قائمة القيود في طابور المزامنة ({syncQueue.filter((s) => !s.synced).length} معلقة)
          </h3>
          <span className="text-[11px] text-zinc-500">
            تتم المزامنة التلقائية فور عودة الاتصال
          </span>
        </div>

        {syncQueue.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">
            كافة البيانات متزامنة محلياً بالكامل.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800/60 text-xs">
            {syncQueue.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    {item.data?.entryNumber || item.id}
                  </span>
                  <p className="text-zinc-200 font-medium">
                    {item.data?.description || item.action}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.synced
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {item.synced ? 'تمت المزامنة' : 'بانتظار المزامنة'}
                  </span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString('ar-EG')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup and Maintenance Actions */}
      <div className="pt-2 flex flex-wrap items-center gap-3">
        <button
          onClick={handleExportBackup}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تصدير نسخة احتياطية كاملة (JSON)</span>
        </button>

        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-medium border border-rose-800/60 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة تعيين البيانات النموذجية</span>
        </button>
      </div>
    </div>
  );
};
