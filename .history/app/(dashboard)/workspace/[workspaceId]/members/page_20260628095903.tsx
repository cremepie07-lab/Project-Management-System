import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MembersClient from "@/components/workspace/MembersClient";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!workspace) redirect("/dashboard");

  const currentMember = workspace.members.find((m) => m.userId === session.userId);
  if (!currentMember) redirect("/dashboard");

  return (
    <MembersClient
      workspace={{ id: workspace.id, name: workspace.name }}
      members={workspace.members}
      currentUserId={session.userId}
      currentRole={currentMember.role}
    />
  );
}