"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AttachmentData {
  id: string;
  type: string;
  url: string;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  displayText: string | null;
  createdBy: string;
  createdAt: string;
}

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * Upload a file as an attachment (stored as base64 data URI in DB).
 */
export async function uploadAttachmentFile(
  cardId: string,
  file: File
): Promise<{ error?: string; attachment?: AttachmentData }> {
  const session = await requireSession();

  if (!file || file.size === 0) {
    return { error: "Vui lòng chọn file" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File tối đa 10MB" };
  }

  const card = await prisma.card.findUnique({ where: { id: cardId }, select: { id: true } });
  if (!card) return { error: "Thẻ không tồn tại" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const attachment = await prisma.attachment.create({
    data: {
      cardId,
      type: "file",
      url: base64,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      createdBy: session.userId,
    },
  });

  revalidatePath("/board");
  return {
    attachment: {
      id: attachment.id,
      type: attachment.type,
      url: attachment.url,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      displayText: attachment.displayText,
      createdBy: attachment.createdBy,
      createdAt: attachment.createdAt.toISOString(),
    },
  };
}

/**
 * Attach a link to a card.
 */
export async function attachLink(
  cardId: string,
  url: string,
  displayText?: string
): Promise<{ error?: string; attachment?: AttachmentData }> {
  const session = await requireSession();

  const trimmed = url.trim();
  if (!trimmed) return { error: "URL không được để trống" };

  const card = await prisma.card.findUnique({ where: { id: cardId }, select: { id: true } });
  if (!card) return { error: "Thẻ không tồn tại" };

  const attachment = await prisma.attachment.create({
    data: {
      cardId,
      type: "link",
      url: trimmed,
      displayText: displayText?.trim() || null,
      createdBy: session.userId,
    },
  });

  revalidatePath("/board");
  return {
    attachment: {
      id: attachment.id,
      type: attachment.type,
      url: attachment.url,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      displayText: attachment.displayText,
      createdBy: attachment.createdBy,
      createdAt: attachment.createdAt.toISOString(),
    },
  };
}

/**
 * Get all attachments for a card.
 */
export async function getAttachments(cardId: string): Promise<AttachmentData[]> {
  await requireSession();

  const rows = await prisma.attachment.findMany({
    where: { cardId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((a) => ({
    id: a.id,
    type: a.type,
    url: a.url,
    fileName: a.fileName,
    fileSize: a.fileSize,
    fileType: a.fileType,
    displayText: a.displayText,
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
  }));
}

/**
 * Delete an attachment.
 */
export async function deleteAttachment(attachmentId: string) {
  const session = await requireSession();

  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.createdBy !== session.userId) {
    return { error: "UNAUTHORIZED" };
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidatePath("/board");
  return { success: true };
}
