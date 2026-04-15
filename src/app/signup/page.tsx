"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, Building2 } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Trial started! Welcome to Gleam.");
      router.push("/dashboard");
    }, 1200);
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                className="pl-10"
                required
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
                className="pl-10"
                required
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
                className="pl-10"
                required
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
                className="pl-10 pr-10"
                minLength={8}
                required
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
