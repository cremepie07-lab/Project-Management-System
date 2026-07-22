"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid, Home, Clock, Star, ChevronDown, Users, Settings,
  LogOut, Plus, Loader2, TrendingUp, Calendar, BarChart3, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/cn";

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
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  workspaces, activeWsId, expandedIds,
  onSelectWs, onToggleExpand, onCreateWs,
  isOpen, onClose,
}: SidebarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { key: "home", icon: Home, label: "Trang chu", href: "/dashboard" },
    { key: "recent", icon: Clock, label: "Da xem gan day", href: "/dashboard" },
    { key: "starred", icon: Star, label: "Da gan sao", href: "/dashboard" },
    { key: "calendar", icon: Calendar, label: "Lich", href: "/dashboard/calendar" },
    { key: "productivity", icon: TrendingUp, label: "Nang suat", href: "/dashboard/productivity" },
    { key: "statistics", icon: BarChart3, label: "Thong ke", href: "/dashboard/statistics" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-bg-overlay backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-14 bottom-0 left-0 z-40 w-60 flex-col border-r border-border-default bg-bg-sidebar overflow-y-auto transition-transform duration-200",
          "lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = typeof window !== "undefined" && window.location.pathname === item.href;
            return (
              <button
                key={item.key}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isActive
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-3 h-px bg-border-subtle" />

        <div className="px-3 pt-3 pb-1 flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Workspaces
            </span>
            <button
              onClick={onCreateWs}
              title="Tao workspace moi"
              className="cursor-pointer rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {workspaces.map((ws) => (
              <div key={ws.id}>
                <button
                  onClick={() => { onSelectWs(ws.id); onToggleExpand(ws.id); }}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer",
                    expandedIds.includes(ws.id)
                      ? "bg-bg-hover text-text-primary"
                      : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[10px] font-bold text-white",
                    ws.color
                  )}>
                    {ws.name[0]}
                  </div>
                  <span className="flex-1 truncate text-left">{ws.name}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-text-muted transition-transform duration-200",
                      expandedIds.includes(ws.id) && "rotate-180"
                    )}
                  />
                </button>

                {expandedIds.includes(ws.id) && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border-subtle pl-3">
                    {[
                      { icon: LayoutGrid, label: "Boards", href: "/dashboard" },
                      { icon: Users, label: "Thanh vien", href: `/workspace/${ws.id}/members` },
                      { icon: Settings, label: "Cai dat", href: `/workspace/${ws.id}/settings` },
                      ...(ws.role === "OWNER" || ws.role === "ADMIN"
                        ? [{ icon: ClipboardList, label: "Tong quan", href: `/workspace/${ws.id}/overview` }]
                        : []
                      ),
                    ].map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => { router.push(sub.href); onClose(); }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-muted transition-colors cursor-pointer hover:bg-bg-hover hover:text-text-primary"
                      >
                        <sub.icon className="h-3.5 w-3.5" />
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border-subtle p-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors cursor-pointer hover:bg-danger-subtle hover:text-danger disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {loggingOut ? "Dang dang xuat..." : "Dang xuat"}
          </button>
        </div>
      </aside>
    </>
  );
}
