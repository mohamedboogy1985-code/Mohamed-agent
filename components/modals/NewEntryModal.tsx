/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { accountingDB, Account } from '@/lib/accounting-db';
import { useUI } from '@/lib/state';
import {
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface EntryLineState {
  accountNameOrCode: string;
  debit: string;
  credit: string;
  memo: string;
}

export const NewEntryModal: React.FC = () => {
  const { showNewEntryModal, setShowNewEntryModal, addEventLog } = useUI();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<EntryLineState[]>([
    { accountNameOrCode: '1010', debit: '', credit: '', memo: '' },
    { accountNameOrCode: '4010', debit: '', credit: '', memo: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showNewEntryModal) {
      accountingDB.getAccounts().then(setAccounts);
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setLines([
        { accountNameOrCode: '1010', debit: '', credit: '', memo: '' },
        { accountNameOrCode: '4010', debit: '', credit: '', memo: '' },
      ]);
      setError(null);
    }
  }, [showNewEntryModal]);

  if (!showNewEntryModal) return null;

  const totalDebit = lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.001 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([
      ...lines,
      { accountNameOrCode: accounts[0]?.code || '', debit: '', credit: '', memo: '' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: keyof EntryLineState,
    value: string
  ) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('يرجى كتابة بيان أو شرح للقيد المحاسبي.');
      return;
    }
    if (!isBalanced) {
      setError('لا يمكن ترحيل القيد! يجب أن يتساوى إجمالي المدين مع إجمالي الدائن.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await accountingDB.createJournalEntry({
        description: description.trim(),
        date,
        lines: lines.map((l) => ({
          accountNameOrCode: l.accountNameOrCode,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          memo: l.memo.trim(),
        })),
      });

      if (!res.success) {
        setError(res.error || 'حدث خطأ أثناء حفظ القيد.');
        return;
      }

      addEventLog({
        type: 'tool',
        text: `تم تسجيل القيد رقم ${res.entry?.entryNumber} بقيمة ${res.entry?.totalAmount.toLocaleString('ar-EG')} ج.م.`,
      });

      setShowNewEntryModal(false);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">تسجيل قيد محاسبي جديد (Double Entry)</h3>
          </div>
          <button
            onClick={() => setShowNewEntryModal(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 flex items-start gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Description & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                بيان القيد (الشرح) *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: إثبات إيراد خدمات استشارية نقداً"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                تاريخ القيد
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
            <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-semibold text-zinc-300 text-[11px]">
                أطراف القيد (المدين والدائن)
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] border border-zinc-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة بند</span>
              </button>
            </div>

            <div className="p-3 space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Account select */}
                  <select
                    value={line.accountNameOrCode}
                    onChange={(e) =>
                      handleLineChange(idx, 'accountNameOrCode', e.target.value)
                    }
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.code}>
                        {acc.code} - {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>

                  {/* Debit */}
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="مدين"
                    value={line.debit}
                    onChange={(e) => {
                      handleLineChange(idx, 'debit', e.target.value);
                      if (e.target.value && parseFloat(e.target.value) > 0) {
                        handleLineChange(idx, 'credit', '');
                      }
                    }}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400 font-mono text-xs text-center focus:outline-none focus:border-blue-500"
                  />

                  {/* Credit */}
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="دائن"
                    value={line.credit}
                    onChange={(e) => {
                      handleLineChange(idx, 'credit', e.target.value);
                      if (e.target.value && parseFloat(e.target.value) > 0) {
                        handleLineChange(idx, 'debit', '');
                      }
                    }}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 font-mono text-xs text-center focus:outline-none focus:border-amber-500"
                  />

                  {/* Delete button */}
                  {lines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="حذف البند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Balancing Footer */}
            <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4 font-mono">
                <span>
                  إجمالي المدين: <strong className="text-blue-400">{totalDebit.toLocaleString('ar-EG')} ج.م</strong>
                </span>
                <span>
                  إجمالي الدائن: <strong className="text-amber-400">{totalCredit.toLocaleString('ar-EG')} ج.م</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                {isBalanced ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    القيد متزن تماماً
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    الفارق: {diff.toLocaleString('ar-EG')} ج.م
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setShowNewEntryModal(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!isBalanced || submitting}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isBalanced && !submitting
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'جاري الترحيل...' : 'ترحيل وتوثيق القيد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
