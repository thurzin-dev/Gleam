import Link from "next/link";
import { Building2 } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import { getInvite } from "@/actions/invites";
import AcceptInviteForm from "./AcceptInviteForm";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getInvite(token);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <Logo size="lg" />
          <div className="mt-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
            <h1 className="text-lg font-bold text-[#0F172A] mb-2">
              Invite unavailable
            </h1>
            <p className="text-sm text-[#64748B] mb-6">{result.error}</p>
            <Link href="/login">
              <Button variant="ghost" fullWidth>
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invite = result.data;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initialsOf(invite.orgName)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Building2 size={14} className="text-[#94A3B8]" />
              <span className="text-xs text-[#94A3B8]">
                You&apos;re invited to join
              </span>
            </div>
            <p className="font-semibold text-[#0F172A]">{invite.orgName}</p>
          </div>
        </div>

        <AcceptInviteForm
          token={invite.token}
          orgName={invite.orgName}
          presetEmail={invite.email}
        />

        <p className="text-center text-xs text-[#94A3B8] mt-6 leading-relaxed">
          By joining, you agree to Gleam&apos;s Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </div>
  );
}
