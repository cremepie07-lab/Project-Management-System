import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";

import { processRecurringCards } from "@/app/actions/recurring";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Xử lý các thẻ lặp lại định kỳ
  await processRecurringCards();

  // Lấy workspace + board thật từ DB
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { userId: session.userId, status: "ACCEPTED" } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      boards: { orderBy: { createdAt: "desc" } },
    },
  });

  // Lấy danh sách thẻ được giao cho người dùng hiện tại
  const cardMemberships = await prisma.cardMember.findMany({
    where: {
      userId: session.userId,
    },
    include: {
      card: {
        include: {
          list: {
            include: {
              board: {
                include: {
                  workspace: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      card: {
        updatedAt: "desc",
      },
    },
    take: 5,
  });

  const assignedCards = cardMemberships.map((m) => ({
    id: m.card.id,
    title: m.card.title,
    listName: m.card.list.title,
    boardName: m.card.list.board.title,
    workspaceName: m.card.list.board.workspace.name,
    updatedAt: m.card.updatedAt.toISOString(),
    actionText: "Bạn đã được phân công vào thẻ này",
    userAvatar: session.avatarUrl ?? null,
    userName: session.name,
  }));

  return (
    <DashboardClient
      name={session.name}
      email={session.email}
      avatarUrl={session.avatarUrl ?? null}
      assignedCards={assignedCards}
      initialWorkspaces={workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        color: "from-purple-600 to-blue-600", // TODO: thêm field color vào schema sau
        boards: ws.boards.map((b) => ({
          id: b.id,
          title: b.title,
          color: b.imageUrl ?? "from-purple-700 to-purple-900",
          starred: false,
        })),
      }))}
    />
  );
}