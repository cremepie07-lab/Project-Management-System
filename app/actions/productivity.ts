"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getWeekStart, toISODate } from "@/lib/date-utils";

export interface ProductivityData {
  focusMinutesLast7Days: { date: string; minutes: number }[];
  completedTasksPerDay: { date: string; count: number }[];
  timeDistribution: { boardTitle: string; minutes: number }[];
  totalFocusMinutesThisWeek: number;
  totalCompletedThisWeek: number;
  completedToday: number;
  totalCompletedAllTime: number;
  completionStreak: number;
  pomodoroSessionsThisWeek: number;
  dailyFocusStreak: number;
  weeklyGoalHours: number;
}

export async function getProductivityData(): Promise<ProductivityData> {
  const session = await requireSession();
  const now = new Date();

  // This week range (Monday → Sunday, Vietnamese convention)
  const weekStart = getWeekStart(now);

  // Range for "last 7 days" historical chart data:
  // Monday of the current week through Sunday (full week).
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Also compute a wider window for streak calculations (need older data)
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59);
  sixtyDaysAgo.setHours(0, 0, 0, 0);

  // Today start
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // 1. Fetch completed time entries in the wider window (for streaks + charts)
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: session.userId,
      endedAt: { not: null },
      startedAt: { gte: sixtyDaysAgo },
    },
    include: {
      card: {
        include: {
          list: {
            include: { board: true },
          },
        },
      },
    },
  });

  // Aggregate focus minutes per day (full map for streaks)
  const focusMap: Record<string, number> = {};
  const distMap: Record<string, number> = {};
  let totalFocusMinutesThisWeek = 0;
  let pomodoroSessionsThisWeek = 0;

  for (const entry of timeEntries) {
    const started = new Date(entry.startedAt);
    const ended = new Date(entry.endedAt!);
    const seconds = Math.round((ended.getTime() - started.getTime()) / 1000);
    const minutes = seconds / 60;

    // Per day aggregation
    const dateKey = toISODate(started);
    focusMap[dateKey] = (focusMap[dateKey] ?? 0) + minutes;

    // This week total (Monday → now)
    if (started >= weekStart) {
      totalFocusMinutesThisWeek += minutes;
      if (entry.note === "Phiên Pomodoro") {
        pomodoroSessionsThisWeek++;
      }
    }

    // Board distribution (all time within window)
    const boardTitle = entry.card.list.board.title;
    distMap[boardTitle] = (distMap[boardTitle] ?? 0) + minutes;
  }

  // Build Monday → Sunday focus data for the current week
  const focusMinutesLast7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toISODate(d);
    return { date: key, minutes: Math.round(focusMap[key] ?? 0) };
  });

  // 2. Fetch completed tasks using isCompleted + completedAt
  const completedCards = await prisma.card.findMany({
    where: {
      isCompleted: true,
      completedBy: session.userId,
      completedAt: { not: null },
    },
    select: {
      completedAt: true,
    },
  });

  const completedTasksPerDay: Record<string, number> = {};
  let totalCompletedThisWeek = 0;
  let completedToday = 0;
  let totalCompletedAllTime = completedCards.length;

  for (const card of completedCards) {
    const completedDate = new Date(card.completedAt!);

    if (completedDate >= sixtyDaysAgo) {
      const key = toISODate(completedDate);
      completedTasksPerDay[key] = (completedTasksPerDay[key] ?? 0) + 1;
    }

    if (completedDate >= weekStart) {
      totalCompletedThisWeek++;
    }

    if (completedDate >= todayStart) {
      completedToday++;
    }
  }

  // Build Monday → Sunday completed-tasks data for the current week
  const completedTasksLast7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toISODate(d);
    return { date: key, count: completedTasksPerDay[key] ?? 0 };
  });

  // 3. Time distribution
  const timeDistribution = Object.entries(distMap)
    .map(([boardTitle, minutes]) => ({ boardTitle, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes);

  // 4. Daily focus streak (consecutive days with ≥30 min focus, up to 365)
  let dailyFocusStreak = 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toISODate(d);
    if ((focusMap[key] ?? 0) >= 30) {
      dailyFocusStreak++;
    } else {
      break;
    }
  }

  // 5. Completion streak (consecutive days with at least 1 completed task)
  let completionStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toISODate(d);
    if ((completedTasksPerDay[key] ?? 0) >= 1) {
      completionStreak++;
    } else {
      break;
    }
  }

  return {
    focusMinutesLast7Days,
    completedTasksPerDay: completedTasksLast7Days,
    timeDistribution,
    totalFocusMinutesThisWeek: Math.round(totalFocusMinutesThisWeek),
    totalCompletedThisWeek,
    completedToday,
    totalCompletedAllTime,
    completionStreak,
    pomodoroSessionsThisWeek,
    dailyFocusStreak,
    weeklyGoalHours: 10,
  };
}
