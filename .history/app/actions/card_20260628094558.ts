"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

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

export async function updateCard(cardId: string, data: { title?: string; description?: string; color?: string }) {
  await requireSession();
  return prisma.card.update({ where: { id: cardId }, data });
}

export async function deleteCard(cardId: string) {
  await requireSession();
  await prisma.card.delete({ where: { id: cardId } });
}

export async function updateCardOrder(cardId: string, newListId: string, order: number) {
  await requireSession();
  await prisma.card.update({
    where: { id: cardId },
    data: { listId: newListId, order },
  });

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