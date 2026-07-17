"use client";

import { useState, useEffect } from "react";
import {
  X,
  Paperclip,
  LinkIcon,
  ExternalLink,
  FileText,
  Image,
  File,
  Trash2,
  Loader2,
} from "lucide-react";
import { uploadAttachmentFile, attachLink, getAttachments, deleteAttachment } from "@/app/actions/attachment";
import type { AttachmentData } from "@/app/actions/attachment";
import FileDropzone from "./FileDropzone";

interface AttachModalProps {
  cardId: string;
  onClose: () => void;
  onAttachmentsChange?: (attachments: AttachmentData[]) => void;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(fileType: string | null, fileName: string | null) {
  if (fileType?.startsWith("image/")) return <Image className="w-4 h-4 text-violet-400" />;
  if (fileType?.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  if (fileType?.includes("word") || fileName?.endsWith(".doc") || fileName?.endsWith(".docx"))
    return <FileText className="w-4 h-4 text-blue-400" />;
  if (fileType?.includes("sheet") || fileName?.endsWith(".xls") || fileName?.endsWith(".xlsx"))
    return <FileText className="w-4 h-4 text-green-400" />;
  return <File className="w-4 h-4 text-text-muted" />;
}

function getLinkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function AttachModal({ cardId, onClose, onAttachmentsChange }: AttachModalProps) {
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [inserting, setInserting] = useState(false);
  const [insertError, setInsertError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getAttachments(cardId).then((a) => {
      setAttachments(a);
      setLoading(false);
    });
  }, [cardId]);

  function emitChange(updated: AttachmentData[]) {
    setAttachments(updated);
    onAttachmentsChange?.(updated);
  }

  async function handleFileUpload(file: File) {
    const result = await uploadAttachmentFile(cardId, file);
    if (result.error) throw new Error(result.error);
    if (result.attachment) {
      emitChange([result.attachment, ...attachments]);
    }
  }

  async function handleInsertLink() {
    const trimmed = linkUrl.trim();
    if (!isValidUrl(trimmed)) {
      setInsertError("Vui lòng nhập URL hợp lệ (https://...)");
      return;
    }
    setInserting(true);
    setInsertError("");
    const result = await attachLink(cardId, trimmed, displayText.trim() || undefined);
    setInserting(false);
    if (result.error) {
      setInsertError(result.error);
    } else if (result.attachment) {
      emitChange([result.attachment, ...attachments]);
      setLinkUrl("");
      setDisplayText("");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteAttachment(id);
    if (result.success) {
      emitChange(attachments.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <div className="fixed inset-0 bg-bg-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-md shadow-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-text-muted" />
            <h3 className="font-semibold text-sm text-text-primary">Đính kèm</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Section 1: File upload */}
          <div className="space-y-2">
            <p className="text-xs text-text-secondary">
              Bạn cũng có thể kéo thả file để tải lên
            </p>
            <FileDropzone onUpload={handleFileUpload} />
          </div>

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* Section 2: Link input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-primary">
              Tìm kiếm hoặc dán link <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => { setLinkUrl(e.target.value); setInsertError(""); }}
              placeholder="Dán link hoặc tìm link gần đây..."
              className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
              onKeyDown={(e) => { if (e.key === "Enter" && linkUrl.trim()) handleInsertLink(); }}
            />
            {insertError && (
              <p className="text-[11px] text-danger">{insertError}</p>
            )}
          </div>

          {/* Section 3: Display text */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-primary">
              Văn bản hiển thị <span className="text-text-muted font-normal">(tuỳ chọn)</span>
            </label>
            <input
              type="text"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
              placeholder="Văn bản hiển thị"
              className="w-full bg-bg-elevated border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
            />
            <p className="text-[11px] text-text-muted">Đặt tiêu đề hoặc mô tả cho link này</p>
          </div>
        </div>

        {/* Existing attachments list */}
        {attachments.length > 0 && (
          <div className="px-4 pb-3 space-y-1.5 max-h-40 overflow-y-auto border-t border-border-subtle pt-3">
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wide">Đã đính kèm</p>
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-bg-elevated border border-border-subtle group">
                {a.type === "file" ? (
                  getFileIcon(a.fileType, a.fileName)
                ) : (
                  <LinkIcon className="w-4 h-4 text-blue-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary truncate">
                    {a.type === "file" ? (a.fileName ?? "File") : (a.displayText ?? getLinkDomain(a.url))}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">
                    {a.type === "file" && a.fileSize ? formatBytes(a.fileSize) : a.url}
                  </p>
                </div>
                {a.type === "link" && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent transition-colors shrink-0">
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

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border-subtle shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleInsertLink}
            disabled={!linkUrl.trim() || inserting}
            className="px-4 py-2 text-xs font-medium bg-accent hover:bg-accent-hover text-accent-text rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {inserting && <Loader2 className="w-3 h-3 animate-spin" />}
            Chèn
          </button>
        </div>
      </div>
    </div>
  );
}
