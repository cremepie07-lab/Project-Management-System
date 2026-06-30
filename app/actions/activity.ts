"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function getActivities(cardId: string) {
  await requireSession();
  return prisma.activity.findMany({
    where: { cardId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComment(cardId: string, message: string) {
  const session = await requireSession();
  return prisma.activity.create({
    data: { cardId, userId: session.userId, type: "COMMENT", message },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function deleteComment(activityId: string) {
  const session = await requireSession();
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw new Error("NOT_FOUND");
  if (activity.userId !== session.userId) throw new Error("FORBIDDEN");
  await prisma.activity.delete({ where: { id: activityId } });
}

// Dùng nội bộ bởi các action khác (card.ts, checklist.ts...) để tự động ghi lại thao tác.
// Vẫn cần requireSession ở action gọi nó, nên không lặp kiểm tra ở đây.
export async function logSystemActivity(cardId: string, userId: string, message: string) {
  return prisma.activity.create({
    data: { cardId, userId, type: "SYSTEM", message },
  });
}
