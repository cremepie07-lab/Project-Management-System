"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export interface ProductivityData {
  focusMinutesLast7Days: { date: string; minutes: number }[];
  completedTasksPerDay: { date: string; count: number }[];
  timeDistribution: { boardTitle: string; minutes: number }[];
  totalFocusMinutesThisWeek: number;
  totalCompletedThisWeek: number;
  pomodoroSessionsThisWeek: number;
  dailyFocusStreak: number;
  weeklyGoalHours: number;
}

const DONE_KEYWORDS = ["done", "hoàn thành", "thành công"];

export async function getProductivityData(): Promise<ProductivityData> {
  const session = await requireSession();
  const now = new Date();

  // Last 7 days range
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // This week range (Monday to now)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // 1. Fetch completed time entries in last 7 days
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: session.userId,
      endedAt: { not: null },
      startedAt: { gte: sevenDaysAgo },
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

  // Aggregate focus minutes per day (last 7 days)
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
    const dateKey = started.toISOString().split("T")[0];
    focusMap[dateKey] = (focusMap[dateKey] ?? 0) + minutes;

    // This week total
    if (started >= weekStart) {
      totalFocusMinutesThisWeek += minutes;
      if (entry.note === "Phiên Pomodoro") {
        pomodoroSessionsThisWeek++;
      }
    }

    // Board distribution
    const boardTitle = entry.card.list.board.title;
    distMap[boardTitle] = (distMap[boardTitle] ?? 0) + minutes;
  }

  const focusMinutesLast7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    return { date: key, minutes: Math.round(focusMap[key] ?? 0) };
  });

  // 2. Fetch completed tasks (cards in "done" lists assigned to user, completed this week)
  const userCards = await prisma.card.findMany({
    where: {
      cardMembers: { some: { userId: session.userId } },
      list: {
        board: { workspace: { members: { some: { userId: session.userId } } } },
      },
    },
    include: { list: true },
  });

  const completedTasksPerDay: Record<string, number> = {};
  let totalCompletedThisWeek = 0;

  for (const card of userCards) {
    const listTitle = card.list.title.toLowerCase();
    const isDone = DONE_KEYWORDS.some(kw => listTitle.includes(kw));
    if (!isDone) continue;

    // Use card.updatedAt as proxy for completion date
    const updatedAt = new Date(card.updatedAt);
    if (updatedAt >= sevenDaysAgo) {
      const key = updatedAt.toISOString().split("T")[0];
      completedTasksPerDay[key] = (completedTasksPerDay[key] ?? 0) + 1;
      if (updatedAt >= weekStart) {
        totalCompletedThisWeek++;
      }
    }
  }

  const completedTasksLast7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    return { date: key, count: completedTasksPerDay[key] ?? 0 };
  });

  // 3. Time distribution
  const timeDistribution = Object.entries(distMap)
    .map(([boardTitle, minutes]) => ({ boardTitle, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes);

  // 4. Daily focus streak
  let dailyFocusStreak = 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if ((focusMap[key] ?? 0) >= 30) {
      dailyFocusStreak++;
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
    pomodoroSessionsThisWeek,
    dailyFocusStreak,
    weeklyGoalHours: 10,
  };
}
