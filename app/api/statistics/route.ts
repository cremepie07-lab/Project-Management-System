import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getWeekStart, toISODate } from "@/lib/date-utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = getWeekStart(now);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const memberWorkspaces = await prisma.workspaceMember.findMany({
    where: { userId: session.userId },
    select: { workspaceId: true },
  });
  const workspaceIds = memberWorkspaces.map((m) => m.workspaceId);

  const boards = await prisma.board.findMany({
    where: { workspaceId: { in: workspaceIds } },
    select: {
      id: true,
      title: true,
      lists: {
        select: {
          title: true,
          cards: {
            select: {
              id: true,
              isCompleted: true,
              completedAt: true,
              cardMembers: {
                select: { userId: true, user: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  });

  let totalCards = 0;
  let completedCards = 0;
  let overdueCards = 0;
  const cardsPerBoard: { boardTitle: string; total: number; completed: number }[] = [];
  const cardsPerList: { listTitle: string; count: number }[] = [];
  const memberMap: Record<string, { name: string; count: number }> = {};

  for (const board of boards) {
    let boardTotal = 0;
    let boardCompleted = 0;

    for (const list of board.lists) {
      for (const card of list.cards) {
        totalCards++;
        boardTotal++;
        if (card.isCompleted) {
          completedCards++;
          boardCompleted++;
        }

        if (!card.isCompleted && card.completedAt === null) {
          // Check overdue via dueDate if needed
        }

        for (const cm of card.cardMembers) {
          if (!memberMap[cm.userId]) {
            memberMap[cm.userId] = { name: cm.user.name, count: 0 };
          }
          if (card.isCompleted) {
            memberMap[cm.userId].count++;
          }
        }
      }

      cardsPerList.push({ listTitle: list.title, count: list.cards.length });
    }

    cardsPerBoard.push({ boardTitle: board.title, total: boardTotal, completed: boardCompleted });
  }

  // Time entries for weekly focus
  const weekStartFull = new Date(weekStart);
  weekStartFull.setHours(0, 0, 0, 0);

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: session.userId,
      endedAt: { not: null },
      startedAt: { gte: weekStartFull, lte: weekEnd },
    },
    select: { startedAt: true, endedAt: true },
  });

  const focusMap: Record<string, number> = {};
  for (const entry of timeEntries) {
    const seconds = Math.round((new Date(entry.endedAt!).getTime() - new Date(entry.startedAt).getTime()) / 1000);
    const dateKey = toISODate(new Date(entry.startedAt));
    focusMap[dateKey] = (focusMap[dateKey] ?? 0) + seconds / 60;
  }

  // Completed per day this week
  const completedCardsList = await prisma.card.findMany({
    where: {
      isCompleted: true,
      completedAt: { not: null, gte: weekStartFull, lte: weekEnd },
      list: {
        board: {
          workspace: { members: { some: { userId: session.userId } } },
        },
      },
    },
    select: { completedAt: true },
  });

  const completedMap: Record<string, number> = {};
  for (const card of completedCardsList) {
    const dateKey = toISODate(new Date(card.completedAt!));
    completedMap[dateKey] = (completedMap[dateKey] ?? 0) + 1;
  }

  // Build weekly arrays (Mon-Sun)
  const weeklyFocus: { date: string; minutes: number }[] = [];
  const weeklyCompleted: { date: string; count: number }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toISODate(d);
    weeklyFocus.push({ date: key, minutes: Math.round(focusMap[key] ?? 0) });
    weeklyCompleted.push({ date: key, count: completedMap[key] ?? 0 });
  }

  const topMembers = Object.values(memberMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    totalCards,
    completedCards,
    overdueCards,
    totalBoards: boards.length,
    totalLists: boards.reduce((s, b) => s + b.lists.length, 0),
    cardsPerBoard,
    cardsPerList,
    weeklyCompleted,
    weeklyFocus,
    topMembers,
  });
}
