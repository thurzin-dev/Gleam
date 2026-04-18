import OwnerTopbar from "@/components/OwnerTopbar";
import { getTeam } from "@/actions/team";
import TeamPageClient from "./TeamPageClient";

export default async function TeamPage() {
  const result = await getTeam();

  if (!result.success) {
    return (
      <>
        <OwnerTopbar title="Team" subtitle="Your cleaners" />
        <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">
          {result.error}
        </div>
      </>
    );
  }

  return (
    <>
      <OwnerTopbar title="Team" subtitle="Your cleaners" />
      <TeamPageClient
        cleaners={result.data.cleaners}
        pendingInvites={result.data.pendingInvites}
      />
    </>
  );
}
