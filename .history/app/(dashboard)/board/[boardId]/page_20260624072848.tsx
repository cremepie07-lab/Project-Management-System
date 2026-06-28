import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoardClient from "@/components/board/BoardClient";

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
      lists: {
        orderBy: { order: "asc" },
        include: { cards: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!board) notFound();

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ background: `linear-gradient(135deg, #1e1b4b, #312e81)` }}
    >
      {/* Board Topbar */}
      <header className="h-14 bg-black/30 backdrop-blur-sm flex items-center px-4 gap-3">
        <h1 className="text-white font-bold text-lg">{board.title}</h1>
      </header>

      <BoardClient
        boardId={board.id}
        initialLists={board.lists as any}
      />
    </div>
  );
}