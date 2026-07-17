"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await requireSession();
  return prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50, // limit to last 50 notifications
  });
}

export async function markAsRead(notificationId: string) {
  const session = await requireSession();
  
  // Verify ownership before updating
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
