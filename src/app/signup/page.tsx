"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, Building2 } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { signUpOwner } from "@/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    name: "",
    email: "",
    password: "",
  });
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
    if (!form.company.trim()) next.company = "Company name is required.";
    if (!form.name.trim()) next.name = "Your name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      next.email = "Enter a valid email address.";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signUpOwner({
        email: form.email,
        password: form.password,
        fullName: form.name,
        company: form.company,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Check your inbox to verify your email.");
      router.push(result.redirectTo ?? `/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" href="/" />
          <p className="mt-2 text-sm text-[#64748B]">
            Start your 14-day free trial — no credit card required
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
              <Building2
                size={16}
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="Company name"
                name="company"
                type="text"
                placeholder="CleanPro Austin"
                value={form.company}
                onChange={handleChange}
                error={errors.company}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="Your name"
                name="name"
                type="text"
                placeholder="Sarah Johnson"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="Work email"
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
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
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

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Start Free Trial
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#0EA5E9] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
