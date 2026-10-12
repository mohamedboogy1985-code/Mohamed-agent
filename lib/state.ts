/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import { Agent, ACCOUNTING_AGENTS } from './presets/agents';

export type User = {
  name: string;
  companyName: string;
  info: string;
};

export interface VoiceEventLog {
  id: string;
  type: 'speech' | 'tool' | 'system';
  speaker?: 'user' | 'agent';
  text: string;
  details?: any;
  timestamp: number;
}

export const useUser = create<{
  name: string;
  companyName: string;
  info: string;
  setName: (name: string) => void;
  setCompanyName: (companyName: string) => void;
  setInfo: (info: string) => void;
}>((set) => ({
  name: 'أحمد فتحي',
  companyName: 'النقابة العامة للبناء',
  info: 'أمين الصندوق والمشرف المالي العام بالنقابة العامة للبناء والأخشاب',
  setName: (name) => set({ name }),
  setCompanyName: (companyName) => set({ companyName }),
  setInfo: (info) => set({ info }),
}));

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>((set, get) => ({
  current: ACCOUNTING_AGENTS[0],
  availablePresets: ACCOUNTING_AGENTS,
  availablePersonal: [],

  addAgent: (agent: Agent) => {
    set((state) => ({
      availablePersonal: [...state.availablePersonal, agent],
      current: agent,
    }));
  },
  setCurrent: (agent: Agent | string) => {
    if (typeof agent === 'string') {
      const all = [...get().availablePresets, ...get().availablePersonal];
      const found = all.find((a) => a.id === agent);
      if (found) set({ current: found });
    } else {
      set({ current: agent });
    }
  },
  update: (agentId: string, adjustments: Partial<Agent>) => {
    set((state) => {
      const updateList = (list: Agent[]) =>
        list.map((a) => (a.id === agentId ? { ...a, ...adjustments } : a));
      const newPresets = updateList(state.availablePresets);
      const newPersonal = updateList(state.availablePersonal);
      const newCurrent =
        state.current.id === agentId
          ? { ...state.current, ...adjustments }
          : state.current;
      return {
        availablePresets: newPresets,
        availablePersonal: newPersonal,
        current: newCurrent,
      };
    });
  },
}));

export type ActiveTab = 'overview' | 'journal' | 'accounts' | 'reports' | 'offline_sync';

export const useUI = create<{
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showNewEntryModal: boolean;
  setShowNewEntryModal: (show: boolean) => void;
  eventLogs: VoiceEventLog[];
  addEventLog: (log: Omit<VoiceEventLog, 'id' | 'timestamp'>) => void;
  clearEventLogs: () => void;
}>((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  showAgentEdit: false,
  setShowAgentEdit: (show) => set({ showAgentEdit: show }),
  showUserConfig: false,
  setShowUserConfig: (show) => set({ showUserConfig: show }),
  showNewEntryModal: false,
  setShowNewEntryModal: (show) => set({ showNewEntryModal: show }),
  eventLogs: [
    {
      id: 'log-welcome',
      type: 'system',
      text: 'مرحباً بك في المساعد المحاسبي الصوتي الذكي. اضغط على زر بدء الاتصال للتحدث مباشرة مع محاسبك.',
      timestamp: Date.now(),
    },
  ],
  addEventLog: (log) =>
    set((state) => ({
      eventLogs: [
        {
          ...log,
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
        },
        ...state.eventLogs.slice(0, 49),
      ],
    })),
  clearEventLogs: () => set({ eventLogs: [] }),
}));
