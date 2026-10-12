/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from '@google/genai';
import { accountingDB } from './accounting-db';

export const ACCOUNTING_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_account_balance',
    description: 'استعلام عن رصيد حساب معين في دليل الحسابات مثل الخزينة، البنك، العملاء، الموردين، المبيعات أو الرواتب.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        account_name_or_code: {
          type: Type.STRING,
          description: 'اسم الحساب أو رمزه (مثال: "الخزينة", "البنك", "1010", "العملاء", "المبيعات")',
        },
      },
      required: ['account_name_or_code'],
    },
  },
  {
    name: 'get_financial_summary',
    description: 'الحصول على الملخص المالي الشامل: إجمالي الأصول، الالتزامات، حقوق الملكية، الإيرادات، المصروفات، وصافي الربح/الخسارة.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'create_journal_entry',
    description: 'تسجيل قيد يومية محاسبي مزدوج جديد. يجب أن تتساوى بنود المدين والدائن بدقة.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
          description: 'شرح وبيان القيد المحاسبي (مثال: "سداد فاتورة هاتف نقداً", "إثبات مبيعات نقدية")',
        },
        lines: {
          type: Type.ARRAY,
          description: 'أطراف القيد المحاسبي مع تحديد المدين والدائن لكل حساب',
          items: {
            type: Type.OBJECT,
            properties: {
              accountNameOrCode: {
                type: Type.STRING,
                description: 'اسم أو كود الحساب (مثال: "الخزينة", "مصروفات عمومية")',
              },
              debit: {
                type: Type.NUMBER,
                description: 'المبلغ المدين (أو 0 إذا كان دائناً)',
              },
              credit: {
                type: Type.NUMBER,
                description: 'المبلغ الدائن (أو 0 إذا كان مديناً)',
              },
              memo: {
                type: Type.STRING,
                description: 'ملاحظة خاصة بالبند (اختياري)',
              },
            },
            required: ['accountNameOrCode'],
          },
        },
      },
      required: ['description', 'lines'],
    },
  },
  {
    name: 'list_recent_journal_entries',
    description: 'عرض القيود المحاسبية الأخيرة وحركات اليومية المسجلة في النظام.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: 'عدد القيود المراد استعراضها (افتراضياً 5 قيود)',
        },
      },
    },
  },
  {
    name: 'search_transactions',
    description: 'البحث في القيود المحاسبية بالوصف أو نطاق المبالغ المالية.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'كلمة البحث في وصف القيد أو رقم القيد',
        },
        min_amount: {
          type: Type.NUMBER,
          description: 'الحد الأدنى لمبلغ القيد',
        },
        max_amount: {
          type: Type.NUMBER,
          description: 'الحد الأقصى لمبلغ القيد',
        },
      },
    },
  },
  {
    name: 'get_party_balance',
    description: 'الاستعلام عن رصيد عميل أو مورد معين مسجل في النظام.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        party_name: {
          type: Type.STRING,
          description: 'اسم العميل أو المورد (مثال: "شركة الآفاق", "مؤسسة النور")',
        },
      },
      required: ['party_name'],
    },
  },
];

export interface ToolExecutionEvent {
  toolName: string;
  args: any;
  result: any;
  timestamp: number;
}

/**
 * Execute tool calls and return structured responses to feed back to Gemini Live
 */
export async function executeAccountingTool(
  toolName: string,
  args: any
): Promise<{ result: any; summaryText: string }> {
  switch (toolName) {
    case 'get_account_balance': {
      const query = args.account_name_or_code || '';
      const account = await accountingDB.findAccount(query);
      if (!account) {
        return {
          result: {
            found: false,
            message: `لم يتم العثور على حساب محاسبي باسم أو رمز "${query}".`,
          },
          summaryText: `لم يتم العثور على حساب "${query}".`,
        };
      }
      return {
        result: {
          found: true,
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: account.type,
          balance: account.balance,
          currency: account.currency,
          formatted_balance: `${account.balance.toLocaleString('ar-EG')} ج.م`,
        },
        summaryText: `رصيد حساب ${account.name} (${account.code}) هو ${account.balance.toLocaleString('ar-EG')} ج.م.`,
      };
    }

    case 'get_financial_summary': {
      const summary = await accountingDB.getFinancialSummary();
      return {
        result: {
          total_assets: summary.totalAssets,
          total_liabilities: summary.totalLiabilities,
          total_equity: summary.totalEquity,
          total_revenue: summary.totalRevenue,
          total_expense: summary.totalExpense,
          net_income: summary.netIncome,
          is_balanced: summary.isBalanced,
          currency: 'EGP',
        },
        summaryText: `إجمالي الأصول: ${summary.totalAssets.toLocaleString('ar-EG')} ج.م، الالتزامات: ${summary.totalLiabilities.toLocaleString('ar-EG')} ج.م، الإيرادات: ${summary.totalRevenue.toLocaleString('ar-EG')} ج.م، المصروفات: ${summary.totalExpense.toLocaleString('ar-EG')} ج.م، وصافي الفائض المالي: ${summary.netIncome.toLocaleString('ar-EG')} ج.م. ميزان المراجعة متزن: ${summary.isBalanced ? 'نعم' : 'لا'}.`,
      };
    }

    case 'create_journal_entry': {
      const res = await accountingDB.createJournalEntry({
        description: args.description,
        lines: args.lines || [],
      });
      if (!res.success) {
        return {
          result: {
            success: false,
            error: res.error,
          },
          summaryText: `فشل تسجيل القيد: ${res.error}`,
        };
      }
      return {
        result: {
          success: true,
          entry_id: res.entry?.id,
          entry_number: res.entry?.entryNumber,
          total_amount: res.entry?.totalAmount,
          date: res.entry?.date,
          status: res.entry?.status,
        },
        summaryText: `تم تسجيل القيد رقم ${res.entry?.entryNumber} بنجاح بقيمة ${res.entry?.totalAmount.toLocaleString('ar-EG')} ج.م.`,
      };
    }

    case 'list_recent_journal_entries': {
      const limit = Number(args.limit) || 5;
      const entries = await accountingDB.getJournalEntries();
      const sliced = entries.slice(0, limit);
      return {
        result: {
          count: sliced.length,
          entries: sliced.map((e) => ({
            number: e.entryNumber,
            date: e.date,
            description: e.description,
            amount: e.totalAmount,
            status: e.status,
            lines: e.lines,
          })),
        },
        summaryText: `تم العثور على ${sliced.length} قيود محاسبية حديثة.`,
      };
    }

    case 'search_transactions': {
      const results = await accountingDB.searchTransactions({
        query: args.query,
        minAmount: args.min_amount,
        maxAmount: args.max_amount,
      });
      return {
        result: {
          match_count: results.length,
          results: results.slice(0, 10).map((e) => ({
            number: e.entryNumber,
            date: e.date,
            description: e.description,
            amount: e.totalAmount,
          })),
        },
        summaryText: `تم العثور على ${results.length} قيود تطابق معايير البحث.`,
      };
    }

    case 'get_party_balance': {
      const parties = await accountingDB.getParties();
      const q = (args.party_name || '').toLowerCase().trim();
      const party = parties.find(
        (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase())
      );
      if (!party) {
        return {
          result: {
            found: false,
            message: `لم يتم العثور على عميل أو مورد باسم "${args.party_name}".`,
          },
          summaryText: `لم يتم العثور على الطرف "${args.party_name}".`,
        };
      }
      return {
        result: {
          found: true,
          id: party.id,
          name: party.name,
          type: party.type === 'customer' ? 'عميل' : 'مورد',
          balance: party.balance,
          currency: 'EGP',
        },
        summaryText: `رصيد ${party.type === 'customer' ? 'الجهة' : 'المورد'} ${party.name} هو ${party.balance.toLocaleString('ar-EG')} ج.م.`,
      };
    }

    default:
      return {
        result: { error: `أداة غير معروفة: ${toolName}` },
        summaryText: `أداة غير مدعومة: ${toolName}`,
      };
  }
}
