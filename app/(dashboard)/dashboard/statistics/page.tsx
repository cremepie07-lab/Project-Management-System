"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Clock, CheckCircle2, Flame, Target, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import PageHeader from "@/components/layout/PageHeader";

interface StatsData {
  totalCards: number;
  completedCards: number;
  overdueCards: number;
  totalBoards: number;
  totalLists: number;
  cardsPerBoard: { boardTitle: string; total: number; completed: number }[];
  cardsPerList: { listTitle: string; count: number }[];
  weeklyCompleted: { date: string; count: number }[];
  weeklyFocus: { date: string; minutes: number }[];
  topMembers: { name: string; completedCount: number }[];
}

function formatMinutes(m: number) {
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}g ${min}p` : `${h}g`;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function StatisticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/statistics");
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader title="Thống kê" />
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-pulse h-28" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader title="Thống kê" />
        <div className="max-w-6xl mx-auto p-6 text-center text-text-tertiary py-20">
          Không có dữ liệu thống kê.
        </div>
      </div>
    );
  }

  const completionRate = data.totalCards > 0 ? Math.round((data.completedCards / data.totalCards) * 100) : 0;
  const maxWeeklyCompleted = Math.max(...data.weeklyCompleted.map(d => d.count), 1);
  const maxWeeklyFocus = Math.max(...data.weeklyFocus.map(d => d.minutes), 1);

  return (
    <div className="min-h-screen bg-bg">
        <PageHeader title="Thống kê" />

      <main className="max-w-6xl mx-auto p-6 space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng thẻ", value: data.totalCards, icon: <Target className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10" },
            { label: "Hoàn thành", value: `${completionRate}%`, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-success", bg: "bg-success/10" },
            { label: "Quá hạn", value: data.overdueCards, icon: <Flame className="w-5 h-5" />, color: "text-danger", bg: "bg-danger/10" },
            { label: "Bảng", value: data.totalBoards, icon: <BarChart3 className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-2xl p-5 space-y-2">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg, s.color)}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-text">{s.value}</p>
              <p className="text-xs text-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Thẻ hoàn thành (7 ngày)</h3>
            <div className="flex items-end gap-2 h-40">
              {data.weeklyCompleted.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-tertiary tabular-nums">{d.count}</span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-8 bg-success/80 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(d.count / maxWeeklyCompleted) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                    />
                  </div>
                  <span className="text-[10px] text-text-tertiary">{WEEKDAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Thời gian tập trung (7 ngày)</h3>
            <div className="flex items-end gap-2 h-40">
              {data.weeklyFocus.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-tertiary tabular-nums">{formatMinutes(d.minutes)}</span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-8 bg-accent/80 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(d.minutes / maxWeeklyFocus) * 100}%`, minHeight: d.minutes > 0 ? 4 : 0 }}
                    />
                  </div>
                  <span className="text-[10px] text-text-tertiary">{WEEKDAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {data.cardsPerBoard.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Thẻ theo Board</h3>
            <div className="space-y-3">
              {data.cardsPerBoard.map((b) => {
                const pct = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
                return (
                  <div key={b.boardTitle}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary truncate">{b.boardTitle}</span>
                      <span className="text-xs text-text-tertiary tabular-nums">{b.completed}/{b.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.topMembers.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Thành viên tích cực nhất</h3>
            <div className="space-y-2">
              {data.topMembers.slice(0, 5).map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs text-white font-bold shrink-0">
                    {m.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-text flex-1 truncate">{m.name}</span>
                  <span className="text-sm font-semibold text-accent tabular-nums">{m.completedCount} thẻ</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
