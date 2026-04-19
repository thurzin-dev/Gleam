import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type IncomingItem = { label?: unknown };
type IncomingRoom = { name?: unknown; items?: unknown };
type IncomingBody = { rooms?: unknown };

function parseRooms(body: IncomingBody): { name: string; items: { label: string }[] }[] | null {
  if (!body || typeof body !== "object") return null;
  if (!Array.isArray(body.rooms)) return null;

  const rooms: { name: string; items: { label: string }[] }[] = [];

  for (const raw of body.rooms as IncomingRoom[]) {
    if (!raw || typeof raw !== "object") return null;
    if (typeof raw.name !== "string" || !raw.name.trim()) return null;
    if (!Array.isArray(raw.items)) return null;

    const items: { label: string }[] = [];
    for (const rawItem of raw.items as IncomingItem[]) {
      if (!rawItem || typeof rawItem !== "object") return null;
      if (typeof rawItem.label !== "string" || !rawItem.label.trim()) return null;
      items.push({ label: rawItem.label.trim() });
    }

    rooms.push({ name: raw.name.trim(), items });
  }

  return rooms;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "owner") {
    return NextResponse.json(
      { error: "Only owners can modify job checklists" },
      { status: 403 }
    );
  }

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rooms = parseRooms(body);
  if (!rooms) {
    return NextResponse.json(
      { error: "Body must be { rooms: [{ name, items: [{ label }] }] }" },
      { status: 400 }
    );
  }

  // Confirm the job is in this org before mutating any items.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, org_id")
    .eq("id", jobId)
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json({ error: "Failed to load job" }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const rows = rooms.flatMap((room) =>
    room.items.map((item) => ({
      org_id: profile.org_id,
      job_id: jobId,
      label: `${room.name} — ${item.label}`,
      checked: false,
      photo_url: null,
    }))
  );

  // Replace the existing per-job checklist in one transaction-ish flow:
  // delete then insert. Both queries are scoped to the caller's org_id so RLS
  // cannot be bypassed even if the job_id were spoofed.
  const { error: deleteError } = await supabase
    .from("job_items")
    .delete()
    .eq("job_id", jobId)
    .eq("org_id", profile.org_id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to clear existing checklist" },
      { status: 500 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ data: { inserted: 0 } });
  }

  const { error: insertError } = await supabase.from("job_items").insert(rows);
  if (insertError) {
    return NextResponse.json(
      { error: "Failed to insert checklist items" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { inserted: rows.length } });
}
