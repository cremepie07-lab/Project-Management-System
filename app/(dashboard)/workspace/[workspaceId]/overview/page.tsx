import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOverview } from "@/app/actions/workspace-overview";
import OverviewClient from "@/components/workspace/OverviewClient";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  });

  if (!workspace) redirect("/dashboard");

  const currentMember = workspace.members.find(
    (m) => m.userId === session.userId && m.status === "ACCEPTED"
  );
  if (!currentMember) redirect("/dashboard");

  if (currentMember.role === "MEMBER") redirect("/dashboard");

  const data = await getWorkspaceOverview(workspaceId);

  return (
    <OverviewClient
      workspace={{ id: workspace.id, name: workspace.name }}
      initialData={data}
      currentRole={currentMember.role as "OWNER" | "ADMIN"}
    />
  );
}
