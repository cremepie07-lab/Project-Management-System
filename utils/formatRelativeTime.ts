/**
 * Format a date as a relative time string in Vietnamese.
 * E.g. "vừa xong", "3 phút trước", "2 giờ trước", "5 ngày trước"
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const now = new Date();
    const d = typeof date === "string" ? new Date(date) : date;
    const diffMs = now.getTime() - d.getTime();

    if (diffMs < 0) return "vừa xong";

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffWeeks < 5) return `${diffWeeks} tuần trước`;
    if (diffMonths < 12) return `${diffMonths} tháng trước`;
    return `${Math.floor(diffMonths / 12)} năm trước`;
  } catch {
    return "vừa xong";
  }
}
