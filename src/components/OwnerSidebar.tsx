"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { signOut } from "@/actions/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Jobs", href: "/dashboard/jobs", icon: ClipboardList },
  { label: "Team", href: "/dashboard/team", icon: Users },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleOpen = useCallback(() => setMobileOpen(true), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("toggle-mobile-nav", handleOpen);
    return () => window.removeEventListener("toggle-mobile-nav", handleOpen);
  }, [handleOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="px-2 mb-8 flex items-center justify-between">
        <Logo size="md" href="/dashboard" />
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  active
                    ? "bg-[#F0F9FF] text-[#0EA5E9]"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0EA5E9]/10 to-[#6366F1]/10 p-3">
          <Sparkles size={16} className="text-[#6366F1]" />
          <div>
            <p className="text-xs font-semibold text-[#0F172A]">Starter Plan</p>
            <p className="text-xs text-[#64748B]">3 / 5 cleaners used</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all duration-150 w-full"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-[#E2E8F0] px-4 py-6">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white px-4 py-6 flex flex-col transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
