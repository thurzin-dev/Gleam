"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MailCheck } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import { resendVerification } from "@/actions/auth";

function VerifyEmailInner() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await resendVerification({ email });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Verification email sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo size="lg" href="/" />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-sky-50 border-2 border-sky-200 flex items-center justify-center mx-auto mb-5">
            <MailCheck size={32} className="text-[#0EA5E9]" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">
            Check your inbox
          </h1>
          <p className="text-sm text-[#64748B] mb-6">
            {email ? (
              <>
                We sent a verification link to{" "}
                <span className="font-medium text-[#0F172A]">{email}</span>.
                Click it to activate your account.
              </>
            ) : (
              <>We sent you a verification link. Click it to activate your account.</>
            )}
          </p>

          <Button
            type="button"
            fullWidth
            variant="ghost"
            loading={loading}
            onClick={handleResend}
          >
            Resend verification email
          </Button>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Already verified?{" "}
          <Link href="/login" className="text-[#0EA5E9] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
