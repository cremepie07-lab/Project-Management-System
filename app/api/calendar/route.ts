import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const cards = await prisma.card.findMany({
    where: {
      dueDate: { not: null, gte: startDate, lte: endDate },
      list: {
        board: {
          workspace: {
            members: { some: { userId: session.userId } },
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      isCompleted: true,
      list: {
        select: {
          title: true,
          board: { select: { id: true, title: true } },
        },
      },
      cardLabels: {
        select: { label: { select: { name: true, color: true } } },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const serialized = cards.map((c) => ({
    ...c,
    dueDate: c.dueDate?.toISOString() ?? "",
  }));

  return NextResponse.json({ cards: serialized });
}
