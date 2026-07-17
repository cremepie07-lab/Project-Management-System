"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toastState: ToastItem[] = [];

function notify() {
  toastListeners.forEach((l) => l([...toastState]));
}

export function toast(type: ToastType, message: string) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  toastState = [...toastState, { id, type, message }];
  notify();
  setTimeout(() => {
    toastState = toastState.filter((t) => t.id !== id);
    notify();
  }, type === "error" ? 6000 : 4000);
}

const typeConfig: Record<ToastType, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-success/20 bg-success-subtle text-success",
  },
  error: {
    icon: AlertCircle,
    className: "border-danger/20 bg-danger-subtle text-danger",
  },
  info: {
    icon: Info,
    className: "border-info/20 bg-info-subtle text-info",
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toastState = toastState.filter((t) => t.id !== id);
    notify();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const config = typeConfig[t.type];
        const Icon = config.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-in",
              "min-w-[280px] max-w-[400px] bg-bg-elevated",
              config.className
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium text-text">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 text-text-tertiary hover:text-text"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
