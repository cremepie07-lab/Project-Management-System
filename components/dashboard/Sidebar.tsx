"use client";

import { LayoutGrid, Home, Clock, Star, ChevronDown, Users, Settings, LogOut, Plus } from "lucide-react";

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
  onLogout: () => void;
}

export default function Sidebar({
  workspaces, activeWsId, expandedIds,
  onSelectWs, onToggleExpand, onCreateWs, onLogout,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto shrink-0">
      {/* Nav items */}
      <div className="p-3 space-y-0.5">
        <SidebarItem icon={<Home className="w-4 h-4" />} label="Trang chủ" active />
        <SidebarItem icon={<Clock className="w-4 h-4" />} label="Đã xem gần đây" />
        <SidebarItem icon={<Star className="w-4 h-4" />} label="Đã gắn sao" />
      </div>

      {/* Workspace list */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Workspaces
          </span>
          <button
            onClick={onCreateWs}
            className="text-gray-500 hover:text-white p-0.5 rounded transition-colors"
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
                  <SubItem icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Boards" />
                  <SubItem icon={<Users className="w-3.5 h-3.5" />} label="Thành viên" />
                  <SubItem icon={<Settings className="w-3.5 h-3.5" />} label="Cài đặt" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mt-auto p-3 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
      active ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
    }`}>
      {icon} {label}
    </button>
  );
}

function SubItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
      {icon} {label}
    </button>
  );
}