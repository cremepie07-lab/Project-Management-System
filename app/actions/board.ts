// app/actions/board.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function assertWorkspaceMember(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member) throw new Error("FORBIDDEN");
  return member;
}

export async function createBoard(workspaceId: string, title: string, imageUrl?: string) {
  const session = await requireSession();
  await assertWorkspaceMember(workspaceId, session.userId);

  const board = await prisma.board.create({
    data: { title, workspaceId, imageUrl },
  });

  revalidatePath(`/`);
  return board;
}

export async function getBoards(workspaceId: string) {
  const session = await requireSession();
  await assertWorkspaceMember(workspaceId, session.userId);

  return prisma.board.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBoardById(boardId: string) {
  const session = await requireSession();

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("NOT_FOUND");

  await assertWorkspaceMember(board.workspaceId, session.userId);
  return board;
}

export async function updateBoard(boardId: string, title: string) {
  const session = await requireSession();

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("NOT_FOUND");
  await assertWorkspaceMember(board.workspaceId, session.userId);

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { title },
  });

  revalidatePath(`/`);
  return updated;
}

async function assertWorkspaceOwner(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member || member.role !== "OWNER") throw new Error("FORBIDDEN");
  return member;
}

export async function deleteBoard(boardId: string) {
  const session = await requireSession();

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("NOT_FOUND");
  await assertWorkspaceOwner(board.workspaceId, session.userId);

  await prisma.board.delete({ where: { id: boardId } });
  revalidatePath(`/`);
}