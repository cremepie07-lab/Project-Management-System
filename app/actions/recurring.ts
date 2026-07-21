"use server";

import { prisma } from "@/lib/prisma";
import { Recurring } from "@prisma/client";

function nextOccurrence(date: Date, recurring: Recurring) {
  const next = new Date(date);
  switch (recurring) {
    case "DAILY": next.setDate(next.getDate() + 1); break;
    case "WEEKLY": next.setDate(next.getDate() + 7); break;
    case "MONTHLY": next.setMonth(next.getMonth() + 1); break;
    case "YEARLY": next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}

/** Advances overdue recurring due dates in-place; no cards are cloned. */
export async function processRecurringCards() {
  const now = new Date();
  const cards = await prisma.card.findMany({
    where: { dueDate: { lte: now }, recurring: { not: "NEVER" } },
    select: { id: true, dueDate: true, recurring: true },
  });

  for (const card of cards) {
    if (!card.dueDate) continue;
    let dueDate = new Date(card.dueDate);
    while (dueDate <= now) dueDate = nextOccurrence(dueDate, card.recurring);
    await prisma.card.update({
      where: { id: card.id },
      data: { dueDate, reminderSent: false },
    });
  }
}
