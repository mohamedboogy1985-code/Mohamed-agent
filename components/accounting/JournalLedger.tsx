/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { accountingDB, JournalEntry } from '@/lib/accounting-db';
import { useUI } from '@/lib/state';
import {
  FileText,
  Search,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Download,
} from 'lucide-react';

export const JournalLedger: React.FC = () => {
  const { setShowNewEntryModal } = useUI();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'pending_sync'>('all');

  const loadEntries = async () => {
    try {
      const data = await accountingDB.getJournalEntries();
      setEntries(data);
    } catch (e) {
      console.error('Failed to load journal entries', e);
    }
  };

  useEffect(() => {
    loadEntries();
    accountingDB.on('change', loadEntries);
    const interval = setInterval(loadEntries, 30000);
    return () => {
      accountingDB.off('change', loadEntries);
      clearInterval(interval);
    };
  }, []);

  const filteredEntries = entries.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchNum = e.entryNumber.toLowerCase().includes(q);
      const matchLines = e.lines.some((l) => l.accountName.toLowerCase().includes(q));
      if (!matchDesc && !matchNum && !matchLines) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = 'رقم القيد,التاريخ,الوصف,المبلغ,الحالة\n';
    const rows = entries
      .map(
        (e) =>
          `"${e.entryNumber}","${e.date}","${e.description}",${e.totalAmount},"${e.status}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 text-zinc-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            دفتر اليومية العامة (General Journal Ledger)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            عرض وتوثيق كافة العمليات المالية والقيود المحاسبية بالقيد المزدوج
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>قيد محاسبي جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث برقم القيد أو الوصف أو اسم الحساب..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="all">كافة الحالات</option>
            <option value="posted">مرحل ومقيد</option>
            <option value="pending_sync">معلق للمزامنة</option>
          </select>
        </div>
      </div>

      {/* Entries Table / List */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            لا توجد قيود تطابق شروط البحث الحالية.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
              >
                {/* Entry Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-blue-300 font-semibold">
                      {entry.entryNumber}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">
                        {entry.description}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {entry.date} &bull; {entry.lines.length} بنود محاسبية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        {entry.totalAmount.toLocaleString('ar-EG')} ج.م
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {entry.status === 'posted' ? 'مرحل ومقيد' : 'معلق للمزامنة'}
                      </span>
                    </div>

                    <div className="text-zinc-500">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Double Entry Lines Table */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800/60 bg-zinc-900/40">
                    <div className="text-[11px] font-semibold text-zinc-400 mb-2">
                      تفاصيل أطراف القيد المزدوج:
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                            <th className="py-2 pr-2">الحساب</th>
                            <th className="py-2 text-center">مدين (Debit)</th>
                            <th className="py-2 text-center">دائن (Credit)</th>
                            <th className="py-2 pl-2">ملاحظة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40 font-mono">
                          {entry.lines.map((line, idx) => (
                            <tr key={idx} className="hover:bg-zinc-800/20">
                              <td className="py-2 pr-2 font-sans text-zinc-200 font-medium">
                                {line.accountName}
                              </td>
                              <td className="py-2 text-center text-blue-400">
                                {line.debit > 0 ? line.debit.toLocaleString('ar-EG') : '-'}
                              </td>
                              <td className="py-2 text-center text-amber-400">
                                {line.credit > 0 ? line.credit.toLocaleString('ar-EG') : '-'}
                              </td>
                              <td className="py-2 pl-2 font-sans text-zinc-500 text-[11px]">
                                {line.memo || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-zinc-700 font-bold text-white text-xs">
                            <td className="py-2 pr-2 font-sans">المجموع المتزن</td>
                            <td className="py-2 text-center text-blue-400 font-mono">
                              {entry.totalAmount.toLocaleString('ar-EG')}
                            </td>
                            <td className="py-2 text-center text-amber-400 font-mono">
                              {entry.totalAmount.toLocaleString('ar-EG')}
                            </td>
                            <td className="py-2 pl-2 text-emerald-400 text-[11px]">
                              متزن 100%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
