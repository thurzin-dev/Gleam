"use client";

import { Bell, Search, Menu } from "lucide-react";
import Logo from "./Logo";

interface OwnerTopbarProps {
  title?: string;
}

export default function OwnerTopbar({ title }: OwnerTopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white border-b border-[#E2E8F0]">
      {/* Mobile: logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
          <Menu size={20} />
        </button>
        <Logo size="sm" href="/dashboard" />
      </div>

      {/* Desktop: page title */}
      {title && (
        <h1 className="hidden lg:block text-lg font-semibold text-[#0F172A]">
          {title}
        </h1>
      )}

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
          <Search size={18} />
        </button>
        <button className="relative p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0EA5E9] rounded-full" />
        </button>
        {/* Avatar */}
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
          S
        </button>
      </div>
    </header>
  );
}
