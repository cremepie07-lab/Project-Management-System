"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Target, Timer, CheckCircle2, Zap, TrendingUp } from "lucide-react";
import type { ProductivityData } from "@/app/actions/productivity";
import { getDayLabel, formatDateShort } from "@/lib/date-utils";

interface Props {
  userName: string;
  data: ProductivityData;
}

function formatMinutes(m: number) {
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}g ${min}p` : `${h}g`;
}

// ─── SVG Line/Area Chart ─────────────────────────────────────────────────────

function FocusLineChart({ data }: { data: { date: string; minutes: number }[] }) {
  const w = 560, h = 200, pad = 40, padR = 20, padB = 30;
  const chartW = w - pad - padR;
  const chartH = h - pad - padB;
  const maxVal = Math.max(...data.map(d => d.minutes), 1);

  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * chartW,
    y: pad + chartH - (d.minutes / maxVal) * chartH,
    minutes: d.minutes,
    date: d.date,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad + chartH} L ${points[0].x} ${pad + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = pad + chartH - pct * chartH;
        const val = Math.round(maxVal * pct);
        return (
          <g key={pct}>
            <line x1={pad} y1={y} x2={w - padR} y2={y} stroke="#374151" strokeWidth="0.5" />
            <text x={pad - 6} y={y + 3} textAnchor="end" fill="#6b7280" fontSize="9">{val}p</text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaPath} fill="url(#focusGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#1f1f2e" stroke="#a855f7" strokeWidth="2" />
          {/* Day label */}
          <text x={p.x} y={h - 8} textAnchor="middle" fill="#6b7280" fontSize="9">{getDayLabel(p.date)}</text>
          {/* Date label */}
          <text x={p.x} y={h - 0} textAnchor="middle" fill="#4b5563" fontSize="7">{formatDateShort(p.date)}</text>
          {/* Value tooltip */}
          {p.minutes > 0 && (
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#c084fc" fontSize="8" fontWeight="600">{p.minutes}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────

function CompletedBarChart({ data }: { data: { date: string; count: number }[] }) {
  const w = 560, h = 180, pad = 40, padR = 20, padB = 30;
  const chartW = w - pad - padR;
  const chartH = h - pad - padB;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW = chartW / data.length * 0.5;
  const gap = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.5, 1].map(pct => {
        const y = pad + chartH - pct * chartH;
        const val = Math.round(maxVal * pct);
        return (
          <g key={pct}>
            <line x1={pad} y1={y} x2={w - padR} y2={y} stroke="#374151" strokeWidth="0.5" />
            <text x={pad - 6} y={y + 3} textAnchor="end" fill="#6b7280" fontSize="9">{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = maxVal > 0 ? (d.count / maxVal) * chartH : 0;
        const x = pad + i * gap + (gap - barW) / 2;
        const y = pad + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} rx="4" fill="#22c55e" opacity="0.85" />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="600">{d.count}</text>
            )}
            <text x={x + barW / 2} y={h - 8} textAnchor="middle" fill="#6b7280" fontSize="9">{getDayLabel(d.date)}</text>
            <text x={x + barW / 2} y={h - 0} textAnchor="middle" fill="#4b5563" fontSize="7">{formatDateShort(d.date)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────

const DONUT_COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#8b5cf6"];

function TimeDonutChart({ data }: { data: { boardTitle: string; minutes: number }[] }) {
  const total = data.reduce((s, d) => s + d.minutes, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-xs">
        Chưa có dữ liệu thời gian
      </div>
    );
  }

  const cx = 100, cy = 100, r = 70, strokeW = 24;
  const circumference = 2 * Math.PI * r;
  let accumulated = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth={strokeW} />
        {data.map((d, i) => {
          const pct = d.minutes / total;
          const dashLen = pct * circumference;
          const dashOff = -(accumulated / total) * circumference;
          accumulated += d.minutes;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={strokeW} strokeLinecap="round"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOff}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{formatMinutes(total)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize="8">Tổng cộng</text>
      </svg>
      <div className="space-y-2 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-xs text-gray-300 truncate">{d.boardTitle}</span>
            <span className="text-xs text-gray-500 ml-auto shrink-0">{formatMinutes(d.minutes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProductivityClient({ userName, data }: Props) {
  const router = useRouter();

  const weeklyGoalMinutes = data.weeklyGoalHours * 60;
  const goalPct = Math.min(Math.round((data.totalFocusMinutesThisWeek / weeklyGoalMinutes) * 100), 100);
  const goalMinutesLeft = Math.max(weeklyGoalMinutes - data.totalFocusMinutesThisWeek, 0);

  const stats = [
    { label: "Tập trung tuần này", value: formatMinutes(data.totalFocusMinutesThisWeek), icon: <Timer className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Hoàn thành tuần", value: `${data.totalCompletedThisWeek}`, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Hoàn thành hôm nay", value: `${data.completedToday}`, icon: <Zap className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Tổng đã hoàn thành", value: `${data.totalCompletedAllTime}`, icon: <TrendingUp className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Phiên Pomodoro", value: `${data.pomodoroSessionsThisWeek}`, icon: <Zap className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Chuỗi tập trung", value: `${data.dailyFocusStreak} ngày`, icon: <Flame className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Chuỗi hoàn thành", value: `${data.completionStreak} ngày`, icon: <Target className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3">
        <button onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <TrendingUp className="w-5 h-5 text-purple-400" />
        <h1 className="text-white font-bold text-lg">Trợ lý Năng suất</h1>
        <span className="text-xs text-gray-500 ml-1">Xin chào, {userName}</span>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly Goal */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Mục tiêu tuần ({data.weeklyGoalHours}g)</h2>
            </div>
            <span className="text-xs text-gray-400">
              {goalMinutesLeft > 0 ? `Còn ${formatMinutes(goalMinutesLeft)}` : "Đã hoàn thành!"}
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 bg-linear-to-r from-purple-600 to-purple-400"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-600">0g</span>
            <span className="text-xs font-medium text-purple-400">{goalPct}%</span>
            <span className="text-[10px] text-gray-600">{data.weeklyGoalHours}g</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Focus Line Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Thời gian tập trung (7 ngày)</h2>
            <FocusLineChart data={data.focusMinutesLast7Days} />
          </div>

          {/* Completed Bar Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Việc hoàn thành (7 ngày)</h2>
            <CompletedBarChart data={data.completedTasksPerDay} />
          </div>
        </div>

        {/* Time Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Phân bổ thời gian theo Board</h2>
          <TimeDonutChart data={data.timeDistribution} />
        </div>

        {/* Achievements */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Thành tích</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Người mới bắt đầu", desc: "Hoàn thành việc đầu tiên", unlocked: data.totalCompletedAllTime > 0, icon: "🌟" },
              { label: "Chiến binh Pomodoro", desc: "5 phiên Pomodoro trong tuần", unlocked: data.pomodoroSessionsThisWeek >= 5, icon: "🍅" },
              { label: "Focus Master", desc: "Tập trung 10g/tuần", unlocked: data.totalFocusMinutesThisWeek >= 600, icon: "🧠" },
              { label: "Streak Lord", desc: "Chuỗi tập trung 3 ngày", unlocked: data.dailyFocusStreak >= 3, icon: "🔥" },
              { label: "Người hoàn thành", desc: "10 việc đã hoàn thành", unlocked: data.totalCompletedAllTime >= 10, icon: "✅" },
              { label: "Completion Streak", desc: "Chuỗi hoàn thành 3 ngày", unlocked: data.completionStreak >= 3, icon: "🏆" },
              { label: "Overachiever", desc: "5 việc hoàn thành trong 1 ngày", unlocked: data.completedTasksPerDay.some(c => c.count >= 5), icon: "💎" },
            ].map((a) => (
              <div key={a.label} className={`rounded-xl p-3 border transition-colors ${a.unlocked ? "bg-purple-500/10 border-purple-500/30" : "bg-gray-800/50 border-gray-800 opacity-50"}`}>
                <span className="text-2xl">{a.icon}</span>
                <p className="text-xs font-semibold text-white mt-1.5">{a.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{a.desc}</p>
                {a.unlocked && <span className="text-[10px] text-purple-400 font-medium">Đã mở khóa</span>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
