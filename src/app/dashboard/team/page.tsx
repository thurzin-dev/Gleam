"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  MoreHorizontal,
} from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { cleaners } from "@/lib/sampleData";

const ORG_SLUG = "cleanpro-austin";
const INVITE_LINK =
  typeof window !== "undefined"
    ? `${window.location.origin}/join/${ORG_SLUG}`
    : `/join/${ORG_SLUG}`;

export default function TeamPage() {
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  function copyInvite() {
    navigator.clipboard.writeText(INVITE_LINK).then(
      () => {
        setCopied(true);
        toast.success("Invite link copied!");
        setTimeout(() => setCopied(false), 2200);
      },
      () => toast.error("Couldn't copy to clipboard.")
    );
  }

  return (
    <>
      <OwnerTopbar title="Team" subtitle="Your cleaners" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Team</h2>
              <p className="text-sm text-[#64748B] mt-1">
                {cleaners.filter((c) => c.status === "active").length} active ·{" "}
                {cleaners.filter((c) => c.status === "invited").length} invited
              </p>
            </div>
            <Button onClick={() => setShowInvite((s) => !s)}>
              <UserPlus size={16} />
              Invite Cleaner
            </Button>
          </div>

          {showInvite && (
            <div className="bg-gradient-to-r from-[#38BDF8]/10 to-[#6366F1]/10 border border-[#E0F2FE] rounded-2xl p-5 mb-6">
              <p className="text-sm font-semibold text-[#0F172A] mb-1">
                Share this invite link
              </p>
              <p className="text-xs text-[#64748B] mb-3">
                Anyone with this link can join your company as a cleaner.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={INVITE_LINK}
                  className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F172A]"
                />
                <Button variant="primary" onClick={copyInvite}>
                  {copied ? (
                    <>
                      <Check size={15} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <ul className="divide-y divide-[#F1F5F9]">
              {cleaners.map((cleaner) => (
                <li
                  key={cleaner.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {cleaner.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {cleaner.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <Mail size={12} />
                      <span className="truncate">{cleaner.email}</span>
                    </div>
                  </div>
                  <Badge
                    variant={cleaner.status === "active" ? "success" : "warning"}
                    dot
                  >
                    {cleaner.status === "active" ? "Active" : "Invited"}
                  </Badge>
                  <button
                    className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
                    aria-label="More actions"
                    onClick={() => toast("Actions menu (demo).")}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
