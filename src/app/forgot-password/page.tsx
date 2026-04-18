"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const result = await requestPasswordReset({ email });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success("If that email exists, a reset link is on the way.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo size="lg" href="/" />
          <p className="mt-2 text-sm text-[#64748B]">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <h2 className="text-base font-semibold text-[#0F172A] mb-2">
                Check your inbox
              </h2>
              <p className="text-sm text-[#64748B]">
                If an account exists for{" "}
                <span className="font-medium text-[#0F172A]">{email}</span>,
                we just sent a link to reset your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <p className="text-sm text-[#64748B]">
                Enter the email tied to your account and we&apos;ll send you a
                reset link.
              </p>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
                />
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(undefined);
                  }}
                  error={error}
                  className="pl-10"
                />
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[#0EA5E9] font-medium hover:underline"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
