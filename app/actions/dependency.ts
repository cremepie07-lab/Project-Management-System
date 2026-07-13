// app/actions/dependency.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function addCardDependency(cardId: string, dependsOnId: string) {
  await requireSession();

  if (cardId === dependsOnId) {
    return { error: "Một thẻ không thể tự khóa chính nó." };
  }

  // Check if dependency already exists
  const existing = await prisma.cardDependency.findUnique({
    where: {
      cardId_dependsOnId: {
        cardId,
        dependsOnId,
      },
    },
  });

  if (existing) {
    return { error: "Mối liên kết này đã tồn tại." };
  }

  // Check for circular dependency: does dependsOnId depend on cardId?
  const isCircular = await checkCircularDependency(dependsOnId, cardId);
  if (isCircular) {
    return { error: "Không thể thêm liên kết này vì nó sẽ tạo ra vòng lặp vô hạn (Circular Dependency)." };
  }

  const dep = await prisma.cardDependency.create({
    data: {
      cardId,
      dependsOnId,
    },
    include: {
      dependsOn: {
        include: {
          list: true,
        },
      },
    },
  });

  revalidatePath("/");
  return { success: true, dependency: dep };
}

export async function removeCardDependency(cardId: string, dependsOnId: string) {
  await requireSession();

  await prisma.cardDependency.delete({
    where: {
      cardId_dependsOnId: {
        cardId,
        dependsOnId,
      },
    },
  });

  revalidatePath("/");
  return { success: true };
}

// Fetch all cards on the same board to be blocker candidates, excluding the current card
export async function getBlockerCandidates(boardId: string, currentCardId: string) {
  await requireSession();

  const cards = await prisma.card.findMany({
    where: {
      list: {
        boardId: boardId,
      },
      id: {
        not: currentCardId,
      },
    },
    include: {
      list: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  return cards;
}

// Helper to check circular dependencies using DFS
async function checkCircularDependency(startCardId: string, targetCardId: string): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [startCardId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetCardId) return true;

    if (!visited.has(current)) {
      visited.add(current);

      // Find all blockers this card depends on
      const deps = await prisma.cardDependency.findMany({
        where: { cardId: current },
        select: { dependsOnId: true },
      });

      for (const d of deps) {
        queue.push(d.dependsOnId);
      }
    }
  }

  return false;
}
