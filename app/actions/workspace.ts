// app/actions/workspace.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

export async function createWorkspace(name: string) {
  const session = await requireSession();
  const slug = slugify(name);

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: session.userId, role: "OWNER" },
      },
    },
  });

  revalidatePath("/");
  return workspace;
}

export async function getWorkspaces() {
  const session = await requireSession();

  return prisma.workspace.findMany({
    where: { members: { some: { userId: session.userId } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkspaceBySlug(slug: string) {
  const session = await requireSession();

  return prisma.workspace.findFirst({
    where: { slug, members: { some: { userId: session.userId } } },
    include: { boards: true },
  });
}

export async function updateWorkspace(workspaceId: string, name: string) {
  const session = await requireSession();

  await assertRole(workspaceId, session.userId, ["OWNER", "ADMIN"]);

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name },
  });

  revalidatePath("/");
  return workspace;
}

export async function deleteWorkspace(workspaceId: string) {
  const session = await requireSession();

  await assertRole(workspaceId, session.userId, ["OWNER"]);

  await prisma.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/");
}

async function assertRole(workspaceId: string, userId: string, allowed: string[]) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member || !allowed.includes(member.role)) {
    throw new Error("FORBIDDEN");
  }
  return member;
}