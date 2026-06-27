"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function uploadAvatar(formData: FormData) {
  const session = await requireSession();

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Vui lòng chọn ảnh" };
  if (file.size > 2 * 1024 * 1024) return { error: "Ảnh tối đa 2MB" };
  if (!file.type.startsWith("image/")) return { error: "File phải là ảnh" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: base64 }, // ← field đúng với schema của bạn
  });

  revalidatePath("/", "layout");
  return { success: true };
}