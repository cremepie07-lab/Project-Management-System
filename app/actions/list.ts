"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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
    data: { title, boardId, order: (last?.order ?? -1) + 1 },
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

export async function reorderLists(boardId: string, orderedIds: string[]) {
  await requireSession();
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.list.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/");
}