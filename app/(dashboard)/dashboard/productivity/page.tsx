import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getProductivityData } from "@/app/actions/productivity";
import ProductivityClient from "@/components/dashboard/ProductivityClient";

export default async function ProductivityPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getProductivityData();

  return (
    <ProductivityClient
      userName={session.name}
      data={data}
    />
  );
}
