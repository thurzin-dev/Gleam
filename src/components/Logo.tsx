import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

// Brand logo using Playfair Display as specified in CLAUDE.md
export default function Logo({ size = "md", href = "/" }: LogoProps) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const content = (
    <span
      className={`${sizes[size]} font-bold tracking-tight`}
      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
    >
      <span className="text-[#0EA5E9]">G</span>
      <span className="text-[#0F172A]">leam</span>
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
