"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Check, X, Loader2, LayoutGrid, ArrowLeft } from "lucide-react";
import { acceptInvitation, declineInvitation } from "@/app/actions/workspace-members";

interface InviteClientProps {
  workspaceId: string;
  workspaceName: string;
  inviterName: string | null;
  memberCount: number;
  userName: string;
}

export default function InviteClient({
  workspaceId,
  workspaceName,
  inviterName,
  memberCount,
  userName,
}: InviteClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading("accept");
    setError(null);
    const result = await acceptInvitation(workspaceId);
    if (result?.error) {
      setError(result.error);
      setLoading(null);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleDecline() {
    setLoading("decline");
    setError(null);
    const result = await declineInvitation(workspaceId);
    if (result?.error) {
      setError(result.error);
      setLoading(null);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-[#0d0e10] dark:via-[#0f1117] dark:to-[#0d0e10] flex items-center justify-center p-4 transition-colors duration-300">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-2xl dark:shadow-black/40 overflow-hidden">
          {/* Top gradient banner */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />

          <div className="p-8">
            {/* Workspace icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <LayoutGrid className="w-9 h-9 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">
                Lời mời tham gia
              </p>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">
                {workspaceName}
              </h1>
              {inviterName && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{inviterName}</span>
                  {" "}đã mời bạn tham gia workspace này
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{memberCount}</span>
                {" "}thành viên đang hoạt động
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAccept}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {loading === "accept" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {loading === "accept" ? "Đang xử lý..." : "Xác nhận tham gia"}
              </button>

              <button
                onClick={handleDecline}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2.5 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/30 font-medium py-3.5 px-6 rounded-2xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading === "decline" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {loading === "decline" ? "Đang xử lý..." : "Từ chối lời mời"}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 text-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                Quay về trang chủ
              </button>
            </div>
          </div>
        </div>

        {/* Logged in as */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          Đang đăng nhập với tài khoản <span className="font-medium">{userName}</span>
        </p>
      </div>
    </div>
  );
}
