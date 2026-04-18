"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { createInvite } from "@/actions/invites";
import { removeEmployee, revokeInvite, type TeamInvite, type TeamMember } from "@/actions/team";

interface Props {
  cleaners: TeamMember[];
  pendingInvites: TeamInvite[];
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function TeamPageClient({ cleaners, pendingInvites }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  function handleGenerateInvite() {
    startTransition(async () => {
      const result = await createInvite();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setInviteUrl(result.data.url);
      setShowInvite(true);
      toast.success("Invite link ready.");
      router.refresh();
    });
  }

  function copyInvite() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(
      () => {
        setCopied(true);
        toast.success("Invite link copied!");
        setTimeout(() => setCopied(false), 2200);
      },
      () => toast.error("Couldn't copy to clipboard.")
    );
  }

  function confirmRemove() {
    if (!removeTarget) return;
    const target = removeTarget;
    startTransition(async () => {
      const result = await removeEmployee(target.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${target.full_name} was removed.`);
      setRemoveTarget(null);
      router.refresh();
    });
  }

  function handleRevoke(token: string) {
    startTransition(async () => {
      const result = await revokeInvite(token);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Invite revoked.");
      router.refresh();
    });
  }

  return (
    <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Team</h2>
            <p className="text-sm text-[#64748B] mt-1">
              {cleaners.length} active · {pendingInvites.length} invited
            </p>
          </div>
          <Button onClick={handleGenerateInvite} loading={pending && !inviteUrl}>
            <UserPlus size={16} />
            Invite Cleaner
          </Button>
        </div>

        {showInvite && inviteUrl && (
          <div className="bg-gradient-to-r from-[#38BDF8]/10 to-[#6366F1]/10 border border-[#E0F2FE] rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-[#0F172A]">
                Share this invite link
              </p>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1 rounded-md hover:bg-white/50 text-[#64748B]"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-[#64748B] mb-3">
              Anyone with this link can join your company as a cleaner. Expires in 7 days.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
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
          {cleaners.length === 0 && pendingInvites.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#64748B]">
              No cleaners yet. Invite your first cleaner to get started.
            </div>
          ) : (
            <ul className="divide-y divide-[#F1F5F9]">
              {cleaners.map((cleaner) => (
                <li
                  key={cleaner.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initialsOf(cleaner.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {cleaner.full_name}
                    </p>
                    {cleaner.email && (
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <Mail size={12} />
                        <span className="truncate">{cleaner.email}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="success" dot>
                    Active
                  </Badge>
                  <button
                    className="p-2 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500"
                    aria-label={`Remove ${cleaner.full_name}`}
                    onClick={() => setRemoveTarget(cleaner)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {pendingInvites.map((invite) => (
                <li
                  key={invite.token}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] flex-shrink-0">
                    <Clock size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {invite.email ?? "Open invite link"}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="warning" dot>
                    Invited
                  </Badge>
                  <button
                    className="p-2 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500"
                    aria-label="Revoke invite"
                    onClick={() => handleRevoke(invite.token)}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setRemoveTarget(null)}
          />
          <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">
              Remove cleaner?
            </h3>
            <p className="text-sm text-[#64748B] mb-6">
              {removeTarget.full_name} will lose access to your organization.
              This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={pending} onClick={confirmRemove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
