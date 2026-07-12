import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BoardClient from "@/components/board/BoardClient";
import DeleteBoardButton from "@/components/board/DeleteBoardButton";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: {
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

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ background: `linear-gradient(135deg, #1e1b4b, #312e81)` }}
    >
      <header className="h-14 bg-black/30 backdrop-blur-sm flex items-center px-4 gap-3">
        <Link
          href="/dashboard"
          className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-lg">{board.title}</h1>
        {isOwner && <DeleteBoardButton boardId={board.id} />}
      </header>

      <BoardClient
        boardId={board.id}
        initialLists={board.lists as any}
        initialLabels={board.labels}
        workspaceMembers={workspaceMembers}
      />
    </div>
  );
}
