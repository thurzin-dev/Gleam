"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Mail, Link2, Copy, CheckCheck } from "lucide-react";
import Link from "next/link";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import Input from "@/components/Input";

const SAMPLE_INVITE_LINK = "https://app.gleamqc.com/join/org_demo_abc123";

export default function InviteCleanerPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Invite sent to ${email}`);
      setEmail("");
    }, 1000);
  }

  function handleCopy() {
    navigator.clipboard.writeText(SAMPLE_INVITE_LINK).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <OwnerTopbar title="Invite Cleaner" />
      <div className="flex-1 px-4 lg:px-8 py-8 max-w-2xl w-full mx-auto">
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Team
        </Link>

        <h2 className="text-2xl font-bold text-[#0F172A] mb-1">
          Invite a Cleaner
        </h2>
        <p className="text-sm text-[#64748B] mb-8">
          Send an email invite or share a link. The cleaner sets their own name
          and password when they accept.
        </p>

        {/* Email invite */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#F0F9FF] flex items-center justify-center">
              <Mail size={16} className="text-[#0EA5E9]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm">
                Send via Email
              </h3>
              <p className="text-xs text-[#94A3B8]">
                They&apos;ll receive a personalised invite link
              </p>
            </div>
          </div>

          <form onSubmit={handleSendInvite} className="flex gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="cleaner@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="primary" loading={loading}>
              Send
            </Button>
          </form>
        </div>

        {/* Link invite */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
              <Link2 size={16} className="text-[#6366F1]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm">
                Share Invite Link
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Anyone with this link can join your team
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#64748B] truncate font-mono">
              {SAMPLE_INVITE_LINK}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-all"
            >
              {copied ? (
                <>
                  <CheckCheck size={15} className="text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copy
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-[#94A3B8] mt-3">
            ⚠ Reset this link if you believe it was shared unintentionally.
          </p>
        </div>

        {/* Pending invites */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-[#0F172A] mb-3">
            Pending Invites
          </h4>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
            {["david@cleanpro.com"].map((inv) => (
              <div
                key={inv}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div>
                  <p className="text-sm text-[#0F172A]">{inv}</p>
                  <p className="text-xs text-[#94A3B8]">Sent Apr 12, 2026</p>
                </div>
                <button className="text-xs text-[#0EA5E9] hover:underline font-medium">
                  Resend
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
