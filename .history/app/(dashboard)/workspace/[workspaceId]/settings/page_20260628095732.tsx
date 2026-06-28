// ── app/(dashboard)/workspace/[workspaceId]/settings/page.tsx ──
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/workspace/SettingsClient";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  });

  if (!workspace) redirect("/dashboard");

  const currentMember = workspace.members.find((m) => m.userId === session.userId);
  if (!currentMember) redirect("/dashboard");

  return (
    <SettingsClient
      workspace={{ id: workspace.id, name: workspace.name }}
      currentRole={currentMember.role as "OWNER" | "ADMIN" | "MEMBER"}
    />
  );
}


// ── components/workspace/SettingsClient.tsx ──
// (Tạo file riêng components/workspace/SettingsClient.tsx và paste phần dưới vào)

/*
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
    <div className="min-h-screen bg-gray-950">
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-white font-semibold text-sm">{workspace.name}</h1>
          <p className="text-gray-500 text-xs">Cài đặt Workspace</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {canEdit && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-purple-400" /> Thông tin Workspace
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên Workspace</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <button
                onClick={handleRename}
                disabled={saving || !name.trim() || name === workspace.name}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {isOwner && (
          <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Vùng nguy hiểm
            </h2>
            <p className="text-xs text-gray-500 mb-4">Xóa workspace sẽ xóa toàn bộ board, list và card bên trong. Không thể hoàn tác.</p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" /> Xóa Workspace
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Nhập tên workspace <span className="text-white font-semibold">"{workspace.name}"</span> để xác nhận:
                </p>
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder={workspace.name}
                  className="w-full bg-gray-800 border border-red-500/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={confirmDelete !== workspace.name || deleting}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Xác nhận xóa
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setConfirmDelete(""); }}
                    className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
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
*/