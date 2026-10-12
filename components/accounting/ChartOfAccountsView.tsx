/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { accountingDB, Account } from '@/lib/accounting-db';
import {
  Layers,
  Search,
  Wallet,
  Building,
  Scale,
  TrendingUp,
  Receipt,
  Download,
} from 'lucide-react';

export const ChartOfAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const loadAccounts = async () => {
    try {
      const data = await accountingDB.getAccounts();
      setAccounts(data);
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  };

  useEffect(() => {
    loadAccounts();
    accountingDB.on('change', loadAccounts);
    const interval = setInterval(loadAccounts, 30000);
    return () => {
      accountingDB.off('change', loadAccounts);
      clearInterval(interval);
    };
  }, []);

  const filteredAccounts = accounts.filter((a) => {
    if (selectedType !== 'all' && a.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchEn = a.nameEn.toLowerCase().includes(q);
      const matchCode = a.code.includes(q);
      if (!matchName && !matchEn && !matchCode) return false;
    }
    return true;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'asset':
        return { label: 'أصل (Asset)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'liability':
        return { label: 'التزام (Liability)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'equity':
        return { label: 'حقوق ملكية (Equity)', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'revenue':
        return { label: 'إيراد (Revenue)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'expense':
        return { label: 'مصروف (Expense)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      default:
        return { label: type, color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 text-zinc-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            دليل الحسابات الشامل (Chart of Accounts)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            هيكل شجرة الحسابات المالية وأرصدتها الحية المحدثة
          </p>
        </div>

        <div className="text-xs text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
          إجمالي الحسابات: <span className="text-white font-bold">{accounts.length}</span>
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
            placeholder="البحث برمز الحساب أو الاسم العربي أو الإنجليزي..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'asset', label: 'الأصول' },
            { id: 'liability', label: 'الخصوم' },
            { id: 'equity', label: 'الملكية' },
            { id: 'revenue', label: 'الإيرادات' },
            { id: 'expense', label: 'المصروفات' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                selectedType === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
              <th className="py-2.5 pr-3">رمز الحساب</th>
              <th className="py-2.5">اسم الحساب العربي</th>
              <th className="py-2.5">الاسم الإنجليزي</th>
              <th className="py-2.5">التصنيف المحاسبي</th>
              <th className="py-2.5 pl-3 text-left">الرصيد الحالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {filteredAccounts.map((acc) => {
              const typeMeta = getTypeLabel(acc.type);
              return (
                <tr key={acc.id} className="hover:bg-zinc-950/40 transition-colors">
                  <td className="py-3 pr-3 text-blue-400 font-bold">{acc.code}</td>
                  <td className="py-3 font-sans font-semibold text-zinc-100">{acc.name}</td>
                  <td className="py-3 font-sans text-zinc-400 text-[11px]">{acc.nameEn}</td>
                  <td className="py-3">
                    <span
                      className={`font-sans text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.color}`}
                    >
                      {typeMeta.label}
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-left">
                    <span className="text-white font-bold">
                      {acc.balance.toLocaleString('ar-EG')}
                    </span>{' '}
                    <span className="text-[11px] font-sans text-zinc-400 font-normal">
                      ج.م
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
