"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, ChevronDown } from "lucide-react";
import UserAvatar from "./UserAvatar";

interface UserDropdownProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export default function UserDropdown({ name, email, avatarUrl }: UserDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button — avatar + tên + chevron */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-800 transition-colors"
      >
        <UserAvatar name={name} avatarUrl={avatarUrl} />
        <span className="text-sm text-gray-300 hidden md:block">{name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform hidden md:block ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-56 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            {/* Đổi avatar — click vào đây mở file picker luôn */}
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
              onClick={() => {
                setOpen(false);
                // trigger click vào input file của UserAvatar bên ngoài
                document.getElementById("avatar-input")?.click();
              }}
            >
              <div className="w-4 h-4">
                {/* inline svg camera icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              Đổi ảnh đại diện
            </div>

            <div className="h-px bg-gray-800 my-1" />

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {loggingOut
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogOut className="w-4 h-4" />
              }
              {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}