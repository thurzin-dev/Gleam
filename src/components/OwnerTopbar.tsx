"use client";

import { Bell, Search, Menu } from "lucide-react";
import Logo from "./Logo";
import { org } from "@/lib/sampleData";

interface OwnerTopbarProps {
  title?: string;
  subtitle?: string;
}

export default function OwnerTopbar({ title, subtitle }: OwnerTopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white border-b border-[#E2E8F0]">
      <div className="flex items-center gap-3 lg:hidden">
        <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
          <Menu size={20} />
        </button>
        <Logo size="sm" href="/dashboard" />
      </div>

      {title && (
        <div className="hidden lg:flex flex-col">
          <h1 className="text-lg font-semibold text-[#0F172A]">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[#64748B]">{subtitle}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        <button className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] transition-colors hidden sm:inline-flex">
          <Search size={18} />
        </button>
        <button className="relative p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0EA5E9] rounded-full" />
        </button>
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
          <div className="text-right">
            <p className="text-xs font-semibold text-[#0F172A] leading-tight">
              {org.name}
            </p>
            <p className="text-[11px] text-[#64748B] leading-tight">
              {org.owner}
            </p>
          </div>
          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
            {org.avatar}
          </button>
        </div>
        <button className="md:hidden w-9 h-9 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
          {org.avatar}
        </button>
      </div>
    </header>
  );
}
