"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Loader2, Check, AlertTriangle } from "lucide-react";
import { renameWorkspace, deleteWorkspaceById } from "@/app/actions/workspace-members";

type Role = "OWNER" | "ADMIN" | "MEMBER";

export default function SettingsClient({
  workspace,
  currentRole,
}: {
  workspace: { id: string; name: string };
  currentRole: Role;
}) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canEdit = currentRole === "OWNER" || currentRole === "ADMIN";
  const isOwner = currentRole === "OWNER";

  async function handleRename() {
    if (!name.trim() || name === workspace.name) return;
    setSaving(true);
    await renameWorkspace(workspace.id, name.trim());
    setSaving(false);
  }

  async function handleDelete() {
    if (confirmDelete !== workspace.name) return;
    setDeleting(true);
    await deleteWorkspaceById(workspace.id);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-bg-app text-gray-900 dark:text-text-primary transition-colors duration-150">
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-40 select-none">
        <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div>
          <h1 className="text-gray-900 dark:text-white font-bold text-sm leading-tight">{workspace.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Cài đặt Workspace</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {canEdit && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3.5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                <Pencil className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              Thông tin Workspace
            </h2>
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 px-0.5">Tên Workspace</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-450 dark:placeholder-gray-500 outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <button
                onClick={handleRename}
                disabled={saving || !name.trim() || name === workspace.name}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 duration-100"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {isOwner && (
          <div className="bg-red-50/10 dark:bg-red-950/5 border border-red-200 dark:border-red-500/20 rounded-3xl p-5 space-y-3.5 shadow-xs">
            <h2 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Vùng nguy hiểm
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
              Xóa workspace sẽ xóa vĩnh viễn toàn bộ board, list và card bên trong. Hành động này không thể hoàn tác.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-50 hover:bg-red-100/80 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-red-100 dark:border-red-500/20 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Xóa Workspace
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-450">
                  Nhập tên workspace <span className="text-gray-900 dark:text-white font-bold">"{workspace.name}"</span> để xác nhận:
                </p>
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder={workspace.name}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-red-200 dark:border-red-550/30 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-red-500 transition-all font-medium"
                />
                <div className="flex gap-2 select-none">
                  <button
                    onClick={handleDelete}
                    disabled={confirmDelete !== workspace.name || deleting}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Xác nhận xóa
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setConfirmDelete(""); }}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
