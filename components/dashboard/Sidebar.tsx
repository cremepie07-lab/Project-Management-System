"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Home, Clock, Star, ChevronDown, Users, Settings, LogOut, Plus, Loader2, TrendingUp, BarChart3 } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  color: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

interface SidebarProps {
  workspaces: Workspace[];
  activeWsId: string;
  expandedIds: string[];
  onSelectWs: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onCreateWs: () => void;
}

export default function Sidebar({
  workspaces, activeWsId, expandedIds,
  onSelectWs, onToggleExpand, onCreateWs,
}: SidebarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeNav, setActiveNav] = useState("home");

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto shrink-0 select-none transition-colors duration-200">
      {/* Nav items */}
      <div className="p-3.5 space-y-1">
        {[
          { key: "home", icon: <Home className="w-[17px] h-[17px]" />, label: "Trang chủ", href: "/dashboard" },
          { key: "recent", icon: <Clock className="w-[17px] h-[17px]" />, label: "Đã xem gần đây", href: "/dashboard" },
          { key: "starred", icon: <Star className="w-[17px] h-[17px]" />, label: "Đã gắn sao", href: "/dashboard" },
          { key: "productivity", icon: <TrendingUp className="w-[17px] h-[17px]" />, label: "Trợ lý Năng suất", href: "/dashboard/productivity" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => { setActiveNav(item.key); router.push(item.href); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeNav === item.key
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-800 mx-4" />

      {/* Workspace list */}
      <div className="px-3.5 pt-4 pb-1 flex-1">
        <div className="flex items-center justify-between mb-2.5 px-2">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Workspaces
          </span>
          <button
            onClick={onCreateWs}
            title="Tạo workspace mới"
            className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {workspaces.map((ws) => (
            <div key={ws.id} className="space-y-0.5">
              <button
                onClick={() => { onSelectWs(ws.id); onToggleExpand(ws.id); }}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeWsId === ws.id
                    ? "bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg bg-linear-to-br ${ws.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`}>
                  {ws.name[0]}
                </div>
                <span className="flex-1 text-left truncate">{ws.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform shrink-0 ${expandedIds.includes(ws.id) ? "rotate-180" : ""}`} />
              </button>

              {expandedIds.includes(ws.id) && (
                <div className="ml-5 pl-2.5 border-l border-gray-200 dark:border-gray-800 mt-1 space-y-1 transition-colors duration-200">
                  {[
                    { icon: <LayoutGrid className="w-3.5 h-3.5" />, label: "Boards", href: `/dashboard` },
                    { icon: <Users className="w-3.5 h-3.5" />, label: "Thành viên", href: `/workspace/${ws.id}/members` },
                    { icon: <Settings className="w-3.5 h-3.5" />, label: "Cài đặt", href: `/workspace/${ws.id}/settings` },
                    ...(ws.role === "OWNER" || ws.role === "ADMIN"
                      ? [{ icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Tổng quan", href: `/workspace/${ws.id}/overview` }]
                      : []
                    ),
                  ].map((sub) => (
                    <button
                      key={sub.label}
                      onClick={() => router.push(sub.href)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-all duration-150 cursor-pointer"
                    >
                      {sub.icon} {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="p-3.5 border-t border-gray-200 dark:bg-transparent dark:border-gray-800">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <LogOut className="w-[17px] h-[17px] shrink-0" />}
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
}