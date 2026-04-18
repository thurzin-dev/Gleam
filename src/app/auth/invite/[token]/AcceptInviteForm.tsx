"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { acceptInvite } from "@/actions/invites";

interface Props {
  token: string;
  orgName: string;
  presetEmail: string | null;
}

export default function AcceptInviteForm({ token, orgName, presetEmail }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: presetEmail ?? "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate(): boolean {
    const next: Partial<typeof form> = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      next.email = "Enter a valid email address.";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.set("full_name", form.name);
    fd.set("email", form.email);
    fd.set("password", form.password);

    startTransition(async () => {
      const result = await acceptInvite(token, fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Welcome to ${orgName}!`);
      router.push("/login");
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#0F172A] mb-1">
        Create your account
      </h2>
      <p className="text-sm text-[#64748B] mb-6">
        Set your name, email and a password to get started.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            className="pl-10"
            disabled={!!presetEmail}
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
            error={errors.password}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3.5 top-[2.6rem] text-[#94A3B8] hover:text-[#0F172A] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant="primary"
          loading={pending}
          className="mt-1"
        >
          Join {orgName}
        </Button>
      </form>
    </div>
  );
}
