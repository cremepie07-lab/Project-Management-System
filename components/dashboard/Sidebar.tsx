"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Home, Clock, Star, ChevronDown, Users, Settings, LogOut, Plus, Loader2, TrendingUp } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  color: string;
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
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto shrink-0">
      {/* Nav items */}
      <div className="p-3 space-y-0.5">
        {[
          { key: "home", icon: <Home className="w-4 h-4" />, label: "Trang chủ", href: "/dashboard" },
          { key: "recent", icon: <Clock className="w-4 h-4" />, label: "Đã xem gần đây", href: "/dashboard" },
          { key: "starred", icon: <Star className="w-4 h-4" />, label: "Đã gắn sao", href: "/dashboard" },
          { key: "productivity", icon: <TrendingUp className="w-4 h-4" />, label: "Trợ lý Năng suất", href: "/dashboard/productivity" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => { setActiveNav(item.key); router.push(item.href); }}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
              activeNav === item.key
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-800 mx-3" />

      {/* Workspace list */}
      <div className="px-3 pt-3 pb-1 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
            Workspaces
          </span>
          <button
            onClick={onCreateWs}
            title="Tạo workspace mới"
            className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {workspaces.map((ws) => (
            <div key={ws.id}>
              <button
                onClick={() => { onSelectWs(ws.id); onToggleExpand(ws.id); }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                  activeWsId === ws.id
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div className={`w-6 h-6 rounded-md bg-linear-to-br ${ws.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {ws.name[0]}
                </div>
                <span className="flex-1 text-left truncate">{ws.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${expandedIds.includes(ws.id) ? "rotate-180" : ""}`} />
              </button>

              {expandedIds.includes(ws.id) && (
                <div className="ml-3 pl-3 border-l border-gray-800 mt-0.5 space-y-0.5">
                  {[
                    { icon: <LayoutGrid className="w-3.5 h-3.5" />, label: "Boards", href: `/dashboard` },
                    { icon: <Users className="w-3.5 h-3.5" />, label: "Thành viên", href: `/workspace/${ws.id}/members` },
                    { icon: <Settings className="w-3.5 h-3.5" />, label: "Cài đặt", href: `/workspace/${ws.id}/settings` },
                  ].map((sub) => (
                    <button
                      key={sub.label}
                      onClick={() => router.push(sub.href)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-800 hover:text-white transition-colors"
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
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
}