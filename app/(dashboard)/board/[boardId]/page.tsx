import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BoardClient from "@/components/board/BoardClient";
import DeleteBoardButton from "@/components/board/DeleteBoardButton";

import { processRecurringCards } from "@/app/actions/recurring";
import { checkAndCreateReminders } from "@/app/actions/reminder";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Xử lý các thẻ lặp lại định kỳ (clone trước, rồi nhắc hẹn theo dueDate mới)
  await processRecurringCards(session.userId);
  await checkAndCreateReminders(session.userId);

  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: {
            where: { status: "ACCEPTED" },
            include: { user: true },
          },
        },
      },
      labels: true,
      lists: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
            include: {
              cardLabels: { include: { label: true } },
              cardMembers: { include: { user: true } },
              checklists: {
                orderBy: { order: "asc" },
                include: { items: { orderBy: { order: "asc" } } },
              },
              timeEntries: { select: { startedAt: true, endedAt: true } },
              _count: { select: { activities: true } },
              dependencies: {
                include: {
                  dependsOn: {
                    include: {
                      list: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!board) notFound();

  const workspaceMembers = board.workspace.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
  }));

  const currentMember = board.workspace.members.find((m) => m.userId === session.userId);
  const isOwner = currentMember?.role === "OWNER";

  const bgStyle = getBoardFullBg(board.imageUrl);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-cover bg-center transition-all duration-300 relative board-page"
      style={{ background: bgStyle }}
    >
      {/* Light mode overlay — softens the always-dark board gradient */}
      <div className="absolute inset-0 bg-white/65 dark:bg-transparent pointer-events-none transition-colors duration-300" />

      <header className="relative z-10 h-14 bg-white dark:bg-black/40 backdrop-blur-md flex items-center px-4 gap-3 border-b border-gray-200 dark:border-white/8 top-0 select-none shadow-sm transition-colors duration-200">
        <Link
          href="/dashboard"
          className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-150 cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <h1 className="text-gray-900 dark:text-white font-semibold text-sm flex-1 truncate">{board.title}</h1>
        {isOwner && <DeleteBoardButton boardId={board.id} />}
      </header>

      <div className="relative z-10 flex-1 min-h-0">
        <BoardClient
          boardId={board.id}
          initialLists={board.lists as any}
          initialLabels={board.labels}
          workspaceMembers={workspaceMembers}
          userId={session.userId}
        />
      </div>
    </div>
  );
}

function getBoardFullBg(color: string | null | undefined) {
  if (!color) return "linear-gradient(135deg, #1f1e29, #282736)";
  
  if (color.startsWith("#")) return color;

  const colorLower = color.toLowerCase();
  
  const gradients: Record<string, string> = {
    purple: "linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)",
    blue: "linear-gradient(135deg, #0f172a, #1e3a8a, #172554)",
    green: "linear-gradient(135deg, #064e3b, #065f46, #022c22)",
    red: "linear-gradient(135deg, #7f1d1d, #991b1b, #450a0a)",
    orange: "linear-gradient(135deg, #7c2d12, #9a3412, #431407)",
    yellow: "linear-gradient(135deg, #78350f, #92400e, #422006)",
    pink: "linear-gradient(135deg, #831843, #9d174d, #500724)",
    gray: "linear-gradient(135deg, #1e293b, #334155, #0f172a)",
  };

  return gradients[colorLower] || "linear-gradient(135deg, #1f1e29, #282736)";
}
