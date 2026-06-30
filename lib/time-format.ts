// lib/time-format.ts

// Định dạng số giây -> "1h 23m" / "45m" / "30s"
export function formatDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Định dạng mm:ss cho đồng hồ đếm ngược Pomodoro
export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Tổng số giây đã track cho một mảng TimeEntry (entry đang chạy thì tính tới hiện tại)
export function sumTrackedSeconds(
  entries: { startedAt: Date | string; endedAt: Date | string | null }[]
): number {
  const now = Date.now();
  return entries.reduce((sum, e) => {
    const start = new Date(e.startedAt).getTime();
    const end = e.endedAt ? new Date(e.endedAt).getTime() : now;
    return sum + Math.max(0, (end - start) / 1000);
  }, 0);
}
