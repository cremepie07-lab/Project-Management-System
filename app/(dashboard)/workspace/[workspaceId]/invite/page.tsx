import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InviteClient from "./InviteClient";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { workspaceId } = await params;

  // Check for a valid PENDING invitation
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
    include: {
      workspace: {
        include: {
          members: {
            where: { status: "ACCEPTED" },
            select: { id: true },
          },
        },
      },
    },
  });

  // If no pending invite, redirect away
  if (!membership || membership.status !== "PENDING") {
    redirect("/dashboard");
  }

  // Get inviter info if available
  let inviterName: string | null = null;
  if (membership.invitedBy) {
    const inviter = await prisma.user.findUnique({
      where: { id: membership.invitedBy },
      select: { name: true },
    });
    inviterName = inviter?.name ?? null;
  }

  const memberCount = membership.workspace.members.length;

  return (
    <InviteClient
      workspaceId={workspaceId}
      workspaceName={membership.workspace.name}
      inviterName={inviterName}
      memberCount={memberCount}
      userName={session.name}
    />
  );
}
