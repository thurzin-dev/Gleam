// Cleaner layout — mobile-first, no sidebar. Clean full-screen experience.
export default function CleanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {children}
    </div>
  );
}
