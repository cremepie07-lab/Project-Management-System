"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "self_assigned"
  | "mention"
  | "due_date"
  | "comment"
  | "invite"
  | "system";

export interface ActiveNotification {
  id: string;
  type: NotificationType;
  message: string;
  cardId: string | null;
  cardTitle: string | null;
  boardId: string | null;
  workspaceName: string | null;
  listName: string | null;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string; // ISO string (serializable for Client Components)
}

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * Fetch all non-dismissed notifications for the current user, newest first.
 */
export async function getActiveNotifications(): Promise<ActiveNotification[]> {
  const session = await requireSession();

  const rows = await prisma.notification.findMany({
    where: {
      userId: session.userId,
      isDismissed: false,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return rows.map((n) => ({
    id: n.id,
    type: n.type as NotificationType,
    message: n.message,
    cardId: n.cardId,
    cardTitle: n.cardTitle,
    boardId: n.boardId,
    workspaceName: n.workspaceName,
    listName: n.listName,
    isRead: n.isRead,
    linkUrl: n.linkUrl,
    createdAt: n.createdAt.toISOString(),
  }));
}

/**
 * Mark a notification as dismissed (hides from the Sắp tới feed).
 * Also marks it as read.
 */
export async function dismissNotification(notificationId: string) {
  const session = await requireSession();

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.userId) {
    return { error: "UNAUTHORIZED" };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isDismissed: true, isRead: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Reply to a notification by creating a COMMENT Activity on the linked Card.
 * Returns the new activity so the UI can optimistically update.
 */
export async function replyToNotification(notificationId: string, content: string) {
  const session = await requireSession();

  if (!content.trim()) return { error: "Nội dung không được để trống" };

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.userId) {
    return { error: "UNAUTHORIZED" };
  }

  if (!notification.cardId) {
    return { error: "Thông báo này không liên kết với thẻ nào" };
  }

  const activity = await prisma.activity.create({
    data: {
      type: "COMMENT",
      message: content.trim(),
      cardId: notification.cardId,
      userId: session.userId,
    },
  });

  // Mark notification as read after replying
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
  return { success: true, activityId: activity.id };
}

// ── Legacy actions (kept for backward compatibility with NotificationCenter) ──

export async function getNotifications() {
  const session = await requireSession();
  return prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markAsRead(notificationId: string) {
  const session = await requireSession();

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.userId) {
    throw new Error("UNAUTHORIZED");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/");
  return { success: true };
}

export async function markAllAsRead() {
  const session = await requireSession();

  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/");
  return { success: true };
}
