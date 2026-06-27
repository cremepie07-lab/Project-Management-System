import { getWorkspaceBySlug } from "@/app/actions/workspace";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login"); // ← không crash, redirect nhẹ nhàng

  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{workspace.name}</h1>
    </div>
  );
}