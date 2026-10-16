/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'eventemitter3';

export interface Account {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string; // YYYY-MM-DD
  description: string;
  lines: JournalLine[];
  totalAmount: number;
  status: 'posted' | 'draft' | 'pending_sync';
  createdAt: number;
}

export interface Party {
  id: string;
  name: string;
  type: 'customer' | 'vendor';
  balance: number;
  phone?: string;
  email?: string;
}

export interface SyncItem {
  id: string;
  action: 'create_entry' | 'update_entry' | 'create_account';
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface MonthlyTrendData {
  monthKey: string;
  monthName: string;
  revenue: number;
  expense: number;
  netIncome: number;
}

// Chart of Accounts for النقابة العامة للبناء (General Syndicate of Building & Construction) - In Egyptian Pounds (EGP)
export const INITIAL_ACCOUNTS: Account[] = [
  { id: '101', code: '1010', name: 'الخزينة الرئيسية بالنقابة', nameEn: 'Main Syndicate Treasury', type: 'asset', balance: 185000, currency: 'EGP' },
  { id: '102', code: '1020', name: 'البنك الأهلي المصري - جاري النقابة', nameEn: 'NBE Current Account', type: 'asset', balance: 640000, currency: 'EGP' },
  { id: '103', code: '1025', name: 'بنك مصر - صندوق الرعاية الاجتماعية', nameEn: 'Banque Misr - Welfare Fund', type: 'asset', balance: 395000, currency: 'EGP' },
  { id: '104', code: '1030', name: 'مستحقات اشتراكات اللجان الفرعية', nameEn: 'Sub-Syndicates Dues Receivable', type: 'asset', balance: 120000, currency: 'EGP' },
  { id: '105', code: '1040', name: 'مخزون الكارنيهات والشهادات والمطبوعات', nameEn: 'Membership Cards & Print Stock', type: 'asset', balance: 45000, currency: 'EGP' },
  { id: '201', code: '2010', name: 'موردو الخدمات والمستلزمات النقابية', nameEn: 'Suppliers & Vendors Payable', type: 'liability', balance: 68000, currency: 'EGP' },
  { id: '202', code: '2020', name: 'مصلحة الضرائب المصرية (دمغات وكسب عمل)', nameEn: 'Egyptian Tax Authority & Stamp Dues', type: 'liability', balance: 32000, currency: 'EGP' },
  { id: '203', code: '2030', name: 'أمانات صندوق المعاشات والرعاية التكميلية', nameEn: 'Pensions & Member Care Trust', type: 'liability', balance: 145000, currency: 'EGP' },
  // ملاحظة محاسبية: حقوق الملكية لا تتضمن صافي فائض الفترة الحالية غير المُقفل
  // (الفائض 240,000 ج.م ما زال مفتوحاً في الإيرادات والمصروفات)، وبذلك يتحقق
  // توازن ميزان المراجعة: الأصول + المصروفات = الالتزامات + حقوق الملكية + الإيرادات
  { id: '301', code: '3010', name: 'صندوق النقابة العام والاحتياطي', nameEn: 'General Syndicate Reserve Fund', type: 'equity', balance: 710000, currency: 'EGP' },
  { id: '302', code: '3020', name: 'الفائض المالي المرحل', nameEn: 'Retained Surplus', type: 'equity', balance: 190000, currency: 'EGP' },
  { id: '401', code: '4010', name: 'إيرادات اشتراكات وتجديد العضوية', nameEn: 'Membership Dues & Renewal', type: 'revenue', balance: 380000, currency: 'EGP' },
  { id: '402', code: '4020', name: 'إيرادات الدمغات ورخص مشاريع التشييد', nameEn: 'Construction Licenses & Stamp Fees', type: 'revenue', balance: 290000, currency: 'EGP' },
  { id: '403', code: '4030', name: 'إيرادات دورات السلامة والصحة المهنية', nameEn: 'Safety Training & Consulting Revenue', type: 'revenue', balance: 85000, currency: 'EGP' },
  { id: '501', code: '5010', name: 'مصروفات العلاج والرعاية الصحية للأعضاء', nameEn: 'Medical Care & Health Subsidies', type: 'expense', balance: 210000, currency: 'EGP' },
  { id: '502', code: '5020', name: 'إعانات ومساعدات طوارئ عمال البناء', nameEn: 'Emergency Worker Subsidies', type: 'expense', balance: 95000, currency: 'EGP' },
  { id: '503', code: '5030', name: 'رواتب ومكافآت العاملين بالنقابة', nameEn: 'Syndicate Staff Salaries', type: 'expense', balance: 135000, currency: 'EGP' },
  { id: '504', code: '5040', name: 'إيجارات ومصروفات المقار النقابية والمرافق', nameEn: 'Syndicate Headquarters Rent & Utilities', type: 'expense', balance: 48000, currency: 'EGP' },
  { id: '505', code: '5050', name: 'مصروفات مؤتمرات ودورات التثقيف العمالي', nameEn: 'Labor Education Conferences', type: 'expense', balance: 27000, currency: 'EGP' },
];

export const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je-1001',
    entryNumber: 'JV-2026-001',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    description: 'تحصيل اشتراكات سنوية ورسوم كارنيهات أعضاء البناء نقداً',
    lines: [
      { accountId: '101', accountName: 'الخزينة الرئيسية بالنقابة', debit: 65000, credit: 0 },
      { accountId: '401', accountName: 'إيرادات اشتراكات وتجديد العضوية', debit: 0, credit: 65000 },
    ],
    totalAmount: 65000,
    status: 'posted',
    createdAt: Date.now() - 5 * 24 * 3600 * 1000,
  },
  {
    id: 'je-1002',
    entryNumber: 'JV-2026-002',
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    description: 'صرف دعم رعاية طبية وعمليات جراحية لعمال البناء من بنك مصر',
    lines: [
      { accountId: '501', accountName: 'مصروفات العلاج والرعاية الصحية للأعضاء', debit: 42000, credit: 0 },
      { accountId: '103', accountName: 'بنك مصر - صندوق الرعاية الاجتماعية', debit: 0, credit: 42000 },
    ],
    totalAmount: 42000,
    status: 'posted',
    createdAt: Date.now() - 3 * 24 * 3600 * 1000,
  },
  {
    id: 'je-1003',
    entryNumber: 'JV-2026-003',
    date: new Date().toISOString().split('T')[0],
    description: 'توريد دمغات مشاريع تشييد وبناء كبرى بالبنك الأهلي المصري',
    lines: [
      { accountId: '102', accountName: 'البنك الأهلي المصري - جاري النقابة', debit: 78000, credit: 0 },
      { accountId: '402', accountName: 'إيرادات الدمغات ورخص مشاريع التشييد', debit: 0, credit: 78000 },
    ],
    totalAmount: 78000,
    status: 'posted',
    createdAt: Date.now(),
  },
];

export const INITIAL_PARTIES: Party[] = [
  { id: 'p-1', name: 'اللجنة النقابية لشركات المقاولات الكبرى', type: 'customer', balance: 54000, phone: '+201012345678' },
  { id: 'p-2', name: 'مستشفى المقاولين والرعاية التخصصية', type: 'vendor', balance: 38000, phone: '+201123456789' },
  { id: 'p-3', name: 'اللجنة النقابية للإسكان والتعمير', type: 'customer', balance: 66000, phone: '+201234567890' },
  { id: 'p-4', name: 'شركة الأهرام للمطبوعات والتوريدات', type: 'vendor', balance: 19500, phone: '+201555566677' },
];

const DB_NAME = 'SyndicateBuildingDB_v2';
const DB_VERSION = 1;

class AccountingDatabase extends EventEmitter {
  private db: IDBDatabase | null = null;
  private memoryAccounts: Account[] = [...INITIAL_ACCOUNTS];
  private memoryEntries: JournalEntry[] = [...INITIAL_ENTRIES];
  private memoryParties: Party[] = [...INITIAL_PARTIES];
  private syncQueue: SyncItem[] = [];

  // Memory caches for high performance
  private summaryCache: any = null;
  private trendsCache: MonthlyTrendData[] | null = null;

  constructor() {
    super();
    this.init();
  }

  private invalidateCache() {
    this.summaryCache = null;
    this.trendsCache = null;
    this.emit('change');
  }

  private async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.loadFromLocalStorage();
      await this.reconcileLegacySeedData();
      return;
    }

    try {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('accounts')) {
            db.createObjectStore('accounts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('entries')) {
            db.createObjectStore('entries', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('parties')) {
            db.createObjectStore('parties', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('syncQueue')) {
            db.createObjectStore('syncQueue', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      await this.seedIfEmpty();
    } catch (err) {
      console.warn('IndexedDB fallback to LocalStorage:', err);
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const acc = localStorage.getItem('synd_accounts');
      const ent = localStorage.getItem('synd_entries');
      const par = localStorage.getItem('synd_parties');
      const sync = localStorage.getItem('synd_sync');
      if (acc) this.memoryAccounts = JSON.parse(acc);
      if (ent) this.memoryEntries = JSON.parse(ent);
      if (par) this.memoryParties = JSON.parse(par);
      if (sync) this.syncQueue = JSON.parse(sync);
    } catch (e) {
      console.error('Error loading LocalStorage', e);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('synd_accounts', JSON.stringify(this.memoryAccounts));
      localStorage.setItem('synd_entries', JSON.stringify(this.memoryEntries));
      localStorage.setItem('synd_parties', JSON.stringify(this.memoryParties));
      localStorage.setItem('synd_sync', JSON.stringify(this.syncQueue));
    } catch (e) {
      console.error('Error saving LocalStorage', e);
    }
  }

  private async seedIfEmpty(): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(['accounts', 'entries', 'parties'], 'readwrite');
    const accStore = tx.objectStore('accounts');
    const entStore = tx.objectStore('entries');
    const parStore = tx.objectStore('parties');

    const countReq = accStore.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        INITIAL_ACCOUNTS.forEach((a) => accStore.put(a));
        INITIAL_ENTRIES.forEach((e) => entStore.put(e));
        INITIAL_PARTIES.forEach((p) => parStore.put(p));
      }
    };
  }

  /**
   * إصلاح بيانات بذرة قديمة حُفظت قبل تصحيح حقوق الملكية.
   * كانت حقوق الملكية تتضمن صافي فائض الفترة غير المُقفل، ما كان يُظهر
   * فارقاً محاسبياً وهمياً قدره 240,000 ج.م في ميزان المراجعة.
   */
  private async reconcileLegacySeedData(): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const reserve = accounts.find((a) => a.code === '3010');
      const surplus = accounts.find((a) => a.code === '3020');
      if (!reserve || !surplus) return;
      if (reserve.balance !== 950000 || surplus.balance !== 190000) return;

      const fixed = accounts.map((a) => (a.code === '3010' ? { ...a, balance: 710000 } : a));
      this.memoryAccounts = fixed;
      this.invalidateCache();

      if (this.db) {
        await new Promise<void>((resolve) => {
          const tx = this.db!.transaction('accounts', 'readwrite');
          const store = tx.objectStore('accounts');
          fixed.forEach((a) => store.put(a));
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        });
      } else {
        this.saveToLocalStorage();
      }
      console.info('تم تصحيح بيانات حقوق الملكية القديمة لتوازن ميزان المراجعة.');
    } catch (e) {
      console.warn('تعذر تنفيذ تصحيح البيانات القديمة:', e);
    }
  }

  public async getAccounts(): Promise<Account[]> {
    if (!this.db) {
      return [...this.memoryAccounts];
    }
    return new Promise((resolve) => {
      const tx = this.db!.transaction('accounts', 'readonly');
      const store = tx.objectStore('accounts');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result && req.result.length ? req.result : [...this.memoryAccounts]);
      req.onerror = () => resolve([...this.memoryAccounts]);
    });
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) {
      return [...this.memoryEntries].sort((a, b) => b.createdAt - a.createdAt);
    }
    return new Promise((resolve) => {
      const tx = this.db!.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result || [];
        resolve(res.sort((a: JournalEntry, b: JournalEntry) => b.createdAt - a.createdAt));
      };
      req.onerror = () => resolve([...this.memoryEntries]);
    });
  }

  public async getParties(): Promise<Party[]> {
    if (!this.db) return [...this.memoryParties];
    return new Promise((resolve) => {
      const tx = this.db!.transaction('parties', 'readonly');
      const store = tx.objectStore('parties');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || [...this.memoryParties]);
      req.onerror = () => resolve([...this.memoryParties]);
    });
  }

  public async getSyncQueue(): Promise<SyncItem[]> {
    if (!this.db) return [...this.syncQueue];
    return new Promise((resolve) => {
      const tx = this.db!.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || [...this.syncQueue]);
      req.onerror = () => resolve([...this.syncQueue]);
    });
  }

  public async findAccount(query: string): Promise<Account | null> {
    const accounts = await this.getAccounts();
    const cleanQuery = query.trim().toLowerCase();
    
    const byCode = accounts.find((a) => a.code === cleanQuery);
    if (byCode) return byCode;

    const byName = accounts.find(
      (a) =>
        a.name.toLowerCase().includes(cleanQuery) ||
        a.nameEn.toLowerCase().includes(cleanQuery) ||
        cleanQuery.includes(a.name.toLowerCase())
    );
    return byName || null;
  }

  public async createJournalEntry(params: {
    description: string;
    date?: string;
    lines: Array<{
      accountNameOrCode: string;
      debit?: number;
      credit?: number;
      memo?: string;
    }>;
  }): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> {
    const accounts = await this.getAccounts();
    const resolvedLines: JournalLine[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of params.lines) {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (debit < 0 || credit < 0) {
        return { success: false, error: 'لا يمكن إدخال مبالغ سالبة في بنود القيد.' };
      }

      const acc = accounts.find(
        (a) =>
          a.code === line.accountNameOrCode.trim() ||
          a.name.toLowerCase().includes(line.accountNameOrCode.trim().toLowerCase()) ||
          a.nameEn.toLowerCase().includes(line.accountNameOrCode.trim().toLowerCase()) ||
          line.accountNameOrCode.trim().toLowerCase().includes(a.name.toLowerCase())
      );

      if (!acc) {
        return {
          success: false,
          error: `لم يتم العثور على حساب يطابق: "${line.accountNameOrCode}".`,
        };
      }

      resolvedLines.push({
        accountId: acc.id,
        accountName: acc.name,
        debit,
        credit,
        memo: line.memo || '',
      });

      totalDebit += debit;
      totalCredit += credit;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return {
        success: false,
        error: `القيد غير متزن محاسبياً! إجمالي المدين (${totalDebit.toLocaleString()} ج.م) لا يساوي إجمالي الدائن (${totalCredit.toLocaleString()} ج.م). الفارق: ${Math.abs(
          totalDebit - totalCredit
        ).toLocaleString()} ج.م.`,
      };
    }

    if (totalDebit <= 0) {
      return { success: false, error: 'يجب أن يحتوي القيد على مبالغ أكبر من الصفر.' };
    }

    const currentEntries = await this.getJournalEntries();
    const entryNum = `JV-${new Date().getFullYear()}-${String(currentEntries.length + 1).padStart(3, '0')}`;
    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber: entryNum,
      date: params.date || new Date().toISOString().split('T')[0],
      description: params.description,
      lines: resolvedLines,
      totalAmount: totalDebit,
      status: typeof navigator !== 'undefined' && !navigator.onLine ? 'pending_sync' : 'posted',
      createdAt: Date.now(),
    };

    const updatedAccounts = accounts.map((acc) => {
      let change = 0;
      resolvedLines
        .filter((l) => l.accountId === acc.id)
        .forEach((l) => {
          if (acc.type === 'asset' || acc.type === 'expense') {
            change += l.debit - l.credit;
          } else {
            change += l.credit - l.debit;
          }
        });
      return { ...acc, balance: acc.balance + change };
    });

    this.memoryAccounts = updatedAccounts;
    this.memoryEntries.unshift(newEntry);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      const syncItem: SyncItem = {
        id: `sync-${Date.now()}`,
        action: 'create_entry',
        data: newEntry,
        timestamp: Date.now(),
        synced: false,
      };
      this.syncQueue.push(syncItem);
    }

    if (this.db) {
      const tx = this.db.transaction(['accounts', 'entries', 'syncQueue'], 'readwrite');
      const accStore = tx.objectStore('accounts');
      const entStore = tx.objectStore('entries');
      const syncStore = tx.objectStore('syncQueue');

      updatedAccounts.forEach((a) => accStore.put(a));
      entStore.put(newEntry);
      if (isOffline) {
        syncStore.put(this.syncQueue[this.syncQueue.length - 1]);
      }
    } else {
      this.saveToLocalStorage();
    }

    this.invalidateCache();
    return { success: true, entry: newEntry };
  }

  public async getFinancialSummary(): Promise<{
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
  }> {
    if (this.summaryCache) {
      return this.summaryCache;
    }

    const accounts = await this.getAccounts();
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpense = 0;

    accounts.forEach((a) => {
      switch (a.type) {
        case 'asset':
          totalAssets += a.balance;
          break;
        case 'liability':
          totalLiabilities += a.balance;
          break;
        case 'equity':
          totalEquity += a.balance;
          break;
        case 'revenue':
          totalRevenue += a.balance;
          break;
        case 'expense':
          totalExpense += a.balance;
          break;
      }
    });

    const netIncome = totalRevenue - totalExpense;
    const totalDebits = totalAssets + totalExpense;
    const totalCredits = totalLiabilities + totalEquity + totalRevenue;
    const isBalanced = Math.abs(totalDebits - totalCredits) < 1;

    this.summaryCache = {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpense,
      netIncome,
      isBalanced,
      totalDebits,
      totalCredits,
    };

    return this.summaryCache;
  }

  public async getMonthlyTrends(): Promise<MonthlyTrendData[]> {
    if (this.trendsCache) {
      return this.trendsCache;
    }

    const [entries, accounts] = await Promise.all([
      this.getJournalEntries(),
      this.getAccounts(),
    ]);

    const revenueAccountIds = new Set(
      accounts.filter((a) => a.type === 'revenue').map((a) => a.id)
    );
    const expenseAccountIds = new Set(
      accounts.filter((a) => a.type === 'expense').map((a) => a.id)
    );

    let totalRevenue = 0;
    let totalExpense = 0;
    accounts.forEach((a) => {
      if (a.type === 'revenue') totalRevenue += a.balance;
      if (a.type === 'expense') totalExpense += a.balance;
    });

    const now = new Date();
    const months: MonthlyTrendData[] = [];
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const seasonalWeights = [0.86, 0.92, 0.96, 1.06, 1.14, 1.0];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;
      const monthName = `${arabicMonths[d.getMonth()]}`;

      let monthRev = 0;
      let monthExp = 0;

      entries.forEach((entry) => {
        if (entry.date.startsWith(monthKey)) {
          entry.lines.forEach((line) => {
            if (revenueAccountIds.has(line.accountId)) {
              monthRev += (line.credit - line.debit);
            }
            if (expenseAccountIds.has(line.accountId)) {
              monthExp += (line.debit - line.credit);
            }
          });
        }
      });

      const weight = seasonalWeights[5 - i] || 1.0;
      const baseRev = Math.round((totalRevenue / 6) * weight * 0.75);
      const baseExp = Math.round((totalExpense / 6) * weight * 0.75);

      const finalRev = Math.max(0, monthRev + baseRev);
      const finalExp = Math.max(0, monthExp + baseExp);

      months.push({
        monthKey,
        monthName,
        revenue: finalRev,
        expense: finalExp,
        netIncome: finalRev - finalExp,
      });
    }

    this.trendsCache = months;
    return months;
  }

  public async searchTransactions(params: {
    query?: string;
    minAmount?: number;
    maxAmount?: number;
    accountId?: string;
  }): Promise<JournalEntry[]> {
    const entries = await this.getJournalEntries();
    return entries.filter((e) => {
      if (params.query) {
        const q = params.query.toLowerCase();
        const matchesDesc = e.description.toLowerCase().includes(q);
        const matchesNum = e.entryNumber.toLowerCase().includes(q);
        const matchesLine = e.lines.some((l) => l.accountName.toLowerCase().includes(q));
        if (!matchesDesc && !matchesNum && !matchesLine) return false;
      }
      if (params.minAmount !== undefined && e.totalAmount < params.minAmount) {
        return false;
      }
      if (params.maxAmount !== undefined && e.totalAmount > params.maxAmount) {
        return false;
      }
      if (params.accountId) {
        const hasAccount = e.lines.some((l) => l.accountId === params.accountId);
        if (!hasAccount) return false;
      }
      return true;
    });
  }

  public async syncPending(): Promise<{ syncedCount: number }> {
    const queue = await this.getSyncQueue();
    const unsynced = queue.filter((q) => !q.synced);
    if (unsynced.length === 0) return { syncedCount: 0 };

    unsynced.forEach((item) => {
      item.synced = true;
    });

    const entries = await this.getJournalEntries();
    entries.forEach((e) => {
      if (e.status === 'pending_sync') {
        e.status = 'posted';
      }
    });

    if (this.db) {
      const tx = this.db.transaction(['entries', 'syncQueue'], 'readwrite');
      const entStore = tx.objectStore('entries');
      const syncStore = tx.objectStore('syncQueue');
      entries.forEach((e) => entStore.put(e));
      unsynced.forEach((s) => syncStore.put(s));
    } else {
      this.memoryEntries = entries;
      this.syncQueue = queue;
      this.saveToLocalStorage();
    }

    this.invalidateCache();
    return { syncedCount: unsynced.length };
  }

  public async exportBackup(): Promise<string> {
    const [accounts, entries, parties, sync] = await Promise.all([
      this.getAccounts(),
      this.getJournalEntries(),
      this.getParties(),
      this.getSyncQueue(),
    ]);
    return JSON.stringify({
      entity: 'النقابة العامة للبناء',
      currency: 'EGP',
      accounts,
      entries,
      parties,
      sync,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  public async resetSampleData(): Promise<void> {
    this.memoryAccounts = [...INITIAL_ACCOUNTS];
    this.memoryEntries = [...INITIAL_ENTRIES];
    this.memoryParties = [...INITIAL_PARTIES];
    this.syncQueue = [];
    if (this.db) {
      const tx = this.db.transaction(['accounts', 'entries', 'parties', 'syncQueue'], 'readwrite');
      tx.objectStore('accounts').clear();
      tx.objectStore('entries').clear();
      tx.objectStore('parties').clear();
      tx.objectStore('syncQueue').clear();
      INITIAL_ACCOUNTS.forEach((a) => tx.objectStore('accounts').put(a));
      INITIAL_ENTRIES.forEach((e) => tx.objectStore('entries').put(e));
      INITIAL_PARTIES.forEach((p) => tx.objectStore('parties').put(p));
    } else {
      this.saveToLocalStorage();
    }
    this.invalidateCache();
  }
}

export const accountingDB = new AccountingDatabase();
