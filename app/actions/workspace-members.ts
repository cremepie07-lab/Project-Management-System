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

// Mời thành viên qua email (tạo PENDING — cần xác nhận)
export async function inviteMember(workspaceId: string, email: string) {
  const session = await requireSession();
  await assertAdminOrOwner(workspaceId, session.userId);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Không tìm thấy người dùng với email này" };

  // Không thể mời chính mình
  if (user.id === session.userId) return { error: "Bạn không thể mời chính mình" };

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing) {
    if (existing.status === "PENDING") {
      return { error: "Đã có lời mời đang chờ xác nhận từ người này" };
    }
    return { error: "Người dùng đã là thành viên" };
  }

  // Lấy tên workspace để hiển thị trong notification
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return { error: "Không tìm thấy Workspace" };

  // Tạo thành viên với trạng thái PENDING
  await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId,
      role: "MEMBER",
      status: "PENDING",
      invitedBy: session.userId,
      invitedAt: new Date(),
    },
  });

  // Gửi thông báo đến người được mời
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "invite",
      title: "Lời mời tham gia Workspace",
      message: `${session.name} đã mời bạn tham gia Workspace "${workspace.name}". Nhấn để xem và xác nhận.`,
      workspaceName: workspace.name,
      linkUrl: `/workspace/${workspaceId}/invite`,
    },
  });

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true, user };
}

// Chấp nhận lời mời vào workspace
export async function acceptInvitation(workspaceId: string) {
  const session = await requireSession();

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });
  if (!membership || membership.status !== "PENDING") {
    return { error: "Không tìm thấy lời mời" };
  }

  await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
    data: { status: "ACCEPTED" },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}

// Từ chối lời mời vào workspace
export async function declineInvitation(workspaceId: string) {
  const session = await requireSession();

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });
  if (!membership || membership.status !== "PENDING") {
    return { error: "Không tìm thấy lời mời" };
  }

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// Thu hồi lời mời (Owner/Admin thu hồi)
export async function revokeInvitation(workspaceId: string, targetUserId: string) {
  const session = await requireSession();
  await assertAdminOrOwner(workspaceId, session.userId);

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
  if (!membership || membership.status !== "PENDING") {
    return { error: "Không tìm thấy lời mời đang chờ" };
  }

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}

// Lấy danh sách thành viên đã xác nhận + pending (dùng trong settings/members page)
export async function getWorkspaceMembersWithPending(workspaceId: string) {
  await requireSession();
  const all = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return {
    accepted: all.filter((m) => m.status === "ACCEPTED"),
    pending: all.filter((m) => m.status === "PENDING"),
  };
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

// Rời khỏi workspace
export async function leaveWorkspace(workspaceId: string) {
  const session = await requireSession();

  // Lấy vai trò hiện tại
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } }
  });
  if (!member) return { error: "Bạn không phải thành viên của workspace này" };

  if (member.role === "OWNER") {
    // Đếm số thành viên
    const count = await prisma.workspaceMember.count({ where: { workspaceId } });
    if (count > 1) {
      return { error: "Chủ sở hữu không thể rời workspace khi còn thành viên khác. Hãy chuyển quyền trước." };
    } else {
      return { error: "Không thể rời workspace khi bạn là thành viên duy nhất. Vui lòng chọn Xóa Workspace." };
    }
  }

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}

// Chuyển quyền sở hữu (OWNER)
export async function transferWorkspaceOwnership(workspaceId: string, targetUserId: string) {
  const session = await requireSession();
  await assertOwner(workspaceId, session.userId);

  if (targetUserId === session.userId) return { error: "Bạn đã là chủ sở hữu rồi" };

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } }
  });
  if (!targetMember) return { error: "Người nhận quyền không phải là thành viên" };

  // Thực hiện đổi quyền trong transaction
  await prisma.$transaction([
    prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      data: { role: "OWNER" }
    }),
    prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: session.userId, workspaceId } },
      data: { role: "ADMIN" } // Hạ cấp xuống ADMIN
    })
  ]);

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}