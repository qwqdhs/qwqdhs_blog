import { create } from "zustand";
import type { HsvColor } from "@/utils/color";

export interface HistoryItem {
  id: string;
  hsv: HsvColor;
  createdAt: number;
}

const MAX_HISTORY = 12;
const STORAGE_KEY = "hsv-explorer:history";

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

interface ColorState {
  hsv: HsvColor;
  history: HistoryItem[];
  setH: (h: number) => void;
  setS: (s: number) => void;
  setV: (v: number) => void;
  setHsv: (hsv: HsvColor) => void;
  pushHistory: (hsv: HsvColor) => void;
  loadHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

export const useColorStore = create<ColorState>((set, get) => ({
  hsv: { h: 200, s: 0.7, v: 0.9 },
  history: loadHistory(),
  setH: (h) => set((s) => ({ hsv: { ...s.hsv, h: ((h % 360) + 360) % 360 } })),
  setS: (sValue) => set((s) => ({ hsv: { ...s.hsv, s: Math.max(0, Math.min(1, sValue)) } })),
  setV: (v) => set((s) => ({ hsv: { ...s.hsv, v: Math.max(0, Math.min(1, v)) } })),
  setHsv: (hsv) => set({ hsv: { h: ((hsv.h % 360) + 360) % 360, s: Math.max(0, Math.min(1, hsv.s)), v: Math.max(0, Math.min(1, hsv.v)) } }),
  pushHistory: (hsv) => {
    const current = get().history;
    const last = current[0];
    if (last && Math.abs(last.hsv.h - hsv.h) < 1 && Math.abs(last.hsv.s - hsv.s) < 0.01 && Math.abs(last.hsv.v - hsv.v) < 0.01) {
      return;
    }
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      hsv,
      createdAt: Date.now(),
    };
    const next = [item, ...current].slice(0, MAX_HISTORY);
    saveHistory(next);
    set({ history: next });
  },
  loadHistoryItem: (id) => {
    const item = get().history.find((i) => i.id === id);
    if (item) set({ hsv: item.hsv });
  },
  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },
}));
