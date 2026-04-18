"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setAuthChecked(true);
    });
  }, []);

  function validate() {
    const next: Partial<typeof form> = {};
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (form.confirm !== form.password)
      next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      // Force a clean re-login with the new password.
      await supabase.auth.signOut();
      toast.success("Password updated. Please sign in.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-sm text-[#64748B]">Loading…</div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <Logo size="lg" href="/" />
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
            <h1 className="text-lg font-bold text-[#0F172A] mb-2">
              Reset link invalid or expired
            </h1>
            <p className="text-sm text-[#64748B] mb-6">
              Request a new reset link to continue.
            </p>
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={() => router.push("/forgot-password")}
            >
              Request a new link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo size="lg" href="/" />
          <p className="mt-2 text-sm text-[#64748B]">Choose a new password</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="New password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                error={errors.password}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[2.6rem] text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="Confirm password"
                name="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => {
                  setForm({ ...form, confirm: e.target.value });
                  if (errors.confirm) setErrors({ ...errors, confirm: "" });
                }}
                error={errors.confirm}
                className="pl-10"
              />
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
