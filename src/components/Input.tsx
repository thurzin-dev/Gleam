import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

// Forwarded ref so this works with form libraries and focus management
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#0F172A]">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] bg-white transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent
            ${error ? "border-red-400 focus:ring-red-400" : "border-[#E2E8F0]"}
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-[#64748B] mt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
