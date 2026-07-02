"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

/**
 * Thêm số giây vào tổng thời gian đã ghi nhận của card.
 * Dùng Prisma.Decimal để cộng dồn an toàn, không ghi đè.
 * Gọi sau mỗi lần Pause timer hoặc kết thúc phiên Pomodoro.
 */
export async function addTimeToCard(
  cardId: string,
  additionalSeconds: number
) {
  await requireSession();
  if (additionalSeconds <= 0) return;

  // increment an toàn — nếu cột null thì prisma tự xử lý như 0 + additionalSeconds
  await prisma.card.update({
    where: { id: cardId },
    data: {
      totalTimeSpent: {
        increment: additionalSeconds,
      },
    },
  });
}

/**
 * Bắt đầu một time entry mới cho card.
 * Trả về { id, startedAt } để client lưu vào state theo dõi.
 */
export async function startTimeEntry(cardId: string) {
  const session = await requireSession();
  const entry = await prisma.timeEntry.create({
    data: {
      cardId,
      userId: session.userId,
      startedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  return entry;
}

/**
 * Dừng time entry đang chạy:
 *  1. Ghi endedAt = now() vào TimeEntry
 *  2. Cộng dồn số giây vừa trôi qua vào card.totalTimeSpent
 * Trả về { entry, elapsedSeconds } để UI cập nhật tức thì.
 */
export async function stopTimeEntry(cardId: string, entryId: string) {
  await requireSession();

  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.endedAt) return null;

  const endedAt = new Date();
  const elapsedSeconds = Math.round(
    (endedAt.getTime() - new Date(entry.startedAt).getTime()) / 1000
  );

  const [updated] = await prisma.$transaction([
    prisma.timeEntry.update({
      where: { id: entryId },
      data: { endedAt },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.card.update({
      where: { id: cardId },
      data: { totalTimeSpent: { increment: elapsedSeconds } },
    }),
  ]);

  return { entry: updated, elapsedSeconds };
}

/**
 * Lưu phiên Pomodoro đã hoàn thành vào TimeEntry rồi cộng dồn vào card.
 * `startedAt` và `endedAt` do client gửi lên (đồng hồ bắt đầu → kết thúc).
 */
export async function savePomodoroSession(
  cardId: string,
  startedAt: Date,
  endedAt: Date
) {
  const session = await requireSession();

  const elapsedSeconds = Math.round(
    (endedAt.getTime() - startedAt.getTime()) / 1000
  );
  if (elapsedSeconds <= 0) return null;

  const [entry] = await prisma.$transaction([
    prisma.timeEntry.create({
      data: {
        cardId,
        userId: session.userId,
        startedAt,
        endedAt,
        note: "Phiên Pomodoro",
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.card.update({
      where: { id: cardId },
      data: { totalTimeSpent: { increment: elapsedSeconds } },
    }),
  ]);

  return entry;
}

/**
 * Lấy tổng thời gian đã ghi của card (giây).
 * Dùng để hiển thị trên UI khi mở tab Time.
 */
export async function getCardTotalTime(cardId: string): Promise<number> {
  await requireSession();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { totalTimeSpent: true },
  });
  return card?.totalTimeSpent ?? 0;
}

/**
 * Lấy danh sách time entries của card, mới nhất lên đầu.
 */
export async function getCardTimeEntries(cardId: string) {
  await requireSession();
  return prisma.timeEntry.findMany({
    where: { cardId },
    orderBy: { startedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

/**
 * Kiểm tra có time entry nào đang chạy (chưa có endedAt) không.
 */
export async function getRunningEntry(cardId: string) {
  await requireSession();
  return prisma.timeEntry.findFirst({
    where: { cardId, endedAt: null },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

/**
 * Xóa một time entry và trừ số giây tương ứng khỏi card.totalTimeSpent.
 */
export async function removeTimeEntry(cardId: string, entryId: string) {
  await requireSession();

  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;

  const seconds =
    entry.endedAt
      ? Math.round(
          (new Date(entry.endedAt).getTime() -
            new Date(entry.startedAt).getTime()) /
            1000
        )
      : 0;

  await prisma.$transaction([
    prisma.timeEntry.delete({ where: { id: entryId } }),
    ...(seconds > 0
      ? [
          prisma.card.update({
            where: { id: cardId },
            data: { totalTimeSpent: { decrement: seconds } },
          }),
        ]
      : []),
  ]);
}