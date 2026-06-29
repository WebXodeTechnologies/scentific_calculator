import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
  id: number;
  expression: string;
  result: string;
  timestamp: string;
}

export interface AppState {
  theme: string;
  setTheme: (theme: string) => void;
  soundsOn: boolean;
  setSounds: (soundsOn: boolean) => void;
  animSpeed: number;
  setSpeed: (speed: number) => void;

  historyItems: HistoryItem[];
  setHistoryItems: (items: HistoryItem[] | ((prev: HistoryItem[]) => HistoryItem[])) => void;
  clearHistory: () => void;

  lastExpr: string;
  setLastExpr: (expr: string) => void;
  memory: number;
  setMemory: (memory: number) => void;
  angle: "DEG" | "RAD";
  setAngle: (angle: "DEG" | "RAD") => void;
  sci: boolean;
  setSci: (sci: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "cyber",
      setTheme: (theme) => set({ theme }),
      soundsOn: false,
      setSounds: (soundsOn) => set({ soundsOn }),
      animSpeed: 1,
      setSpeed: (animSpeed) => set({ animSpeed }),

      historyItems: [],
      setHistoryItems: (items) => set((state) => ({ 
        historyItems: typeof items === 'function' ? items(state.historyItems) : items 
      })),
      clearHistory: () => set({ historyItems: [] }),

      lastExpr: "",
      setLastExpr: (lastExpr) => set({ lastExpr }),
      memory: 0,
      setMemory: (memory) => set({ memory }),
      angle: "DEG",
      setAngle: (angle) => set({ angle }),
      sci: true,
      setSci: (sci) => set({ sci }),
    }),
    {
      name: 'calcx-storage', // name of the item in the storage (must be unique)
    }
  )
);
