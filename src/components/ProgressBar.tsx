interface ProgressBarProps {
  value: number;
  className?: string;
  height?: "sm" | "md" | "lg";
  color?: "primary" | "success";
}

export default function ProgressBar({
  value,
  className = "",
  height = "sm",
  color = "primary",
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" };
  const colors = {
    primary: "bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9]",
    success: "bg-emerald-500",
  };

  return (
    <div
      className={`w-full bg-[#F1F5F9] rounded-full overflow-hidden ${heights[height]} ${className}`}
    >
      <div
        className={`${colors[color]} ${heights[height]} rounded-full transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
