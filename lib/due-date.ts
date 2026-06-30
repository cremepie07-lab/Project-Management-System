// lib/due-date.ts

export type DueDateStatus = "overdue" | "soon" | "normal";

export function formatDueDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function getDueDateStatus(date: Date | string | null | undefined): DueDateStatus | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (diffMs < 0) return "overdue";
  if (diffMs < oneDayMs) return "soon";
  return "normal";
}

export const DUE_DATE_STYLES: Record<DueDateStatus, string> = {
  overdue: "bg-red-500/10 text-red-400 border-red-500/30",
  soon: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  normal: "bg-gray-700/50 text-gray-400 border-gray-700",
};

// Chuyển Date -> chuỗi "YYYY-MM-DD" để gán cho <input type="date">
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
