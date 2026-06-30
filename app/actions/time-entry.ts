"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { logSystemActivity } from "@/app/actions/activity";

export async function getTimeEntries(cardId: string) {
  await requireSession();
  return prisma.timeEntry.findMany({
    where: { cardId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { startedAt: "desc" },
  });
}

export async function getRunningTimeEntry(cardId: string) {
  const session = await requireSession();
  return prisma.timeEntry.findFirst({
    where: { cardId, userId: session.userId, endedAt: null },
  });
}

export async function startTimer(cardId: string) {
  const session = await requireSession();

  // Tự dừng phiên đang chạy trước đó của chính người dùng này trên thẻ này (nếu có)
  await prisma.timeEntry.updateMany({
    where: { cardId, userId: session.userId, endedAt: null },
    data: { endedAt: new Date() },
  });

  return prisma.timeEntry.create({
    data: { cardId, userId: session.userId, startedAt: new Date() },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function stopTimer(cardId: string) {
  const session = await requireSession();
  const running = await prisma.timeEntry.findFirst({
    where: { cardId, userId: session.userId, endedAt: null },
  });
  if (!running) return null;

  const stopped = await prisma.timeEntry.update({
    where: { id: running.id },
    data: { endedAt: new Date() },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return stopped;
}

// Pomodoro hoàn thành một phiên tập trung -> ghi lại như một time entry đã có sẵn thời gian bắt đầu/kết thúc
export async function logPomodoroSession(cardId: string, startedAt: Date, endedAt: Date) {
  const session = await requireSession();
  const entry = await prisma.timeEntry.create({
    data: { cardId, userId: session.userId, startedAt, endedAt, note: "Phiên Pomodoro tập trung" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const minutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);
  await logSystemActivity(cardId, session.userId, `đã hoàn thành một phiên Pomodoro (${minutes} phút)`);

  return entry;
}

export async function deleteTimeEntry(entryId: string) {
  const session = await requireSession();
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("NOT_FOUND");
  if (entry.userId !== session.userId) throw new Error("FORBIDDEN");
  await prisma.timeEntry.delete({ where: { id: entryId } });
}
