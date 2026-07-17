"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Shield, User, Trash2, Loader2, Crown, Check, X } from "lucide-react";
import { inviteMember, updateMemberRole, removeMember, leaveWorkspace, transferWorkspaceOwnership, deleteWorkspaceById } from "@/app/actions/workspace-members";

type Role = "OWNER" | "ADMIN" | "MEMBER";

interface Member {
  id: string;
  role: Role;
  userId: string;
  user: { id: string; name: string; email: string; avatarUrl?: string | null };
}

interface MembersClientProps {
  workspace: { id: string; name: string };
  members: Member[];
  currentUserId: string;
  currentRole: Role;
}

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Chủ sở hữu",
  ADMIN: "Quản trị viên",
  MEMBER: "Thành viên",
};

const ROLE_STYLES: Record<Role, string> = {
  OWNER: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/25",
  ADMIN: "text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-200/60 dark:border-indigo-400/25",
  MEMBER: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
};

export default function MembersClient({ workspace, members: init, currentUserId, currentRole }: MembersClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState(init);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";
  const isOwner = currentRole === "OWNER";

  async function handleInvite() {
    if (!email.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    const result = await inviteMember(workspace.id, email.trim());
    setInviting(false);

    if (result.error) { setInviteError(result.error); return; }
    if (result.success && result.user) {
      setMembers((prev) => [...prev, {
        id: Date.now().toString(),
        role: "MEMBER",
        userId: result.user!.id,
        user: result.user!,
      }]);
      setEmail("");
      setInviteSuccess("Đã mời thành công!");
      setTimeout(() => setInviteSuccess(""), 3000);
    }
  }

  async function handleRoleChange(member: Member, role: Role) {
    if (role === "OWNER") {
      if (!confirm(`Bạn có chắc chắn muốn chuyển quyền Chủ sở hữu cho ${member.user.name}? Bạn sẽ trở thành Quản trị viên (Admin).`)) {
        return;
      }
      setLoadingId(member.userId);
      const result = await transferWorkspaceOwnership(workspace.id, member.userId);
      setLoadingId(null);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
      return;
    }

    setLoadingId(member.userId);
    const result = await updateMemberRole(workspace.id, member.userId, role as "ADMIN" | "MEMBER");
    setLoadingId(null);
    if (result.error) return;
    setMembers((prev) => prev.map((m) => m.userId === member.userId ? { ...m, role } : m));
    router.refresh();
  }

  async function handleRemove(member: Member) {
    if (!confirm(`Xóa ${member.user.name} khỏi workspace?`)) return;
    setLoadingId(member.userId);
    const result = await removeMember(workspace.id, member.userId);
    setLoadingId(null);
    if (result.error) return;
    setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
  }

  async function handleLeave() {
    if (currentRole === "OWNER") {
      if (members.length > 1) {
        alert("Bạn phải chuyển quyền Chủ sở hữu cho thành viên khác trước khi rời khỏi Workspace.");
        return;
      }
      setLoadingId(currentUserId);
      await deleteWorkspaceById(workspace.id);
      setLoadingId(null);
      router.push("/dashboard");
      router.refresh();
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn rời khỏi Workspace này không?")) return;
    setLoadingId(currentUserId);
    const result = await leaveWorkspace(workspace.id);
    setLoadingId(null);
    if (result.error) {
      alert(result.error);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleDeleteWorkspace() {
    const wsName = prompt(`Nhập đúng tên Workspace "${workspace.name}" để xác nhận xóa:`);
    if (wsName !== workspace.name) {
      if (wsName !== null) alert("Tên Workspace không chính xác!");
      return;
    }
    setLoadingId(currentUserId);
    await deleteWorkspaceById(workspace.id);
    setLoadingId(null);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-bg-app text-gray-900 dark:text-text-primary transition-colors duration-150">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-40 select-none">
        <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div>
          <h1 className="text-gray-900 dark:text-white font-bold text-sm leading-tight">{workspace.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Quản lý thành viên</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* ── SECTION 1: Invite ── */}
        {canManage && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3.5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              Mời thành viên
            </h2>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="Email người dùng..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-450 dark:placeholder-gray-500 outline-none focus:border-indigo-500 transition-all font-medium"
              />
              <button
                onClick={handleInvite}
                disabled={inviting || !email.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 duration-100"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Mời
              </button>
            </div>
            {inviteError && (
              <p className="text-red-650 dark:text-red-400 text-xs mt-2.5 flex items-center gap-1.5 font-medium"><X className="w-3.5 h-3.5" />{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-emerald-650 dark:text-emerald-400 text-xs mt-2.5 flex items-center gap-1.5 font-medium"><Check className="w-3.5 h-3.5" />{inviteSuccess}</p>
            )}
          </div>
        )}

        {/* ── SECTION 2: Member list ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-gray-150 dark:border-gray-850">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{members.length} thành viên</h2>
          </div>

          <div className="divide-y divide-gray-150 dark:divide-gray-850">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xs border border-gray-100 dark:border-gray-800">
                  {member.user.avatarUrl ? (
                    <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {member.user.name[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.user.name}</p>
                    {member.userId === currentUserId && (
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">(bạn)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.user.email}</p>
                </div>

                {/* Role badge */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs ${ROLE_STYLES[member.role]}`}>
                  {member.role === "OWNER" && <Crown className="w-3.5 h-3.5" />}
                  {member.role === "ADMIN" && <Shield className="w-3.5 h-3.5" />}
                  {member.role === "MEMBER" && <User className="w-3.5 h-3.5" />}
                  {ROLE_LABEL[member.role]}
                </span>

                {/* Actions */}
                {loadingId === member.userId ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    {member.userId !== currentUserId && member.role !== "OWNER" && canManage && (
                      <>
                        {isOwner && (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                            className="cursor-pointer bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-xl px-2.5 py-1.5 outline-none font-medium transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OWNER">Chủ sở hữu</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleRemove(member)}
                          className="cursor-pointer p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 duration-100"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {member.userId === currentUserId && (
                      <button
                        onClick={handleLeave}
                        className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100/80 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 transition-all active:scale-95"
                      >
                        Rời Workspace
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 3: Danger zone ── */}
        {isOwner && members.length === 1 && (
          <div className="bg-red-50/10 dark:bg-red-950/5 border border-red-200 dark:border-red-500/20 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Vùng nguy hiểm</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
              Bạn là thành viên duy nhất của Workspace này. Để rời khỏi, bạn cần phải xóa Workspace. Hành động này sẽ xóa sạch tất cả các Board và Card bên trong.
            </p>
            <button
              onClick={handleDeleteWorkspace}
              className="cursor-pointer w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Xóa Workspace này
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
