"use client";

import { useRef, useState } from "react";
import { uploadAvatar } from "@/app/actions/upload-avatar";
import { Loader2 } from "lucide-react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
}

export default function UserAvatar({ avatarUrl, name }: UserAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [error, setError] = useState("");

  const initials = name?.slice(0, 1).toUpperCase() || "U";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("avatar", file);
    const result = await uploadAvatar(fd);

    setUploading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="relative">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        title="Đổi ảnh đại diện"
        className={`relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-purple-500 transition-all cursor-pointer ${uploading ? "opacity-70 pointer-events-none" : ""}`}
      >
        {preview ? (
          <img src={preview} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id="avatar-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Error tooltip */}
      {error && (
        <div className="absolute right-0 top-10 bg-red-500 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
}