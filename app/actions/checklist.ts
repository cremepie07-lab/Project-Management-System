"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { logSystemActivity } from "@/app/actions/activity";

export async function getChecklists(cardId: string) {
  await requireSession();
  return prisma.checklist.findMany({
    where: { cardId },
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
}

export async function createChecklist(cardId: string, title: string) {
  await requireSession();
  const last = await prisma.checklist.findFirst({
    where: { cardId },
    orderBy: { order: "desc" },
  });
  return prisma.checklist.create({
    data: { cardId, title, order: (last?.order ?? 0) + 1000 },
    include: { items: true },
  });
}

export async function renameChecklist(checklistId: string, title: string) {
  await requireSession();
  return prisma.checklist.update({ where: { id: checklistId }, data: { title } });
}

export async function deleteChecklist(checklistId: string) {
  await requireSession();
  await prisma.checklist.delete({ where: { id: checklistId } });
}

export async function createChecklistItem(checklistId: string, title: string) {
  await requireSession();
  const last = await prisma.checklistItem.findFirst({
    where: { checklistId },
    orderBy: { order: "desc" },
  });
  return prisma.checklistItem.create({
    data: { checklistId, title, order: (last?.order ?? 0) + 1000 },
  });
}

export async function toggleChecklistItem(itemId: string) {
  const session = await requireSession();
  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    include: { checklist: true },
  });
  if (!item) throw new Error("NOT_FOUND");

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { isDone: !item.isDone },
  });

  await logSystemActivity(
    item.checklist.cardId,
    session.userId,
    updated.isDone
      ? `đã hoàn thành mục checklist "${item.title}"`
      : `đã bỏ đánh dấu hoàn thành mục checklist "${item.title}"`
  );

  return updated;
}

export async function deleteChecklistItem(itemId: string) {
  await requireSession();
  await prisma.checklistItem.delete({ where: { id: itemId } });
}
