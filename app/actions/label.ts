"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function getBoardLabels(boardId: string) {
  await requireSession();
  return prisma.label.findMany({ where: { boardId } });
}

export async function createLabel(boardId: string, name: string, color: string) {
  await requireSession();
  return prisma.label.create({ data: { boardId, name, color } });
}

export async function updateLabel(labelId: string, data: { name?: string; color?: string }) {
  await requireSession();
  return prisma.label.update({ where: { id: labelId }, data });
}

export async function deleteLabel(labelId: string) {
  await requireSession();
  await prisma.label.delete({ where: { id: labelId } });
}

export async function toggleCardLabel(cardId: string, labelId: string) {
  await requireSession();
  const existing = await prisma.cardLabel.findUnique({
    where: { cardId_labelId: { cardId, labelId } },
  });
  if (existing) {
    await prisma.cardLabel.delete({ where: { cardId_labelId: { cardId, labelId } } });
    return { action: "removed" };
  }
  await prisma.cardLabel.create({ data: { cardId, labelId } });
  return { action: "added" };
}

export async function toggleCardMember(cardId: string, userId: string) {
  const session = await requireSession();
  const existing = await prisma.cardMember.findUnique({
    where: { cardId_userId: { cardId, userId } },
  });
  if (existing) {
    await prisma.cardMember.delete({ where: { cardId_userId: { cardId, userId } } });
    return { action: "removed" };
  }
  await prisma.cardMember.create({ data: { cardId, userId } });

  // Create notification if assigning to someone else
  if (userId !== session.userId) {
    try {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        select: {
          title: true,
          list: {
            select: {
              boardId: true,
            },
          },
        },
      });
      if (card) {
        await prisma.notification.create({
          data: {
            userId,
            title: "Nhiệm vụ mới được giao",
            message: `${session.name} đã gán thẻ "${card.title}" cho bạn.`,
            linkUrl: `/board/${card.list.boardId}`,
          },
        });
      }
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  }

  return { action: "added" };
}