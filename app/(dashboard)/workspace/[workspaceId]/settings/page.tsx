
// ── app/(dashboard)/workspace/[workspaceId]/settings/page.tsx ──
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/workspace/SettingsClient";

export default async function SettingsPage({
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

  const currentMember = workspace.members.find((m) => m.userId === session.userId);
  if (!currentMember) redirect("/dashboard");

  return (
    <SettingsClient
      workspace={{ id: workspace.id, name: workspace.name }}
      currentRole={currentMember.role as "OWNER" | "ADMIN" | "MEMBER"}
    />
  );
}