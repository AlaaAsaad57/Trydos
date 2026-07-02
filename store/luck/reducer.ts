import {
  DEFAULT_LUCK_SECONDS,
  LuckTimer,
  addRedeemedId,
  isRedeemed,
  readTimer,
  writeTimer,
} from "utils/luck";

export interface LuckState {
  luckByProduct: Record<string, LuckTimer>;
}

const initialState: LuckState = {
  luckByProduct: {},
};

const key = (id: string | number) => String(id);

export const useLuckStore = (set, get) => ({
  ...initialState,

  /** Begin (or rehydrate) a product's luck window. No-op if already tracked
   *  in-memory or already redeemed; adopts a persisted window if present. */
  startLuck: (id: string | number, seconds: number = DEFAULT_LUCK_SECONDS) => {
    const k = key(id);
    const existing = get().luckByProduct[k];
    if (existing) return;

    if (isRedeemed(id)) {
      const expiredTimer: LuckTimer = {
        deadlineTs: null,
        pausedRemaining: 0,
        expired: true,
      };
      set((s) => ({
        luckByProduct: { ...s.luckByProduct, [k]: expiredTimer },
      }));
      return;
    }

    const persisted = readTimer(id);
    const timer: LuckTimer = persisted ?? {
      deadlineTs: Date.now() + seconds * 1000,
      pausedRemaining: null,
      expired: false,
    };
    writeTimer(id, timer);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: timer } }));
  },

  pauseLuck: (id: string | number) => {
    const k = key(id);
    const t = get().luckByProduct[k];
    if (!t || t.expired || t.deadlineTs == null) return; // not running
    const remaining = Math.max(
      0,
      Math.ceil((t.deadlineTs - Date.now()) / 1000),
    );
    const next: LuckTimer = {
      deadlineTs: null,
      pausedRemaining: remaining,
      expired: false,
    };
    writeTimer(id, next);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: next } }));
  },

  resumeLuck: (id: string | number) => {
    const k = key(id);
    const t = get().luckByProduct[k];
    if (!t || t.expired || t.pausedRemaining == null) return; // not paused
    const next: LuckTimer = {
      deadlineTs: Date.now() + t.pausedRemaining * 1000,
      pausedRemaining: null,
      expired: false,
    };
    writeTimer(id, next);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: next } }));
  },

  expireLuck: (id: string | number) => {
    const k = key(id);
    const t = get().luckByProduct[k];
    if (t?.expired) return;
    const next: LuckTimer = {
      deadlineTs: null,
      pausedRemaining: 0,
      expired: true,
    };
    writeTimer(id, next);
    addRedeemedId(id);
    set((s) => ({ luckByProduct: { ...s.luckByProduct, [k]: next } }));
  },
});
