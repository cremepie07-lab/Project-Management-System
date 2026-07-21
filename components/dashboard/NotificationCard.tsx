"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  MoreHorizontal,
  MessageSquare,
  X,
  Loader2,
  UserCheck,
  AtSign,
  Clock,
  MessageCircle,
  Bell,
  Send,
} from "lucide-react";
import type { ActiveNotification, NotificationType } from "@/app/actions/notifications";
import { dismissNotification, replyToNotification } from "@/app/actions/notifications";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; Icon: React.ElementType; iconClass: string }
> = {
  self_assigned: {
    label: "Tự giao việc",
    Icon: UserCheck,
    iconClass: "text-indigo-500 dark:text-indigo-400",
  },
  mention: {
    label: "Đề cập",
    Icon: AtSign,
    iconClass: "text-violet-500 dark:text-violet-400",
  },
  due_date: {
    label: "Sắp đến hạn",
    Icon: Clock,
    iconClass: "text-amber-500 dark:text-amber-400",
  },
  comment: {
    label: "Bình luận",
    Icon: MessageCircle,
    iconClass: "text-blue-500 dark:text-blue-400",
  },
  invite: {
    label: "Lời mời",
    Icon: Bell,
    iconClass: "text-emerald-500 dark:text-emerald-400",
  },
  system: {
    label: "Thông báo",
    Icon: Bell,
    iconClass: "text-slate-500 dark:text-slate-400",
  },
};

interface NotificationCardProps {
  notification: ActiveNotification;
  userAvatar: string | null;
  userName: string;
}

export default function NotificationCard({
  notification,
  userAvatar,
  userName,
}: NotificationCardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replySent, setReplySent] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRelativeTime(formatRelativeTime(notification.createdAt));
  }, [notification.createdAt]);

  const config = TYPE_CONFIG[notification.type as NotificationType] ?? TYPE_CONFIG.system;
  const TypeIcon = config.Icon;

  async function handleDismiss() {
    setDismissing(true);
    const result = await dismissNotification(notification.id);
    if (result?.error) {
      setDismissing(false);
    } else {
      setDismissed(true);
    }
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    setReplying(true);
    setReplyError("");
    const result = await replyToNotification(notification.id, replyText);
    setReplying(false);
    if (result?.error) {
      setReplyError(result.error);
    } else {
      setReplySent(true);
      setReplyText("");
      setTimeout(() => {
        setShowReply(false);
        setReplySent(false);
      }, 2000);
    }
  }

  function handleNavigate() {
    if (notification.cardId) {
      router.push(`/board/${notification.boardId}?card=${notification.cardId}`);
    } else if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  }

  if (dismissed) return null;

  const cardClasses = [
    "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
    dismissing ? "opacity-0 scale-95 pointer-events-none" : "opacity-100",
  ].join(" ");

  const actionButtonClasses = [
    "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer select-none disabled:opacity-50",
    "border border-dashed border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20",
    "text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-500/5 active:scale-[0.98]",
  ].join(" ");

  return (
    <div className={cardClasses}>
      {/* Gradient banner header */}
      <div className="bg-gradient-to-r from-violet-500 to-blue-400 px-4 py-3 flex items-center justify-between select-none">
        <span
          onClick={handleNavigate}
          className="font-semibold text-xs text-white tracking-wide truncate max-w-[72%] drop-shadow-xs cursor-pointer hover:underline underline-offset-2"
        >
          {notification.cardTitle ?? notification.message.slice(0, 60)}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {notification.cardId && (
            <button
              onClick={handleNavigate}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Xem thẻ"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-white/20 flex items-center justify-center text-[9px] font-bold text-white shrink-0 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userName[0]?.toUpperCase() ?? "U"
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Breadcrumb */}
        {(notification.workspaceName || notification.listName) && (
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {notification.workspaceName}
            {notification.workspaceName && notification.listName && " | "}
            {notification.listName && (
              <span>
                {userName}: {notification.listName}
              </span>
            )}
          </div>
        )}

        {/* Actor + message + time */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-500/20">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {userName[0]?.toUpperCase() ?? "U"}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-white">Bạn </span>
              {notification.message}
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {mounted ? relativeTime : "..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div title={config.label} className="p-1">
              <TypeIcon className={"w-3.5 h-3.5 " + config.iconClass} />
            </div>
            <button className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reply box */}
        {showReply && (
          <div className="mt-1 space-y-2">
            {replySent ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <Send className="w-3 h-3" /> Đã gửi bình luận!
              </p>
            ) : (
              <>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập bình luận..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
                />
                {replyError && (
                  <p className="text-[10px] text-red-500 dark:text-red-400">{replyError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    {replying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Gửi
                  </button>
                  <button
                    onClick={() => { setShowReply(false); setReplyText(""); setReplyError(""); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Huỷ
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!showReply && (
          <div className={notification.cardId ? "flex gap-2.5 pt-1" : "flex justify-end pt-1"}>
            {notification.cardId && (
              <button
                onClick={() => setShowReply(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-150 cursor-pointer select-none"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                Trả lời
              </button>
            )}
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className={notification.cardId ? "flex-1 " + actionButtonClasses : actionButtonClasses}
            >
              {dismissing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              Bỏ qua
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
