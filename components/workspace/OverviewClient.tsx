"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Users, CheckCircle2, Flame, Target,
  ChevronDown, Search, Filter, ArrowUpDown, LayoutGrid,
} from "lucide-react";
import type { OverviewData, CardRow, MemberStats } from "@/app/actions/workspace-overview";

type CardStatus = "all" | "in_progress" | "completed" | "overdue";
type SortKey = "dueDate" | "assignee";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_LABEL: Record<CardStatus, string> = {
  all: "Tất cả",
  in_progress: "Đang làm",
  completed: "Hoàn thành",
  overdue: "Quá hạn",
};

const STATUS_STYLE: Record<CardStatus, string> = {
  all: "text-text-secondary bg-bg-elevated border-border-default",
  in_progress: "text-info bg-info-subtle border border-blue-500/20",
  completed: "text-success bg-success-subtle border border-green-500/20",
  overdue: "text-danger bg-danger-subtle border border-red-500/20",
};

export default function OverviewClient({
  workspace,
  initialData,
}: {
  workspace: { id: string; name: string };
  initialData: OverviewData;
  currentRole: "OWNER" | "ADMIN";
}) {
  const router = useRouter();
  const { members, cards, boards, totalCards, totalCompleted, totalOverdue } = initialData;

  const [filterMember, setFilterMember] = useState("all");
  const [filterBoard, setFilterBoard] = useState("all");
  const [filterStatus, setFilterStatus] = useState<CardStatus>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = useMemo(() => {
    let result = [...cards];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.assignees.some((a) => a.name.toLowerCase().includes(q))
      );
    }

    if (filterMember !== "all") {
      result = result.filter((c) => c.assignees.some((a) => a.id === filterMember));
    }

    if (filterBoard !== "all") {
      result = result.filter((c) => {
        const board = boards.find((b) => b.title === c.boardTitle);
        return board?.id === filterBoard;
      });
    }

    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }

    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      result = result.filter((c) => c.dueDate && new Date(c.dueDate) >= from);
    }

    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((c) => c.dueDate && new Date(c.dueDate) <= to);
    }

    result.sort((a, b) => {
      if (sortKey === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return sortAsc ? da - db : db - da;
      }
      const na = a.assignees[0]?.name ?? "zzz";
      const nb = b.assignees[0]?.name ?? "zzz";
      return sortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
    });

    return result;
  }, [cards, filterMember, filterBoard, filterStatus, filterDateFrom, filterDateTo, sortKey, sortAsc, searchQuery, boards]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-bg-app text-gray-900 dark:text-text-primary transition-colors duration-150">
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-40 select-none">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div>
          <h1 className="text-gray-900 dark:text-white font-bold text-sm leading-tight">{workspace.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Tổng quan công việc</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng thẻ", value: totalCards, icon: <Target className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10" },
            { label: "Đang làm", value: totalCards - totalCompleted, icon: <Flame className="w-5 h-5" />, color: "text-info", bg: "bg-info-subtle" },
            { label: "Hoàn thành", value: totalCompleted, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-success", bg: "bg-success-subtle" },
            { label: "Quá hạn", value: totalOverdue, icon: <Flame className="w-5 h-5" />, color: "text-danger", bg: "bg-danger-subtle" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── SECTION 1: MEMBER OVERVIEW ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-gray-150 dark:border-gray-850">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                <Users className="w-4 h-4 text-accent" />
              </div>
              Tổng quan thành viên ({members.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-150 dark:divide-gray-850">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xs border border-gray-100 dark:border-gray-800">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {m.name[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{m.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold tabular-nums text-info">{m.activeCount}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Đang làm</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold tabular-nums text-success">{m.completedCount}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Hoàn thành</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold tabular-nums text-gray-700 dark:text-gray-300">{m.totalCount}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Tổng</p>
                  </div>
                </div>

                <div className="hidden sm:block w-32 shrink-0">
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{
                        width: m.totalCount > 0 ? `${Math.round((m.completedCount / m.totalCount) * 100)}%` : "0%",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right tabular-nums">
                    {m.totalCount > 0 ? Math.round((m.completedCount / m.totalCount) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                Chưa có thành viên nào.
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: CARD TABLE ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-gray-150 dark:border-gray-850">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                <LayoutGrid className="w-4 h-4 text-accent" />
              </div>
              Tất cả thẻ ({filteredCards.length})
            </h2>
          </div>

          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm thẻ..."
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-500 transition-all font-medium w-44"
                />
              </div>

              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer transition-all focus:border-indigo-500"
              >
                <option value="all">Tất cả thành viên</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.name}</option>
                ))}
              </select>

              <select
                value={filterBoard}
                onChange={(e) => setFilterBoard(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer transition-all focus:border-indigo-500"
              >
                <option value="all">Tất cả board</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>

              <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {(["all", "in_progress", "completed", "overdue"] as CardStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                      filterStatus === s
                        ? STATUS_STYLE[s]
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer transition-all focus:border-indigo-500"
                title="Từ ngày"
              />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer transition-all focus:border-indigo-500"
                title="Đến ngày"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Thẻ</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Board / List</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Thành viên</th>
                  <th
                    className="px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 select-none"
                    onClick={() => toggleSort("dueDate")}
                  >
                    <span className="flex items-center gap-1">
                      Due date
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-850">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate block max-w-xs">{card.title}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{card.boardTitle}</span>
                      <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{card.listTitle}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {card.assignees.length === 0 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Chưa giao</span>
                        )}
                        {card.assignees.slice(0, 3).map((a) => (
                          <div key={a.id} className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800" title={a.name}>
                            {a.avatarUrl ? (
                              <img src={a.avatarUrl} alt={a.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                                {a.name[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                        {card.assignees.length > 3 && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">+{card.assignees.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs tabular-nums ${
                        card.status === "overdue"
                          ? "text-danger font-semibold"
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {formatDate(card.dueDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        card.status === "completed"
                          ? "text-success bg-success-subtle"
                          : card.status === "overdue"
                            ? "text-danger bg-danger-subtle"
                            : "text-info bg-info-subtle"
                      }`}>
                        {card.status === "completed" ? "Hoàn thành" : card.status === "overdue" ? "Quá hạn" : "Đang làm"}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredCards.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                      Không tìm thấy thẻ nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
