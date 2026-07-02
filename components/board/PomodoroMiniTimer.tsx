"use client";

/**
 * PomodoroMiniTimer.tsx
 * Mini timer nổi ở góc dưới-phải màn hình.
 * Chỉ hiển thị khi có phiên Pomodoro đang chạy/paused.
 *
 * ─ Đặt vào layout:
 *   app/(dashboard)/layout.tsx  (hoặc layout bao ngoài board)
 *   import PomodoroMiniTimer from "@/components/board/PomodoroMiniTimer";
 *   ...
 *   <PomodoroMiniTimer />
 *
 * ─ Khi người dùng đóng CardModal, timer này tự hiện.
 *   Khi mở lại đúng card đó, CardModal lấy state từ store và timer ẩn đi
 *   (ẩn khi prop `hideForCardId` trùng với store.cardId — truyền từ CardModal).
 *   Hoặc để đơn giản hơn: luôn hiển thị mini timer (kể cả khi modal đang mở),
 *   nó không gây xung đột vì cùng dùng chung store.
 */

import { useEffect, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { usePomodoroStore, WORK_SEC, BREAK_SEC } from "@/store/pomodoroStore";
import { savePomodoroSession } from "@/app/actions/time-tracking";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function playBeep() {
  try {
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export default function PomodoroMiniTimer() {
  const store = usePomodoroStore();
  const [remaining, setRemaining] = useState(store.getRemaining());
  const [saving, setSaving] = useState(false);

  // Tick mỗi 500ms, dùng timestamp-based calculation
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(store.getRemaining());
    }, 500);
    return () => clearInterval(id);
  }, [store]);

  // Resync khi tab được focus lại
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRemaining(store.getRemaining());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [store]);

  // Xử lý khi đồng hồ về 0
  const handlePhaseEnd = useCallback(async () => {
    playBeep();
    const { phase, cardId, workSessionStartedAt } = store;

    if (phase === "work" && cardId && workSessionStartedAt) {
      setSaving(true);
      try {
        await savePomodoroSession(cardId, new Date(workSessionStartedAt), new Date());
      } catch {}
      setSaving(false);
    }

    store.advancePhase();
  }, [store]);

  useEffect(() => {
    if (remaining === 0 && store.running && !saving) {
      handlePhaseEnd();
    }
  }, [remaining, store.running, saving, handlePhaseEnd]);

  // Ẩn nếu không có session nào
  const hasSession =
    store.cardId !== null &&
    (store.running || store.pausedRemaining < (store.phase === "work" ? WORK_SEC : BREAK_SEC));

  if (!hasSession) return null;

  const total  = store.phase === "work" ? WORK_SEC : BREAK_SEC;
  const pct    = Math.round(((total - remaining) / total) * 100);
  const isWork = store.phase === "work";
  const circ   = 2 * Math.PI * 20; // r=20 cho SVG nhỏ

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl px-4 py-3 min-w-55">
      {/* SVG mini ring */}
      <div className="relative shrink-0" style={{ width: 48, height: 48 }}>
        <svg className="-rotate-90" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#374151" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke={isWork ? "#a855f7" : "#22c55e"}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Timer className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 truncate mb-0.5">
          {store.cardTitle ?? "Pomodoro"}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isWork ? "bg-purple-600/20 text-purple-300" : "bg-green-600/20 text-green-300"}`}>
            {isWork ? "Tập trung" : "Nghỉ"}
          </span>
          <span className="text-lg font-bold text-white tabular-nums font-mono">
            {fmt(remaining)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-1.5 shrink-0">
        {store.running ? (
          <button
            onClick={() => store.pause()}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
            title="Tạm dừng"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => store.start()}
            className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-colors"
            title="Tiếp tục"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
          </button>
        )}
        <button
          onClick={() => store.reset()}
          className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center transition-colors"
          title="Đặt lại"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
