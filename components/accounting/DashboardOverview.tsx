/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  accountingDB,
  Account,
  JournalEntry,
  MonthlyTrendData,
} from '@/lib/accounting-db';
import { useUI } from '@/lib/state';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  BarChart2,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-white border-b border-zinc-800 pb-1 text-center font-sans">
          شهر {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {Number(entry.value).toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardOverview: React.FC = () => {
  const { setActiveTab, setShowNewEntryModal } = useUI();
  const [summary, setSummary] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
  }>({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    totalRevenue: 0,
    totalExpense: 0,
    netIncome: 0,
    isBalanced: true,
    totalDebits: 0,
    totalCredits: 0,
  });

  const [topAccounts, setTopAccounts] = useState<Account[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendData[]>([]);
  const [chartViewMode, setChartViewMode] = useState<'both' | 'profit'>('both');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sum, accs, entries, trends] = await Promise.all([
        accountingDB.getFinancialSummary(),
        accountingDB.getAccounts(),
        accountingDB.getJournalEntries(),
        accountingDB.getMonthlyTrends(),
      ]);
      setSummary(sum);
      setTopAccounts(accs.slice(0, 6));
      setRecentEntries(entries.slice(0, 4));
      setMonthlyTrends(trends);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    accountingDB.on('change', loadData);
    // Gentle 30-second interval fallback
    const interval = setInterval(loadData, 30000);
    return () => {
      accountingDB.off('change', loadData);
      clearInterval(interval);
    };
  }, []);

  const totalPeriodRevenue = monthlyTrends.reduce((acc, m) => acc + m.revenue, 0);
  const totalPeriodExpense = monthlyTrends.reduce((acc, m) => acc + m.expense, 0);
  const totalPeriodNet = totalPeriodRevenue - totalPeriodExpense;
  const profitMargin =
    totalPeriodRevenue > 0
      ? Math.round((totalPeriodNet / totalPeriodRevenue) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-zinc-900 to-zinc-900 p-5 rounded-2xl border border-blue-900/40">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            لوحة المراقبة المحاسبية والتقارير المالية
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            نظام القيد المزدوج المعتمد والمتصل بمساعد الذكاء الاصطناعي الصوتي
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل قيد جديد</span>
          </button>
        </div>
      </div>

      {/* Trial Balance Status Indicator Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          summary.isBalanced
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
            : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              summary.isBalanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {summary.isBalanced ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {summary.isBalanced
                ? 'ميزان المراجعة متزن بدقة 100%'
                : 'تنبيه: ميزان المراجعة غير متزن!'}
            </h3>
            <p className="text-xs opacity-80">
              إجمالي المدين: {summary.totalDebits.toLocaleString('ar-EG')} ج.م | إجمالي الدائن:{' '}
              {summary.totalCredits.toLocaleString('ar-EG')} ج.م
            </p>
          </div>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300">
          الفارق المحاسبي: {Math.abs(summary.totalDebits - summary.totalCredits).toLocaleString('ar-EG')} ج.م
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assets */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">إجمالي الأصول</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {summary.totalAssets.toLocaleString('ar-EG')} <span className="text-xs font-sans font-normal text-zinc-400">ج.م</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">الخزينة، البنك الأهلي، بنك مصر</p>
        </div>

        {/* Liabilities */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">إجمالي الالتزامات</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {summary.totalLiabilities.toLocaleString('ar-EG')} <span className="text-xs font-sans font-normal text-zinc-400">ج.م</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">الموردون، الضرائب، أمانات المعاشات</p>
        </div>

        {/* Revenue */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">إجمالي الإيرادات</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {summary.totalRevenue.toLocaleString('ar-EG')} <span className="text-xs font-sans font-normal text-zinc-400">ج.م</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">اشتراكات، دمغات، وتراخيص التشييد</p>
        </div>

        {/* Net Income */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">صافي الفائض المالي</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${summary.netIncome >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono ${summary.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.netIncome.toLocaleString('ar-EG')} <span className="text-xs font-sans font-normal text-zinc-400">ج.م</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            المصروفات: {summary.totalExpense.toLocaleString('ar-EG')} ج.م
          </p>
        </div>
      </div>

      {/* Visual Recharts Section: Monthly Revenue & Expense Trend Lines */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Chart Header & Toggle Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              المنحنى البياني للإيرادات والمصروفات الشهرية
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              تتبع المسار المالي الشهري وصافي الربح مستخرجاً مباشرة من قاعدة البيانات المحلية
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setChartViewMode('both')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                chartViewMode === 'both'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              الإيرادات والمصروفات
            </button>
            <button
              onClick={() => setChartViewMode('profit')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                chartViewMode === 'profit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              صافي الربح
            </button>
          </div>
        </div>

        {/* Quick Trend Statistics Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-xs">
          <div>
            <span className="text-[11px] text-zinc-500">إجمالي إيرادات 6 أشهر</span>
            <p className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
              {totalPeriodRevenue.toLocaleString('ar-EG')} ج.م
            </p>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500">إجمالي مصروفات 6 أشهر</span>
            <p className="text-xs font-bold font-mono text-rose-400 mt-0.5">
              {totalPeriodExpense.toLocaleString('ar-EG')} ج.م
            </p>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500">صافي الفائض المالي</span>
            <p className={`text-xs font-bold font-mono mt-0.5 ${totalPeriodNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPeriodNet.toLocaleString('ar-EG')} ج.م
            </p>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500">هامش الربحية التشغيلي</span>
            <p className="text-xs font-bold font-mono text-blue-400 mt-0.5">
              {profitMargin}%
            </p>
          </div>
        </div>

        {/* Recharts Component Container */}
        <div className="w-full h-72 pt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === 'both' ? (
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="الإيرادات (Revenue)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="المصروفات (Expense)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                  activeDot={{ r: 5, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="netIncome"
                  name="صافي الربح (Net Income)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout: Accounts Preview & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Balances */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              أرصدة الحسابات الرئيسية
            </h3>
            <button
              onClick={() => setActiveTab('accounts')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              عرض الكل &larr;
            </button>
          </div>

          <div className="divide-y divide-zinc-800/60 mt-2">
            {topAccounts.map((acc) => (
              <div key={acc.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-200">{acc.name}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">{acc.code} - {acc.nameEn}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white font-mono">
                    {acc.balance.toLocaleString('ar-SA')} {acc.currency}
                  </span>
                  <span
                    className={`block text-[10px] uppercase ${
                      acc.type === 'asset' || acc.type === 'expense'
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {acc.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Journal Entries */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              آخر القيود المسجلة
            </h3>
            <button
              onClick={() => setActiveTab('journal')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              دفتر اليومية &larr;
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {recentEntries.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">لا توجد قيود مسجلة بعد.</p>
            ) : (
              recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                        {entry.entryNumber}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200">
                        {entry.description}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {entry.totalAmount.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                    <span>{entry.date}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/60">
                      {entry.status === 'posted' ? 'مرحل ومقيد' : 'معلق للمزامنة'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
