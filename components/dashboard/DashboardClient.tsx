"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Plus, Star, Clock, Search, Bell, Menu, Settings, Users } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import BoardCard from "@/components/dashboard/BoardCard";
import CreateWorkspaceModal from "@/components/dashboard/CreateWorkspaceModal";
import CreateBoardModal from "@/components/dashboard/CreateBoardModal";
import UserDropdown from "@/components/dashboard/UserDropdown";
import { createBoard } from "@/app/actions/board";
import { createWorkspace } from "@/app/actions/workspace";

interface Board {
  id: string;
  title: string;
  color: string;
  starred: boolean;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  color: string;
  boards: Board[];
}

interface DashboardClientProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  initialWorkspaces: Workspace[];
}

export default function DashboardClient({ name, email, avatarUrl, initialWorkspaces }: DashboardClientProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [activeWsId, setActiveWsId] = useState(initialWorkspaces[0]?.id ?? "");
  const [expandedIds, setExpandedIds] = useState<string[]>(initialWorkspaces[0]?.id ? [initialWorkspaces[0].id] : []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [search, setSearch] = useState("");

  const currentWs = workspaces.find((w) => w.id === activeWsId) ?? workspaces[0];
  const recentBoards = workspaces.flatMap((w) => w.boards.map((b) => ({ ...b, wsName: w.name }))).slice(0, 4);
  const starredBoards = workspaces.flatMap((w) => w.boards.filter((b) => b.starred).map((b) => ({ ...b, wsName: w.name })));

  function toggleExpand(id: string) {
    setExpandedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleStar(boardId: string) {
    setWorkspaces((prev) => prev.map((w) => ({
      ...w,
      boards: w.boards.map((b) => b.id === boardId ? { ...b, starred: !b.starred } : b),
    })));
  }

  async function handleCreateWorkspace(name: string, color: string) {
    const ws = await createWorkspace(name); // gọi DB thật
    setWorkspaces((prev) => [...prev, {
      id: ws.id,       // ← ID thật từ DB
      name: ws.name,
      slug: ws.slug,
      color,
      boards: [],
    }]);
    setActiveWsId(ws.id);
    setExpandedIds((prev) => [...prev, ws.id]);
    setShowCreateWs(false);
  }

  async function handleCreateBoard(title: string, color: string) {
    const board = await createBoard(activeWsId, title, color);
    setWorkspaces((prev) => prev.map((w) =>
      w.id === activeWsId
        ? { ...w, boards: [...w.boards, { id: board.id, title: board.title, color: board.imageUrl ?? color, starred: false }] }
        : w
    ));
    setShowCreateBoard(false);
  }

  const filteredWorkspaces = workspaces.map((w) => ({
    ...w,
    boards: search ? w.boards.filter((b) => b.title.toLowerCase().includes(search.toLowerCase())) : w.boards,
  }));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* TOPBAR */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-40">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img src="/logo.svg" alt="WorkFlow" className="h-7 w-auto object-contain" />

        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm board..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
          </button>
          <button
            onClick={() => setShowCreateBoard(true)}
            className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Tạo mới
          </button>

          <UserDropdown name={name} email={email} avatarUrl={avatarUrl} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            workspaces={workspaces}
            activeWsId={activeWsId}
            expandedIds={expandedIds}
            onSelectWs={setActiveWsId}
            onToggleExpand={toggleExpand}
            onCreateWs={() => setShowCreateWs(true)}
          />
        )}

        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {starredBoards.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-gray-300">Đã gắn sao</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {starredBoards.map((b) => (
                  <BoardCard key={b.id} board={b} onStar={() => toggleStar(b.id)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-300">Xem gần đây</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recentBoards.map((b) => (
                <BoardCard key={b.id} board={b} onStar={() => toggleStar(b.id)} />
              ))}
            </div>
          </section>
          {workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">Chưa có Workspace nào</h3>
            <p className="text-gray-500 text-sm mb-4">Tạo workspace đầu tiên để bắt đầu</p>
            <button
              onClick={() => setShowCreateWs(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tạo Workspace
            </button>
          </div>
        )}

          {filteredWorkspaces.map((ws) => (
            <section key={ws.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${ws.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {ws.name[0]}
                  </div>
                  <h2 className="text-sm font-semibold text-white">{ws.name}</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/workspace/${ws.id}/members`)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Thành viên
                  </button>
                  <button
                    onClick={() => router.push(`/workspace/${ws.id}/settings`)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" /> Cài đặt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ws.boards.map((b) => (
                  <BoardCard key={b.id} board={b} onStar={() => toggleStar(b.id)} />
                ))}
                <button
                  onClick={() => { setActiveWsId(ws.id); setShowCreateBoard(true); }}
                  className="h-24 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-gray-600 flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition-all group"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Thêm board
                </button>
              </div>
            </section>
          ))}
        </main>
      </div>

      {showCreateWs && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWs(false)}
          onCreate={handleCreateWorkspace}
        />
      )}

      {showCreateBoard && (
        <CreateBoardModal
          workspace={currentWs}
          onClose={() => setShowCreateBoard(false)}
          onCreate={handleCreateBoard}
        />
      )}
    </div>
  );
}
