export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen bg-[#F8FAFC]">
        {children}
      </div>
    </div>
  );
}
