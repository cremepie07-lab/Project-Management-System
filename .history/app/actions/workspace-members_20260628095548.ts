"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function assertOwner(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member || member.role !== "OWNER") throw new Error("FORBIDDEN");
  return member;
}

async function assertAdminOrOwner(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) throw new Error("FORBIDDEN");
  return member;
}

// Lấy danh sách thành viên
export async function getWorkspaceMembers(workspaceId: string) {
  await requireSession();
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
}

// Mời thành viên qua email
export async function inviteMember(workspaceId: string, email: string) {
  const session = await requireSession();
  await assertAdminOrOwner(workspaceId, session.userId);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Không tìm thấy người dùng với email này" };

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing) return { error: "Người dùng đã là thành viên" };

  await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId, role: "MEMBER" },
  });

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true, user };
}

// Đổi quyền thành viên
export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  role: "ADMIN" | "MEMBER"
) {
  const session = await requireSession();
  await assertOwner(workspaceId, session.userId);

  if (targetUserId === session.userId) return { error: "Không thể đổi quyền của chính mình" };

  await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    data: { role },
  });

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}

// Xóa thành viên
export async function removeMember(workspaceId: string, targetUserId: string) {
  const session = await requireSession();
  await assertAdminOrOwner(workspaceId, session.userId);

  if (targetUserId === session.userId) return { error: "Không thể tự xóa mình" };

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}

// Đổi tên workspace
export async function renameWorkspace(workspaceId: string, name: string) {
  const session = await requireSession();
  await assertAdminOrOwner(workspaceId, session.userId);

  const ws = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name },
  });

  revalidatePath(`/workspace/${workspaceId}/settings`);
  return ws;
}

// Xóa workspace
export async function deleteWorkspaceById(workspaceId: string) {
  const session = await requireSession();
  await assertOwner(workspaceId, session.userId);

  await prisma.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/dashboard");
}