"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export interface MemberStats {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  activeCount: number;
  completedCount: number;
  totalCount: number;
}

export interface CardRow {
  id: string;
  title: string;
  boardTitle: string;
  listTitle: string;
  assignees: { id: string; name: string; avatarUrl: string | null }[];
  dueDate: string | null;
  isCompleted: boolean;
  status: "completed" | "overdue" | "in_progress";
}

export interface OverviewData {
  members: MemberStats[];
  cards: CardRow[];
  boards: { id: string; title: string }[];
  totalCards: number;
  totalCompleted: number;
  totalOverdue: number;
}

async function assertAdminOrOwner(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("FORBIDDEN");
  }
  return member;
}

export async function getWorkspaceOverview(workspaceId: string): Promise<OverviewData> {
  const session = await requireSession();
  await assertAdminOrOwner(workspaceId, session.userId);

  const acceptedMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId, status: "ACCEPTED" },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  const userIds = acceptedMembers.map((m) => m.userId);

  const allCards = await prisma.card.findMany({
    where: {
      list: { board: { workspaceId } },
    },
    include: {
      list: { select: { title: true, board: { select: { id: true, title: true } } } },
      cardMembers: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const memberStats: MemberStats[] = userIds.map((uid) => {
    const assignedCards = allCards.filter((c) =>
      c.cardMembers.some((cm) => cm.userId === uid)
    );
    const completedCount = assignedCards.filter((c) => c.isCompleted).length;
    const overdueCount = assignedCards.filter(
      (c) => !c.isCompleted && c.dueDate && new Date(c.dueDate) < now
    ).length;
    const activeCount = assignedCards.length - completedCount;
    const user = acceptedMembers.find((m) => m.userId === uid)!;
    return {
      userId: uid,
      name: user.user.name,
      email: user.user.email,
      avatarUrl: user.user.avatarUrl,
      activeCount,
      completedCount,
      totalCount: assignedCards.length,
    };
  });

  memberStats.sort((a, b) => b.activeCount - a.activeCount);

  const boards = await prisma.board.findMany({
    where: { workspaceId },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  const cards: CardRow[] = allCards.map((c) => {
    const dueDateObj = c.dueDate ? new Date(c.dueDate) : null;
    let status: CardRow["status"] = "in_progress";
    if (c.isCompleted) {
      status = "completed";
    } else if (dueDateObj && dueDateObj < now) {
      status = "overdue";
    }
    return {
      id: c.id,
      title: c.title,
      boardTitle: c.list.board.title,
      listTitle: c.list.title,
      assignees: c.cardMembers.map((cm) => ({
        id: cm.user.id,
        name: cm.user.name,
        avatarUrl: cm.user.avatarUrl,
      })),
      dueDate: c.dueDate ? c.dueDate.toISOString() : null,
      isCompleted: c.isCompleted,
      status,
    };
  });

  const totalCompleted = cards.filter((c) => c.isCompleted).length;
  const totalOverdue = cards.filter((c) => c.status === "overdue").length;

  return {
    members: memberStats,
    cards,
    boards,
    totalCards: cards.length,
    totalCompleted,
    totalOverdue,
  };
}
