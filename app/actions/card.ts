"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { logSystemActivity } from "@/app/actions/activity";
import { formatDueDate } from "@/lib/due-date";

export async function createCard(listId: string, title: string) {
  await requireSession();
  const last = await prisma.card.findFirst({
    where: { listId },
    orderBy: { order: "desc" },
  });
  return prisma.card.create({
    data: { title, listId, order: (last?.order ?? 0) + 1000 },
  });
}

export async function updateCard(
  cardId: string,
  data: {
    title?: string;
    description?: string;
    color?: string;
    dueDate?: Date | null;
    isRecurring?: boolean;
    recurrenceInterval?: string | null;
    nextRecurrence?: Date | null;
    isCompleted?: boolean;
    completedAt?: Date | null;
    completedBy?: string | null;
  }
) {
  const session = await requireSession();

  if (data.dueDate !== undefined) {
    const updated = await prisma.card.update({ where: { id: cardId }, data });
    await logSystemActivity(
      cardId,
      session.userId,
      data.dueDate
        ? `đã đặt hạn hoàn thành: ${formatDueDate(data.dueDate)}`
        : `đã xóa hạn hoàn thành`
    );
    return updated;
  }

  return prisma.card.update({ where: { id: cardId }, data });
}

export async function deleteCard(cardId: string) {
  await requireSession();
  await prisma.card.delete({ where: { id: cardId } });
}

export async function updateCardOrder(cardId: string, newListId: string, order: number) {
  const session = await requireSession();

  const current = await prisma.card.findUnique({ where: { id: cardId }, select: { listId: true } });
  const movedToNewList = !!current && current.listId !== newListId;

  await prisma.card.update({
    where: { id: cardId },
    data: { listId: newListId, order },
  });

  if (movedToNewList) {
    const targetList = await prisma.list.findUnique({ where: { id: newListId }, select: { title: true } });
    if (targetList) {
      await logSystemActivity(cardId, session.userId, `đã di chuyển thẻ tới danh sách "${targetList.title}"`);
    }
  }

  const siblings = await prisma.card.findMany({
    where: { listId: newListId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  const needsRebalance = siblings.some((c, i) =>
    i > 0 && c.order - siblings[i - 1].order < 0.001
  );

  if (needsRebalance) {
    await Promise.all(
      siblings.map((c, i) =>
        prisma.card.update({ where: { id: c.id }, data: { order: (i + 1) * 1000 } })
      )
    );
  }
}

export async function markCardComplete(cardId: string) {
  const session = await requireSession();

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: session.userId,
    },
  });

  await logSystemActivity(cardId, session.userId, "đã đánh dấu hoàn thành");

  return updated;
}

export async function undoCardComplete(cardId: string) {
  const session = await requireSession();

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      isCompleted: false,
      completedAt: null,
      completedBy: null,
    },
  });

  await logSystemActivity(cardId, session.userId, "đã hủy đánh dấu hoàn thành");

  return updated;
}