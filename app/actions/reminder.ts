"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDueDate } from "@/lib/due-date";

/**
 * Creates at most one due-date notification per card occurrence for the signed-in assignee.
 * `reminderSent` is claimed atomically to keep concurrent page loads from duplicating alerts.
 */
export async function checkAndCreateReminders(userId: string) {
  const session = await requireSession();
  if (session.userId !== userId) throw new Error("UNAUTHORIZED");

  const now = new Date();
  const cards = await prisma.card.findMany({
    where: {
      dueDate: { not: null },
      reminderOffset: { not: null },
      reminderSent: false,
      cardMembers: { some: { userId } },
    },
    select: {
      id: true, title: true, dueDate: true, reminderOffset: true,
      list: { select: { title: true, board: { select: { id: true, workspace: { select: { name: true } } } } } },
    },
  });

  let created = 0;
  for (const card of cards) {
    if (!card.dueDate || card.reminderOffset === null) continue;
    const reminderTime = card.dueDate.getTime() - card.reminderOffset * 60_000;
    if (reminderTime > now.getTime()) continue;

    const notified = await prisma.$transaction(async (tx) => {
      const didClaim = await tx.card.updateMany({
        where: { id: card.id, reminderSent: false },
        data: { reminderSent: true },
      });
      if (didClaim.count === 0) return false;

      await tx.notification.create({
        data: {
          userId,
          type: "due_date",
          message: `Card "${card.title}" sắp đến hạn vào ${formatDueDate(card.dueDate)}.`,
          cardId: card.id,
          cardTitle: card.title,
          boardId: card.list.board.id,
          workspaceName: card.list.board.workspace.name,
          listName: card.list.title,
        },
      });
      return true;
    });
    if (notified) created++;
  }
  return { created };
}
