"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: Date | string;
}

export default function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      // Ensure serialized dates are converted/handled if needed
      setNotifications(data as any);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Optional: Poll every 30s to keep it fresh
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      // Mark as read in background
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      await markAsRead(n.id);
    }
    setOpen(false);
    if (n.linkUrl) {
      router.push(n.linkUrl);
      router.refresh();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await markAllAsRead();
  };

  function formatTimeAgo(dateInput: Date | string) {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) {
            loadNotifications();
          }
        }}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-150 relative cursor-pointer shadow-xs active:scale-95 shrink-0"
        title="Thông báo"
      >
        <Bell className="w-[17px] h-[17px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Thông báo {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60 flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Không có thông báo mới</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px]">
                  Bạn sẽ nhận được thông báo khi có người giao việc cho bạn trong Workspace.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`px-4 py-3.5 text-left transition-colors cursor-pointer flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                    !n.isRead ? "bg-indigo-50/20 dark:bg-indigo-500/5" : ""
                  }`}
                >
                  {/* Indicator Dot */}
                  <div className="mt-1.5 shrink-0">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        !n.isRead ? "bg-indigo-500" : "bg-transparent border border-gray-300 dark:border-gray-700"
                      }`}
                    />
                  </div>
                  
                  {/* Message body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold ${!n.isRead ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-normal ${!n.isRead ? "text-gray-700 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}`}>
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
