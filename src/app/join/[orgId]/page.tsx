"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, User, Lock, Building2, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Input from "@/components/Input";

// Sample org data — no backend yet
const org = {
  name: "CleanPro Austin",
  ownerName: "Sarah Johnson",
  avatar: "CP",
};

type Step = "form" | "success";

export default function JoinPage() {
  const [step, setStep] = useState<Step>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error as user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const next: Partial<typeof form> = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (form.confirm !== form.password)
      next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate account creation — no backend yet
    setTimeout(() => {
      setLoading(false);
      toast.success("Account created! Welcome to the team.");
      setStep("success");
    }, 1400);
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>

          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
            You&apos;re in, {form.name.split(" ")[0]}!
          </h1>
          <p className="text-sm text-[#64748B] mb-8">
            Your account has been created. You can now log in and start your
            first inspection.
          </p>

          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => (window.location.href = "/cleaner/dashboard")}
          >
            Go to my dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Invite banner */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 mb-6 flex items-center gap-4">
          {/* Company avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {org.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Building2 size={14} className="text-[#94A3B8]" />
              <span className="text-xs text-[#94A3B8]">You&apos;re invited by</span>
            </div>
            <p className="font-semibold text-[#0F172A]">{org.name}</p>
            <p className="text-xs text-[#64748B] mt-0.5">
              Managed by {org.ownerName}
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">
            Create your account
          </h2>
          <p className="text-sm text-[#64748B] mb-6">
            Set your name and a password to get started.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="Your full name"
                name="name"
                type="text"
                placeholder="e.g. Maria Garcia"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                className="pl-10"
                required
              />
            </div>

            {/* Password */}
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
                hint={
                  !errors.password && form.password.length > 0
                    ? `${form.password.length} / 8+ characters`
                    : undefined
                }
                className="pl-10 pr-10"
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

            {/* Confirm password */}
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-[2.6rem] text-[#94A3B8]"
              />
              <Input
                label="Confirm password"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={handleChange}
                error={errors.confirm}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-[2.6rem] text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* CTA — large button for mobile (cleaner uses phone) */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              variant="primary"
              loading={loading}
              className="mt-1"
            >
              Join {org.name}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6 leading-relaxed">
          By joining, you agree to Gleam&apos;s{" "}
          <a href="#" className="underline hover:text-[#64748B]">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-[#64748B]">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
