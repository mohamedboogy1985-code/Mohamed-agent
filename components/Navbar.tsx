/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useAgent, useUI, useUser, ActiveTab } from '@/lib/state';
import {
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Play,
  Square,
  RefreshCw,
  FileText,
  BarChart3,
  Layers,
  Database,
  UserCheck,
  Building2,
  HardDriveDownload,
} from 'lucide-react';

interface NavbarProps {
  onSync: () => void;
  pendingSyncCount: number;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onSync, pendingSyncCount, isOnline }) => {
  const { connected, status, connect, disconnect } = useLiveAPIContext();
  const { current, availablePresets, setCurrent } = useAgent();
  const { activeTab, setActiveTab } = useUI();
  const { companyName } = useUser();

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            صوتي مباشر
          </span>
        );
      case 'reconnecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            جاري إعادة الاتصال...
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            جاري الاتصال...
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            غير متصل
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & App title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  المساعد المحاسبي الصوتي الذكي
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Live AI 3.8
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-zinc-500" />
                {companyName}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              التقارير المالية
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'journal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              دفتر اليومية
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'accounts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              دليل الحسابات
            </button>
            <button
              onClick={() => setActiveTab('offline_sync')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'offline_sync'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              المزامنة و Electron
              {pendingSyncCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {pendingSyncCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Controls: Persona Selector, Network, Connect */}
          <div className="flex items-center gap-2.5">
            {/* Persona Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 text-xs text-zinc-300">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <select
                aria-label="اختر المساعد المحاسبي"
                value={current.id}
                onChange={(e) => setCurrent(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer border-none py-0.5"
              >
                {availablePresets.map((a) => (
                  <option key={a.id} value={a.id} className="bg-zinc-900 text-white">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Offline/Online Indicator */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${
                isOnline
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
              }`}
              title={isOnline ? 'متصل بالإنترنت' : 'وضع عدم الاتصال (IndexedDB)'}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline text-[11px]">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Status Badge */}
            {getStatusBadge()}

            {/* Primary Live Voice Button */}
            <button
              onClick={connected ? disconnect : connect}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                connected
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
              }`}
            >
              {connected ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>إنهاء المحادثة</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>بدء التحدث</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-800/80 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1 px-2 rounded ${activeTab === 'overview' ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
          >
            التقارير
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`py-1 px-2 rounded ${activeTab === 'journal' ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
          >
            دفتر اليومية
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-1 px-2 rounded ${activeTab === 'accounts' ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
          >
            الحسابات
          </button>
          <button
            onClick={() => setActiveTab('offline_sync')}
            className={`py-1 px-2 rounded ${activeTab === 'offline_sync' ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
          >
            المزامنة ({pendingSyncCount})
          </button>
        </div>
      </div>
    </header>
  );
};
