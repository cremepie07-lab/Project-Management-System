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
    data: { title, listId, order: (last?.order ?? -1) + 1 },
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

export async function reorderCards(listId: string, orderedIds: string[]) {
  await requireSession();
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.card.update({ where: { id }, data: { order: index } })
    )
  );
}

export async function moveCard(cardId: string, newListId: string, newOrder: number) {
  await requireSession();
  return prisma.card.update({
    where: { id: cardId },
    data: { listId: newListId, order: newOrder },
  });
}