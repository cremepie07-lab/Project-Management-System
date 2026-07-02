"use server";

import { Prisma } from "@prisma/client";
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
  try {
    return await prisma.checklist.update({ where: { id: checklistId }, data: { title } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      // Checklist đã bị xóa (vd: do request khác / cascade từ card cha) -> bỏ qua
      return null;
    }
    throw error;
  }
}

export async function deleteChecklist(checklistId: string) {
  await requireSession();
  try {
    await prisma.checklist.delete({ where: { id: checklistId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      // Record đã bị xóa rồi (double click, hoặc cascade từ card cha bị xóa trước đó)
      // -> coi như đã xóa thành công, không throw lỗi ra UI
      return { success: true, alreadyDeleted: true };
    }
    throw error;
  }
  return { success: true };
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
  if (!item) {
    // Item đã bị xóa (vd: checklist cha vừa bị xóa) -> không có gì để toggle
    return null;
  }

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
  try {
    await prisma.checklistItem.delete({ where: { id: itemId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      // Item đã bị xóa rồi -> bỏ qua, không throw lỗi
      return { success: true, alreadyDeleted: true };
    }
    throw error;
  }
  return { success: true };
}