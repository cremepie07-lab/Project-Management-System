// app/actions/recurring.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function processRecurringCards() {
  const now = new Date();

  // Find all cards that are due for recurrence
  const dueCards = await prisma.card.findMany({
    where: {
      isRecurring: true,
      nextRecurrence: {
        lte: now,
      },
    },
    include: {
      cardLabels: true,
      cardMembers: true,
      checklists: {
        include: {
          items: true,
        },
      },
    },
  });

  if (dueCards.length === 0) return;

  for (const card of dueCards) {
    if (!card.nextRecurrence) continue;

    // Calculate the next recurrence date
    const nextDate = new Date(card.nextRecurrence);
    while (nextDate <= now) {
      if (card.recurrenceInterval === "DAILY") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (card.recurrenceInterval === "WEEKLY") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (card.recurrenceInterval === "MONTHLY") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        break;
      }
    }

    // Get max order in the list to place the new card at the bottom
    const maxOrderCard = await prisma.card.findFirst({
      where: { listId: card.listId },
      orderBy: { order: "desc" },
    });
    const newOrder = maxOrderCard ? maxOrderCard.order + 1000 : 1000;

    // 1. Create the cloned card
    const clonedCard = await prisma.card.create({
      data: {
        title: card.title,
        description: card.description,
        order: newOrder,
        color: card.color,
        listId: card.listId,
      },
    });

    // 2. Clone Labels
    if (card.cardLabels.length > 0) {
      await prisma.cardLabel.createMany({
        data: card.cardLabels.map((cl) => ({
          cardId: clonedCard.id,
          labelId: cl.labelId,
        })),
      });
    }

    // 3. Clone Members
    if (card.cardMembers.length > 0) {
      await prisma.cardMember.createMany({
        data: card.cardMembers.map((cm) => ({
          cardId: clonedCard.id,
          userId: cm.userId,
        })),
      });
    }

    // 4. Clone Checklists and items
    for (const cl of card.checklists) {
      const clonedCl = await prisma.checklist.create({
        data: {
          title: cl.title,
          order: cl.order,
          cardId: clonedCard.id,
        },
      });

      if (cl.items.length > 0) {
        await prisma.checklistItem.createMany({
          data: cl.items.map((item) => ({
            title: item.title,
            isDone: false, // Reset done state for recurring tasks
            order: item.order,
            checklistId: clonedCl.id,
          })),
        });
      }
    }

    // 5. Update original card's next recurrence date
    await prisma.card.update({
      where: { id: card.id },
      data: {
        nextRecurrence: nextDate,
      },
    });

    // 6. Create activity entry indicating it was cloned
    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        message: `Thẻ đã được tự động lặp lại từ thẻ gốc "${card.title}"`,
        cardId: clonedCard.id,
        userId: card.cardMembers[0]?.userId ?? (await getAnyWorkspaceMemberId(card.listId)),
      },
    });
  }
}

// Helper to get any valid user ID in the workspace to assign to the SYSTEM activity log
async function getAnyWorkspaceMemberId(listId: string): Promise<string> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      board: {
        include: {
          workspace: {
            include: {
              members: { take: 1 },
            },
          },
        },
      },
    },
  });
  return list?.board.workspace.members[0]?.userId || "";
}
