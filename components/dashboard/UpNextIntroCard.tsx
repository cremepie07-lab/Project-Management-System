"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

/**
 * UpNextIntroCard — Client Component
 *
 * A one-time intro card shown inside the "Sắp tới" section when there are
 * no active notifications yet. Explains what the section does and can be
 * permanently dismissed by the user (stored in localStorage).
 *
 * Important: dismissed state is only read from localStorage after mount
 * (useEffect) to avoid hydration mismatch between SSR and client CSR.
 */
const DISMISS_KEY = "upnext-intro-dismissed";

export default function UpNextIntroCard() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (!mounted) return null;
  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 dark:from-indigo-500/5 dark:to-violet-500/5 p-4 flex items-start gap-3 transition-all duration-300">
      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
          Sắp tới
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Các thẻ được giao cho bạn, hạn chót sắp tới, và bình luận mới sẽ
          xuất hiện ở đây.
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-white/60 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
        title="Ẩn thông báo này"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
