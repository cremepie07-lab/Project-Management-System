"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { triggerBoardEvent } from "@/lib/pusher-server";
import { revalidatePath } from "next/cache";

function revalidateBoard(boardId: string) {
  revalidatePath(`/board/${boardId}`);
}

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
  const session = await requireSession();
  const last = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
  });
  const list = await prisma.list.create({
    data: { title, boardId, order: (last?.order ?? 0) + 1000 },
  });

  await triggerBoardEvent(boardId, "list:created", {
    list: { ...list, cards: [] },
    actorId: session.userId,
  });

  revalidateBoard(boardId);
  return list;
}

export async function updateListTitle(listId: string, title: string) {
  const session = await requireSession();
  const list = await prisma.list.update({ where: { id: listId }, data: { title } });

  await triggerBoardEvent(list.boardId, "list:updated", {
    listId,
    title,
    actorId: session.userId,
  });

  revalidateBoard(list.boardId);
  return list;
}

export async function deleteList(listId: string) {
  const session = await requireSession();
  const list = await prisma.list.findUnique({ where: { id: listId }, select: { boardId: true } });

  await prisma.list.delete({ where: { id: listId } });

  if (list) {
    revalidateBoard(list.boardId);
    await triggerBoardEvent(list.boardId, "list:deleted", {
      listId,
      actorId: session.userId,
    });
  }
}

export async function updateListOrder(listId: string, order: number) {
  const session = await requireSession();
  const list = await prisma.list.findUnique({ where: { id: listId }, select: { boardId: true } });

  await prisma.list.update({ where: { id: listId }, data: { order } });

  if (list) {
    revalidateBoard(list.boardId);
    await triggerBoardEvent(list.boardId, "list:moved", {
      listId,
      order,
      actorId: session.userId,
    });
  }
}

export async function rebalanceLists(boardId: string) {
  const session = await requireSession();
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

  await triggerBoardEvent(boardId, "list:reordered", {
    lists: lists.map((l, i) => ({ id: l.id, order: (i + 1) * 1000 })),
    actorId: session.userId,
  });

  revalidateBoard(boardId);
}
