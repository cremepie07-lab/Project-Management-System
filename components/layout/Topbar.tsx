"use client";

import { Menu, Search, Bell } from "lucide-react";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserDropdown from "@/components/dashboard/UserDropdown";

interface TopbarProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleSidebar: () => void;
}

export default function Topbar({
  name, email, avatarUrl,
  search, onSearchChange,
  onToggleSidebar,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border-default bg-bg-header/80 px-4 backdrop-blur-md">
      <button
        onClick={onToggleSidebar}
        className="cursor-pointer rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Image src="/logo.svg" alt="WorkFlow" width={24} height={24} className="h-6 w-auto object-contain" />

      <div className="mx-4 flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tim kiem board..."
            className="w-full rounded-lg border border-border-default bg-bg-surface py-1.5 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 cursor-text"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          className="relative cursor-pointer rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          aria-label="Thong bao"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>

        <ThemeToggle size="sm" />

        <UserDropdown name={name} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
