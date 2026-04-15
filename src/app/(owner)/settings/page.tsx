"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Building2, Bell, Shield, CreditCard, ChevronRight } from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import Input from "@/components/Input";

const sections = [
  { label: "Company", icon: Building2 },
  { label: "Notifications", icon: Bell },
  { label: "Security", icon: Shield },
  { label: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
  const [active, setActive] = useState("Company");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "CleanPro Austin",
    ownerName: "Sarah Johnson",
    email: "sarah@cleanpro.com",
    phone: "+1 512 555 0192",
    city: "Austin",
    state: "TX",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved!");
    }, 900);
  }

  return (
    <>
      <OwnerTopbar title="Settings" />
      <div className="flex-1 px-4 lg:px-8 py-8 max-w-4xl w-full mx-auto">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Settings</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar nav */}
          <div className="lg:w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
              {sections.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActive(label)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left border-b border-[#F1F5F9] last:border-0
                    ${active === label ? "bg-[#F0F9FF] text-[#0EA5E9]" : "text-[#64748B] hover:bg-[#F8FAFC]"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} />
                    {label}
                  </span>
                  <ChevronRight size={14} className="opacity-50" />
                </button>
              ))}
            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1">
            {active === "Company" && (
              <form
                onSubmit={handleSave}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col gap-5"
              >
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-0.5">
                    Company Information
                  </h3>
                  <p className="text-sm text-[#94A3B8]">
                    Your public-facing business details.
                  </p>
                </div>

                <Input
                  label="Company name"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Owner name"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                  />
                  <Input
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" loading={loading}>
                    Save changes
                  </Button>
                </div>
              </form>
            )}

            {active === "Notifications" && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <h3 className="font-semibold text-[#0F172A] mb-0.5">
                  Notifications
                </h3>
                <p className="text-sm text-[#94A3B8] mb-6">
                  Choose when you receive alerts.
                </p>
                {[
                  "Inspection completed",
                  "Inspection failed (score &lt; 80%)",
                  "New cleaner joined",
                  "Weekly summary",
                ].map((item) => (
                  <label
                    key={item}
                    className="flex items-center justify-between py-3.5 border-b border-[#F1F5F9] last:border-0 cursor-pointer"
                  >
                    <span
                      className="text-sm text-[#0F172A]"
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-[#E2E8F0] peer-checked:bg-[#0EA5E9] rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#38BDF8]" />
                      <div className="absolute left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </div>
                  </label>
                ))}
              </div>
            )}

            {active === "Security" && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <h3 className="font-semibold text-[#0F172A] mb-0.5">Security</h3>
                <p className="text-sm text-[#94A3B8] mb-6">
                  Manage your account security.
                </p>
                <Button variant="ghost">Change password</Button>
              </div>
            )}

            {active === "Billing" && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <h3 className="font-semibold text-[#0F172A] mb-0.5">Billing</h3>
                <p className="text-sm text-[#94A3B8] mb-4">
                  Current plan: <strong>Starter</strong>
                </p>
                <div className="rounded-xl bg-gradient-to-r from-[#0EA5E9]/10 to-[#6366F1]/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0F172A] text-sm">
                      Upgrade to Pro
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Unlimited cleaners, advanced reports &amp; more.
                    </p>
                  </div>
                  <Button variant="primary" size="sm">
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
