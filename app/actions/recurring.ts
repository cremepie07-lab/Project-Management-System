"use server";

import { prisma } from "@/lib/prisma";
import { Recurring } from "@prisma/client";

function nextOccurrence(date: Date, recurring: Recurring): Date {
  const next = new Date(date);
  switch (recurring) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

function findNextDueDate(fromDueDate: Date, recurring: Recurring, now: Date): Date {
  let next = new Date(fromDueDate);
  while (next <= now) {
    next = nextOccurrence(next, recurring);
  }
  return next;
}

export async function processRecurringCards(userId: string) {
  const now = new Date();

  const overdueCards = await prisma.card.findMany({
    where: {
      recurring: { not: "NEVER" },
      dueDate: { not: null, lte: now },
      isCompleted: false,
      cardMembers: { some: { userId } },
    },
    select: {
      id: true,
      title: true,
      description: true,
      listId: true,
      color: true,
      startDate: true,
      dueDate: true,
      recurring: true,
      reminderOffset: true,
      order: true,
      cardLabels: { select: { labelId: true } },
      cardMembers: { select: { userId: true } },
      checklists: {
        select: {
          title: true,
          order: true,
          items: { select: { title: true, order: true } },
        },
      },
    },
  });

  for (const card of overdueCards) {
    if (!card.dueDate) continue;

    const newDueDate = findNextDueDate(card.dueDate, card.recurring, now);

    await prisma.$transaction(async (tx) => {
      const newCard = await tx.card.create({
        data: {
          title: card.title,
          description: card.description,
          color: card.color,
          startDate: card.startDate,
          dueDate: newDueDate,
          recurring: card.recurring,
          reminderOffset: card.reminderOffset,
          reminderSent: false,
          listId: card.listId,
          order: card.order,
        },
      });

      if (card.cardLabels.length > 0) {
        await tx.cardLabel.createMany({
          data: card.cardLabels.map((cl) => ({
            cardId: newCard.id,
            labelId: cl.labelId,
          })),
        });
      }

      if (card.cardMembers.length > 0) {
        await tx.cardMember.createMany({
          data: card.cardMembers.map((cm) => ({
            cardId: newCard.id,
            userId: cm.userId,
          })),
        });
      }

      for (const checklist of card.checklists) {
        const newChecklist = await tx.checklist.create({
          data: {
            title: checklist.title,
            order: checklist.order,
            cardId: newCard.id,
          },
        });

        if (checklist.items.length > 0) {
          await tx.checklistItem.createMany({
            data: checklist.items.map((item) => ({
              title: item.title,
              isDone: false,
              order: item.order,
              checklistId: newChecklist.id,
            })),
          });
        }
      }

      await tx.card.update({
        where: { id: card.id },
        data: {
          isCompleted: true,
          completedAt: now,
          recurring: "NEVER",
        },
      });

      await tx.activity.create({
        data: {
          type: "SYSTEM",
          message: `Thẻ đã được tự động lặp lại thành thẻ mới hạn ${newDueDate.toLocaleDateString("vi-VN")}`,
          cardId: card.id,
          userId,
        },
      });
    });
  }
}
