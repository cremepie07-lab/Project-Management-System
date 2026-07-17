"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Star, Clock, Search, Menu, Settings, Users, Eye, MoreHorizontal, MessageSquare, X } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import BoardCard from "@/components/dashboard/BoardCard";
import CreateWorkspaceModal from "@/components/dashboard/CreateWorkspaceModal";
import CreateBoardModal from "@/components/dashboard/CreateBoardModal";
import UserDropdown from "@/components/dashboard/UserDropdown";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
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

interface AssignedCard {
  id: string;
  title: string;
  listName: string;
  boardName: string;
  workspaceName: string;
  updatedAt: string;
  actionText?: string;
  userAvatar?: string | null;
  userName?: string;
}

interface DashboardClientProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  initialWorkspaces: Workspace[];
  assignedCards?: AssignedCard[];
}

export default function DashboardClient({ name, email, avatarUrl, initialWorkspaces, assignedCards = [] }: DashboardClientProps) {
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
    const ws = await createWorkspace(name);
    setWorkspaces((prev) => [...prev, {
      id: ws.id,
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0e10] text-gray-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* TOPBAR */}
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-40 select-none shadow-xs transition-colors duration-200">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        <img src="/logo.svg" alt="WorkFlow" className="h-6 w-auto object-contain shrink-0" />

        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm board..."
              className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-450 dark:placeholder-gray-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Light/Dark Toggle */}
          <ThemeToggle />
          
          {/* Notification dropdown */}
          <NotificationCenter />

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 shrink-0" />

          {/* User profile dropdown */}
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

        <main className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 dark:bg-transparent">
          {starredBoards.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-3.5 px-1">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Đã gắn sao</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {starredBoards.map((b) => (
                  <BoardCard key={b.id} board={b} onStar={() => toggleStar(b.id)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2.5 mb-3.5 px-1">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Xem gần đây</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentBoards.map((b) => (
                <BoardCard key={b.id} board={b} onStar={() => toggleStar(b.id)} />
              ))}
            </div>
          </section>

          {/* ── SẮP TỚI: FEED THÔNG BÁO ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 mb-3.5 px-1">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sắp tới</h2>
            </div>
            
            <div className="flex flex-col gap-4 max-w-xl">
              {((assignedCards && assignedCards.length > 0) ? assignedCards.map(c => {
                // Tính thời gian tương đối
                let timeAgo = "Vừa xong";
                try {
                  const now = new Date();
                  const date = new Date(c.updatedAt);
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHours / 24);

                  if (diffMins < 1) timeAgo = "Vừa xong";
                  else if (diffMins < 60) timeAgo = `${diffMins} phút trước`;
                  else if (diffHours < 24) timeAgo = `${diffHours} giờ trước`;
                  else timeAgo = `${diffDays} ngày trước`;
                } catch (_) {}

                return { ...c, timeAgo };
              }) : [
                {
                  id: "mock-1",
                  title: "Thiết kế UI/UX hệ thống quản lý công việc",
                  listName: "Cần làm",
                  boardName: "Dự án mới",
                  workspaceName: "minh",
                  actionText: "đã tự thêm mình vào",
                  userName: name,
                  userAvatar: avatarUrl,
                  timeAgo: "2 ngày trước",
                },
                {
                  id: "mock-2",
                  title: "Tích hợp API và viết Unit Test cho Auth",
                  listName: "Đang làm",
                  boardName: "Core App",
                  workspaceName: "minh",
                  actionText: "đã được phân công vào thẻ này",
                  userName: name,
                  userAvatar: avatarUrl,
                  timeAgo: "5 ngày trước",
                }
              ]).map((card) => (
                <div 
                  key={card.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col group/feed"
                >
                  {/* Header gradient banner */}
                  <div className="bg-gradient-to-r from-violet-500 to-blue-400 px-4 py-3 flex items-center justify-between text-white select-none">
                    <span className="font-semibold text-xs tracking-wide truncate max-w-[70%] drop-shadow-xs">
                      {card.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-white/80 hover:text-white cursor-pointer transition-colors" />
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-white/20 flex items-center justify-center text-[9px] font-bold text-white shrink-0 select-none">
                        {card.userName ? card.userName[0].toUpperCase() : "M"}
                      </div>
                    </div>
                  </div>

                  {/* Body content */}
                  <div className="p-4 space-y-3.5">
                    {/* Breadcrumb nhỏ chữ xám */}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase">
                      {card.workspaceName} | {card.userName || "Thành viên"}: {card.listName}
                    </div>

                    {/* Nội dung chi tiết */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {card.userAvatar ? (
                          <img 
                            src={card.userAvatar} 
                            alt={card.userName || "Avatar"} 
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800 shadow-xs" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {card.userName ? card.userName[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="text-xs text-slate-600 dark:text-slate-350">
                          <span className="font-semibold text-slate-900 dark:text-white">Bạn</span> {card.actionText || "đã thực hiện hành động"}
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{card.timeAgo}</span>
                        </div>
                      </div>

                      {/* Options menu button */}
                      <button className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action buttons matching Thêm Board style */}
                    <div className="flex gap-2.5 pt-1.5">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-98 transition-all duration-150 cursor-pointer select-none">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        Trả lời
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-98 transition-all duration-150 cursor-pointer select-none">
                        <X className="w-3.5 h-3.5" />
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {workspaces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs max-w-lg mx-auto">
              <h3 className="text-gray-900 dark:text-white font-semibold text-base mb-2">Chưa có Workspace nào</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 max-w-xs leading-normal">
                Tạo một workspace đầu tiên để có thể quản lý các dự án và board làm việc của nhóm.
              </p>
              <button
                onClick={() => setShowCreateWs(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 duration-100"
              >
                <Plus className="w-4 h-4" /> Tạo Workspace
              </button>
            </div>
          )}

          {filteredWorkspaces.map((ws) => (
            <section key={ws.id} className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs transition-colors duration-200">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${ws.color} flex items-center justify-center text-white text-xs font-bold shadow-xs`}>
                    {ws.name[0]}
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{ws.name}</h2>
                </div>
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    onClick={() => router.push(`/workspace/${ws.id}/members`)}
                    className="text-xs font-medium text-gray-500 dark:text-gray-450 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> Thành viên
                  </button>
                  <button
                    onClick={() => router.push(`/workspace/${ws.id}/settings`)}
                    className="text-xs font-medium text-gray-500 dark:text-gray-450 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" /> Cài đặt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ws.boards.map((b) => (
                  <BoardCard key={b.id} board={b} onStar={() => toggleStar(b.id)} />
                ))}
                <button
                  onClick={() => { setActiveWsId(ws.id); setShowCreateBoard(true); }}
                  className="h-24 rounded-2xl bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-dashed border-gray-250 dark:border-gray-800 hover:border-gray-350 dark:hover:border-gray-700 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium transition-all group cursor-pointer hover:scale-[1.01] active:scale-99 shadow-xs"
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
