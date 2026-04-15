import OwnerSidebar from "@/components/OwnerSidebar";

// Shared layout for all owner-facing pages (dashboard, inspections, team, settings)
export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <OwnerSidebar />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
