"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileIcon, Loader2 } from "lucide-react";

interface FileDropzoneProps {
  onUpload: (file: File) => Promise<void>;
}

const MAX_SIZE = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FileDropzone({ onUpload }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE) {
        setError("File tối đa 10MB");
        return;
      }
      setError("");
      setFileName(file.name);
      setUploading(true);
      try {
        await onUpload(file);
      } catch {
        setError("Tải file lên thất bại");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        dragging
          ? "border-accent bg-accent/5"
          : "border-border-default hover:border-border-strong"
      }`}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <p className="text-xs text-text-muted">Đang tải {fileName}...</p>
        </div>
      ) : (
        <>
          <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
          <p className="text-xs text-text-secondary mb-2">
            Kéo thả file vào đây
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-border-default text-text-secondary hover:bg-bg-hover hover:border-border-strong transition-colors cursor-pointer"
          >
            <FileIcon className="w-3.5 h-3.5 inline mr-1.5" />
            Chọn file
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </>
      )}
      {error && (
        <p className="text-[11px] text-danger mt-2">{error}</p>
      )}
    </div>
  );
}
