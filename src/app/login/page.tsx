"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Link from "next/link";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { signInWithPassword } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const next: Partial<typeof form> = {};
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (result.error) {
        toast.error(result.error);
        if (result.redirectTo) router.push(result.redirectTo);
        return;
      }
      toast.success("Welcome back!");
      router.push(result.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo size="lg" href="/" />
          <p className="mt-2 text-sm text-[#64748B]">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          <GoogleAuthButton />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#94A3B8] font-medium">or</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] mt-3"
              />
              <Input
                label="Email address"
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] mt-3"
              />
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 translate-y-1 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-[#E2E8F0] text-[#0EA5E9]"
                />
                <span className="text-[#64748B]">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-[#0EA5E9] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#0EA5E9] font-medium hover:underline">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
