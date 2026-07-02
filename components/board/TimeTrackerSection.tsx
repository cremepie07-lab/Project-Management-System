"use client";

/**
 * TimeTrackerSection.tsx
 * Drop vào trong CardModal — thay thế 2 tab "time" và "pomodoro" hiện tại.
 *
 * Cách tích hợp:
 *  1. Copy file này vào components/board/TimeTrackerSection.tsx
 *  2. Import vào CardModal.tsx:
 *       import TimeTrackerSection from "./TimeTrackerSection";
 *  3. Thay 2 khối {tab === "time" && (...)} và {tab === "pomodoro" && (...)}
 *     bằng một khối duy nhất:
 *       {(tab === "time" || tab === "pomodoro") && (
 *         <TimeTrackerSection
 *           cardId={card.id}
 *           initialTotalSeconds={localCard.totalTimeSpent ?? 0}
 *           mode={tab === "pomodoro" ? "pomodoro" : "tracker"}
 *         />
 *       )}
 *
 * Đặc điểm kỹ thuật:
 *  - Thời gian hiển thị = Date.now() - startedAt.getTime()
 *    → không bị reset khi switch tab, không phụ thuộc vào tick count
 *  - visibilitychange listener để resync khi tab được focus lại
 *  - Pomodoro dùng cùng cơ chế timestamp, lưu DB khi hoàn thành phiên
 *  - stopTimeEntry gọi transaction: ghi endedAt + cộng vào totalTimeSpent
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, Square, RotateCcw,
  Clock, Timer, Trash2, Plus, CheckCircle2,
} from "lucide-react";
import {
  startTimeEntry,
  stopTimeEntry,
  savePomodoroSession,
  getCardTimeEntries,
  getRunningEntry,
  removeTimeEntry,
} from "@/app/actions/time-tracking";

// ─── helpers ───────────────────────────────────────────────────────────────

function fmt(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtHuman(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}g ${m}p`;
  return `${m} phút`;
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit",
  });
}

function elapsedSec(from: Date) {
  return Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000));
}

// ─── constants ─────────────────────────────────────────────────────────────

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

// ─── types ─────────────────────────────────────────────────────────────────

interface EntryUser { id: string; name: string; avatarUrl?: string | null; }
interface TimeEntry {
  id: string;
  startedAt: string | Date;
  endedAt: string | Date | null;
  note?: string | null;
  user: EntryUser;
}

interface Props {
  cardId: string;
  initialTotalSeconds?: number;
  mode: "tracker" | "pomodoro";
}

// ─── component ─────────────────────────────────────────────────────────────

export default function TimeTrackerSection({ cardId, initialTotalSeconds = 0, mode }: Props) {

  // ── time tracker state ────────────────────────────────────────────
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [totalSaved, setTotalSaved] = useState(initialTotalSeconds);

  const [runningId, setRunningId] = useState<string | null>(null);
  const runningStartRef = useRef<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // ── pomodoro state ────────────────────────────────────────────────
  const [pomoPhase, setPomoPhase] = useState<"work" | "break">("work");
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoRemaining, setPomoRemaining] = useState(WORK_SEC);
  const pomoStartRef = useRef<Date | null>(null);    // wall-clock khi nhấn Start
  const pomoPhaseStartRef = useRef<Date | null>(null); // dùng để tính remaining khi resync

  // ── load on mount ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getCardTimeEntries(cardId), getRunningEntry(cardId)]).then(
      ([list, running]) => {
        setEntries(list);
        setLoaded(true);
        if (running) {
          setRunningId(running.id);
          runningStartRef.current = new Date(running.startedAt);
          setElapsed(elapsedSec(new Date(running.startedAt)));
        }
      }
    );
  }, [cardId]);

  // ── tick: elapsed timer — timestamp-based, không bị reset khi switch tab ─
  useEffect(() => {
    if (!runningId) return;
    const id = setInterval(() => {
      if (runningStartRef.current) setElapsed(elapsedSec(runningStartRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, [runningId]);

  // ── resync khi tab được focus lại ─────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (runningStartRef.current) setElapsed(elapsedSec(runningStartRef.current));
        if (pomoRunning && pomoPhaseStartRef.current) {
          const totalPhase = pomoPhase === "work" ? WORK_SEC : BREAK_SEC;
          const gone = elapsedSec(pomoPhaseStartRef.current);
          setPomoRemaining(Math.max(0, totalPhase - gone));
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pomoRunning, pomoPhase]);

  // ── pomodoro countdown — timestamp-based ──────────────────────────
  useEffect(() => {
    if (!pomoRunning) return;
    const id = setInterval(() => {
      if (!pomoPhaseStartRef.current) return;
      const totalPhase = pomoPhase === "work" ? WORK_SEC : BREAK_SEC;
      const gone = elapsedSec(pomoPhaseStartRef.current);
      const remaining = Math.max(0, totalPhase - gone);
      setPomoRemaining(remaining);
      if (remaining === 0) handlePomoPhaseEnd();
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoRunning, pomoPhase]);

  // ── handlers: time tracker ────────────────────────────────────────

  async function handleStart() {
    const entry = await startTimeEntry(cardId);
    setRunningId(entry.id);
    runningStartRef.current = new Date(entry.startedAt);
    setElapsed(0);
    setEntries((prev) => [entry, ...prev]);
  }

  async function handleStop() {
    if (!runningId) return;
    const res = await stopTimeEntry(cardId, runningId);
    setRunningId(null);
    runningStartRef.current = null;
    setElapsed(0);
    if (res) {
      setTotalSaved((s) => s + res.elapsedSeconds);
      setEntries((prev) =>
        prev.map((e) => (e.id === res.entry.id ? res.entry : e))
      );
    }
  }

  async function handleRemoveEntry(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    await removeTimeEntry(cardId, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (entry?.endedAt) {
      const sec = Math.round(
        (new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime()) / 1000
      );
      setTotalSaved((s) => Math.max(0, s - sec));
    }
  }

  // ── handlers: pomodoro ────────────────────────────────────────────

  function handlePomoStart() {
    if (!pomoRunning) {
      if (!pomoStartRef.current && pomoPhase === "work") pomoStartRef.current = new Date();
      pomoPhaseStartRef.current = new Date();
      setPomoRunning(true);
    }
  }

  function handlePomoPause() {
    setPomoRunning(false);
    // freeze remaining: don't reset pomoPhaseStartRef so resume re-uses it
    // We update pomoPhaseStartRef so next resume calculates correctly from now
    if (pomoPhaseStartRef.current) {
      const totalPhase = pomoPhase === "work" ? WORK_SEC : BREAK_SEC;
      const gone = elapsedSec(pomoPhaseStartRef.current);
      const remaining = Math.max(0, totalPhase - gone);
      setPomoRemaining(remaining);
      // Set a fake start that places "remaining" seconds in the future
      pomoPhaseStartRef.current = new Date(Date.now() - (totalPhase - remaining) * 1000);
    }
  }

  const handlePomoPhaseEnd = useCallback(async () => {
    setPomoRunning(false);

    // Beep
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

    // Nếu hoàn thành phiên WORK → lưu DB
    if (pomoPhase === "work" && pomoStartRef.current) {
      const endedAt = new Date();
      const entry = await savePomodoroSession(cardId, pomoStartRef.current, endedAt);
      if (entry) {
        const sec = Math.round(
          (endedAt.getTime() - pomoStartRef.current.getTime()) / 1000
        );
        setTotalSaved((s) => s + sec);
        setEntries((prev) => [entry as TimeEntry, ...prev]);
      }
    }

    pomoStartRef.current = null;
    pomoPhaseStartRef.current = null;

    const next = pomoPhase === "work" ? "break" : "work";
    setPomoPhase(next);
    setPomoRemaining(next === "work" ? WORK_SEC : BREAK_SEC);
  }, [cardId, pomoPhase]);

  function handlePomoReset() {
    setPomoRunning(false);
    pomoStartRef.current = null;
    pomoPhaseStartRef.current = null;
    setPomoPhase("work");
    setPomoRemaining(WORK_SEC);
  }

  // ── derived values ────────────────────────────────────────────────

  const totalDisplay = totalSaved + (runningId ? elapsed : 0);
  const pomoPct = Math.round(
    ((pomoPhase === "work" ? WORK_SEC : BREAK_SEC) - pomoRemaining) /
      (pomoPhase === "work" ? WORK_SEC : BREAK_SEC) * 100
  );
  const pomoCircumference = 2 * Math.PI * 54; // r=54

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  if (mode === "tracker") return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-4">

      {/* Tổng thời gian */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-0.5">
            Tổng thời gian ghi nhận
          </p>
          <p className="text-2xl font-bold text-white tabular-nums font-mono">
            {fmt(totalDisplay)}
          </p>
        </div>

        {/* Nút Play / Stop */}
        {runningId ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl border border-red-500/20 transition-colors"
          >
            <Square className="w-4 h-4 fill-red-400" /> Dừng
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Play className="w-4 h-4 fill-white" /> Bắt đầu
          </button>
        )}
      </div>

      {/* Live timer strip khi đang chạy */}
      {runningId && (
        <div className="flex items-center gap-3 bg-gray-700/50 border border-gray-700 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          <span className="text-xs text-gray-400">Phiên hiện tại</span>
          <span className="ml-auto text-sm font-bold text-white tabular-nums font-mono">
            {fmt(elapsed)}
          </span>
        </div>
      )}

      {/* Danh sách phiên */}
      <div className="border-t border-gray-700 pt-3 space-y-1.5 max-h-52 overflow-y-auto">
        {!loaded && <p className="text-xs text-gray-500">Đang tải...</p>}
        {loaded && entries.length === 0 && (
          <div className="text-center py-4">
            <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1.5" />
            <p className="text-xs text-gray-500">Chưa có phiên nào được ghi nhận.</p>
          </div>
        )}
        {entries.map((e) => {
          const sec = e.endedAt
            ? Math.round((new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 1000)
            : elapsed;
          return (
            <div key={e.id} className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {e.user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">
                  {e.note ?? "Phiên làm việc"}
                  {!e.endedAt && (
                    <span className="ml-1.5 text-green-400 font-medium">● đang chạy</span>
                  )}
                </p>
                <p className="text-[10px] text-gray-600">{fmtDate(e.startedAt)}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                {fmtHuman(sec)}
              </span>
              <button
                onClick={() => handleRemoveEntry(e.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-opacity shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── POMODORO MODE ────────────────────────────────────────────────
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-4">

      {/* Phase badge */}
      <div className="flex gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
          pomoPhase === "work"
            ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
            : "bg-green-600/25 text-green-300 border border-green-500/30"
        }`}>
          {pomoPhase === "work" ? "🎯 Tập trung" : "☕ Nghỉ ngơi"}
        </span>
      </div>

      {/* SVG ring timer */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="#374151" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={pomoPhase === "work" ? "#a855f7" : "#22c55e"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={pomoCircumference}
            strokeDashoffset={pomoCircumference * (1 - pomoPct / 100)}
            className="transition-all duration-500"
          />
        </svg>
        {/* Countdown text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white tabular-nums font-mono">
            {fmt(pomoRemaining)}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">{pomoPct}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {pomoRunning ? (
          <button
            onClick={handlePomoPause}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Pause className="w-4 h-4" /> Tạm dừng
          </button>
        ) : (
          <button
            onClick={handlePomoStart}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Play className="w-4 h-4 fill-white" /> {pomoRemaining < (pomoPhase === "work" ? WORK_SEC : BREAK_SEC) ? "Tiếp tục" : "Bắt đầu"}
          </button>
        )}
        <button
          onClick={handlePomoReset}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2.5 rounded-xl transition-colors"
          title="Đặt lại"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Thông tin */}
      <div className="w-full border-t border-gray-700 pt-3 space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Tổng thời gian ghi nhận</span>
          <span className="text-white font-medium tabular-nums">{fmtHuman(totalSaved)}</span>
        </div>
        <p className="text-[11px] text-gray-600 text-center pt-1">
          Hoàn thành phiên 25 phút → tự động lưu vào lịch sử thời gian của thẻ này.
        </p>
      </div>
    </div>
  );
}
