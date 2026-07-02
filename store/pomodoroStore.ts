import { create } from "zustand";
import { persist } from "zustand/middleware";

export const WORK_SEC  = 25 * 60;
export const BREAK_SEC =  5 * 60;

interface PomodoroStore {
  // Card đang được đặt pomodoro
  cardId:    string | null;
  cardTitle: string | null;

  // Phase hiện tại
  phase: "work" | "break";

  // Đang chạy hay không
  running: boolean;

  /**
   * Timestamp (ms) thời điểm phase hiện tại BẮT ĐẦU chạy (hoặc resume).
   * Dùng để tính remaining = phaseTotal - (Date.now() - phaseStartedAt) / 1000
   * → không bị lệch dù tab bị ẩn hay modal bị đóng.
   */
  phaseStartedAt: number | null;

  /**
   * Số giây còn lại tại thời điểm PAUSE.
   * Khi running = false, đây là giá trị hiển thị.
   */
  pausedRemaining: number;

  /**
   * Timestamp (ms) khi phiên WORK bắt đầu (dùng để lưu DB khi kết thúc).
   */
  workSessionStartedAt: number | null;

  // ── Computed ──────────────────────────────────────────────────────────
  /** Số giây còn lại tại thời điểm gọi (luôn chính xác dù switch tab). */
  getRemaining: () => number;
  /** % đã đi qua của phase hiện tại (0-100). */
  getPct: () => number;

  // ── Actions ───────────────────────────────────────────────────────────
  /** Gắn store vào một card cụ thể (gọi khi mở CardModal). */
  attachCard: (cardId: string, cardTitle: string) => void;
  start:      () => void;
  pause:      () => void;
  reset:      () => void;
  /** Gọi khi phase về 0 (do CardModal hoặc MiniTimer xử lý side-effect lưu DB). */
  advancePhase: () => void;
  /** Xóa toàn bộ state (gọi sau khi lưu DB xong). */
  clear: () => void;
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      cardId:              null,
      cardTitle:           null,
      phase:               "work",
      running:             false,
      phaseStartedAt:      null,
      pausedRemaining:     WORK_SEC,
      workSessionStartedAt: null,

      // ── Computed ──────────────────────────────────────────────────────
      getRemaining() {
        const { running, phaseStartedAt, pausedRemaining, phase } = get();
        if (!running || !phaseStartedAt) return pausedRemaining;
        const total   = phase === "work" ? WORK_SEC : BREAK_SEC;
        const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
        return Math.max(0, total - elapsed);
      },

      getPct() {
        const { phase } = get();
        const total     = phase === "work" ? WORK_SEC : BREAK_SEC;
        const remaining = get().getRemaining();
        return Math.round(((total - remaining) / total) * 100);
      },

      // ── Actions ───────────────────────────────────────────────────────
      attachCard(cardId, cardTitle) {
        // Chỉ gắn nếu chưa có session nào đang chạy cho card khác
        const { cardId: current } = get();
        if (current && current !== cardId) return;
        set({ cardId, cardTitle });
      },

      start() {
        const { running, pausedRemaining, phase, workSessionStartedAt } = get();
        if (running) return;
        const now = Date.now();
        const total = phase === "work" ? WORK_SEC : BREAK_SEC;
        set({
          running: true,
          // Điều chỉnh phaseStartedAt để remaining khớp với pausedRemaining
          phaseStartedAt: now - (total - pausedRemaining) * 1000,
          workSessionStartedAt:
            phase === "work" && !workSessionStartedAt ? now : workSessionStartedAt,
        });
      },

      pause() {
        const remaining = get().getRemaining();
        set({ running: false, phaseStartedAt: null, pausedRemaining: remaining });
      },

      reset() {
        set({
          running:             false,
          phase:               "work",
          phaseStartedAt:      null,
          pausedRemaining:     WORK_SEC,
          workSessionStartedAt: null,
        });
      },

      advancePhase() {
        const { phase } = get();
        const next = phase === "work" ? "break" : "work";
        set({
          running:             false,
          phase:               next,
          phaseStartedAt:      null,
          pausedRemaining:     next === "work" ? WORK_SEC : BREAK_SEC,
          workSessionStartedAt: null,
        });
      },

      clear() {
        set({
          cardId:              null,
          cardTitle:           null,
          running:             false,
          phase:               "work",
          phaseStartedAt:      null,
          pausedRemaining:     WORK_SEC,
          workSessionStartedAt: null,
        });
      },
    }),
    {
      name: "workflow-pomodoro", // key trong localStorage
      // Chỉ persist các field cần thiết để resume sau khi reload trang
      partialize: (s) => ({
        cardId:               s.cardId,
        cardTitle:            s.cardTitle,
        phase:                s.phase,
        running:              s.running,
        phaseStartedAt:       s.phaseStartedAt,
        pausedRemaining:      s.pausedRemaining,
        workSessionStartedAt: s.workSessionStartedAt,
      }),
    }
  )
);
