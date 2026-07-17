"use client";

import { useState, useEffect } from "react";
import {
  Paperclip,
  ExternalLink,
  FileText,
  Image,
  File,
  LinkIcon,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import { getAttachments, deleteAttachment } from "@/app/actions/attachment";
import type { AttachmentData } from "@/app/actions/attachment";

interface AttachmentListInCardProps {
  cardId: string;
  onOpenAttach: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(fileType: string | null, fileName: string | null) {
  if (fileType?.startsWith("image/")) return <Image className="w-4 h-4 text-violet-400 shrink-0" />;
  if (fileType?.includes("pdf")) return <FileText className="w-4 h-4 text-red-400 shrink-0" />;
  if (fileType?.includes("word") || fileName?.endsWith(".doc") || fileName?.endsWith(".docx"))
    return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
  if (fileType?.includes("sheet") || fileName?.endsWith(".xls") || fileName?.endsWith(".xlsx"))
    return <FileText className="w-4 h-4 text-green-400 shrink-0" />;
  return <File className="w-4 h-4 text-text-muted shrink-0" />;
}

function getLinkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

export default function AttachmentListInCard({ cardId, onOpenAttach }: AttachmentListInCardProps) {
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getAttachments(cardId).then((a) => {
      setAttachments(a);
      setLoading(false);
    });
  }, [cardId]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteAttachment(id);
    if (result.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />
        <span className="text-xs text-text-muted">Đang tải đính kèm...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-xs text-text-muted font-medium">
            Đính kèm{attachments.length > 0 && ` (${attachments.length})`}
          </p>
        </div>
        <button
          onClick={onOpenAttach}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm
        </button>
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-bg-elevated border border-border-subtle hover:border-border-default transition-colors group"
            >
              {a.type === "file" ? (
                getFileIcon(a.fileType, a.fileName)
              ) : (
                <LinkIcon className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate">
                  {a.type === "file" ? (a.fileName ?? "File") : (a.displayText ?? getLinkDomain(a.url))}
                </p>
                <p className="text-[10px] text-text-muted">
                  {a.type === "file" && a.fileSize
                    ? formatBytes(a.fileSize)
                    : getLinkDomain(a.url)}
                  {" · "}
                  {timeAgo(a.createdAt)}
                </p>
              </div>
              {a.type === "link" && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-accent transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                className="text-text-muted hover:text-danger transition-colors shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-50"
              >
                {deletingId === a.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {attachments.length === 0 && (
        <button
          onClick={onOpenAttach}
          className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-border-default rounded-xl text-xs text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors cursor-pointer"
        >
          <Paperclip className="w-3.5 h-3.5" />
          Thêm đính kèm
        </button>
      )}
    </div>
  );
}
