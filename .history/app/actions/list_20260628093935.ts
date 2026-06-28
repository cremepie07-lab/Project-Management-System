"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function getLists(boardId: string) {
  await requireSession();
  return prisma.list.findMany({
    where: { boardId },
    orderBy: { order: "asc" },
    include: {
      cards: { orderBy: { order: "asc" } },
    },
  });
}

export async function createList(boardId: string, title: string) {
  await requireSession();
  const last = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
  });
  return prisma.list.create({
    data: { title, boardId, order: (last?.order ?? 0) + 1000 },
  });
}

export async function updateListTitle(listId: string, title: string) {
  await requireSession();
  return prisma.list.update({ where: { id: listId }, data: { title } });
}

export async function deleteList(listId: string) {
  await requireSession();
  await prisma.list.delete({ where: { id: listId } });
}

export async function updateListOrder(listId: string, order: number) {
  await requireSession();
  await prisma.list.update({ where: { id: listId }, data: { order } });
}

export async function rebalanceLists(boardId: string) {
  await requireSession();
  const lists = await prisma.list.findMany({
    where: { boardId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  await Promise.all(
    lists.map((l, i) =>
      prisma.list.update({ where: { id: l.id }, data: { order: (i + 1) * 1000 } })
    )
  );
}