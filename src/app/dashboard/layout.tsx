import OwnerSidebar from "@/components/OwnerSidebar";

export default function DashboardLayout({
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
