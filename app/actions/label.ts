"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { triggerUserNotification } from "@/lib/pusher-server";

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
              title: true,
              board: {
                select: {
                  id: true,
                  title: true,
                  workspace: { select: { name: true } },
                },
              },
            },
          },
        },
      });
      if (card) {
        const notification = await prisma.notification.create({
          data: {
            userId,
            type: "self_assigned",
            message: `${session.name} đã gán thẻ "${card.title}" cho bạn.`,
            cardId,
            cardTitle: card.title,
            boardId: card.list.board.id,
            workspaceName: card.list.board.workspace.name,
            listName: card.list.title,
          },
        });
        await triggerUserNotification(userId, {
          id: notification.id,
          type: notification.type,
          message: notification.message,
          cardId: notification.cardId,
          cardTitle: notification.cardTitle,
          boardId: notification.boardId,
          workspaceName: notification.workspaceName,
          listName: notification.listName,
          isRead: notification.isRead,
          isDismissed: notification.isDismissed,
          linkUrl: notification.linkUrl,
          createdAt: notification.createdAt.toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  }

  return { action: "added" };
}