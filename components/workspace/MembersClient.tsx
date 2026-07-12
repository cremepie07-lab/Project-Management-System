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

const ROLE_COLOR: Record<Role, string> = {
  OWNER: "text-amber-400 bg-amber-400/10",
  ADMIN: "text-purple-400 bg-purple-400/10",
  MEMBER: "text-gray-400 bg-gray-400/10",
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
    // If owner, ensure ownership transferred before leaving
    if (currentRole === "OWNER") {
      if (members.length > 1) {
        alert("Bạn phải chuyển quyền Chủ sở hữu cho thành viên khác trước khi rời khỏi Workspace.");
        return;
      }
      // Sole owner, delete workspace directly
      setLoadingId(currentUserId);
      await deleteWorkspaceById(workspace.id);
      setLoadingId(null);
      router.push("/dashboard");
      router.refresh();
      return;
    }
    // Regular member leave
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
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-white font-semibold text-sm">{workspace.name}</h1>
          <p className="text-gray-500 text-xs">Quản lý thành viên</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Invite */}
        {canManage && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-400" /> Mời thành viên
            </h2>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="Email người dùng..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
              />
              <button
                onClick={handleInvite}
                disabled={inviting || !email.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Mời
              </button>
            </div>
            {inviteError && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><X className="w-3 h-3" />{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1"><Check className="w-3 h-3" />{inviteSuccess}</p>
            )}
          </div>
        )}

        {/* Member list */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">{members.length} thành viên</h2>
          </div>

          <div className="divide-y divide-gray-800">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                  {member.user.avatarUrl ? (
                    <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {member.user.name[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{member.user.name}</p>
                    {member.userId === currentUserId && (
                      <span className="text-xs text-gray-500">(bạn)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                </div>

                {/* Role badge */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${ROLE_COLOR[member.role]}`}>
                  {member.role === "OWNER" && <Crown className="w-3 h-3" />}
                  {member.role === "ADMIN" && <Shield className="w-3 h-3" />}
                  {member.role === "MEMBER" && <User className="w-3 h-3" />}
                  {ROLE_LABEL[member.role]}
                </span>

                {/* Actions */}
                {loadingId === member.userId ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    {/* Quản lý thành viên khác */}
                    {member.userId !== currentUserId && member.role !== "OWNER" && canManage && (
                      <>
                        {isOwner && (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 outline-none"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OWNER">Chủ sở hữu</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleRemove(member)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* Nút Rời Workspace cho bản thân nếu không phải Owner */}
                    {member.userId === currentUserId && (
                      <button
                        onClick={handleLeave}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
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

        {/* Xóa Workspace nếu là thành viên duy nhất và là Owner */}
        {isOwner && members.length === 1 && (
          <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-red-400">Vùng nguy hiểm</h3>
            <p className="text-xs text-gray-500">
              Bạn là thành viên duy nhất của Workspace này. Để rời khỏi, bạn cần phải xóa Workspace. Hành động này sẽ xóa sạch tất cả các Board và Card bên trong.
            </p>
            <button
              onClick={handleDeleteWorkspace}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
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