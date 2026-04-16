"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { JobItem } from "@/lib/types";

/**
 * Subscribe to live updates on job_items for a single job. Returns the channel
 * so the caller can `channel.unsubscribe()` on unmount. RLS still applies on
 * the wire — only rows in the caller's org will be delivered.
 */
export function subscribeToJobItems(
  jobId: string,
  onChange: (item: JobItem) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`job_items:${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "job_items",
        filter: `job_id=eq.${jobId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as JobItem | null;
        if (row) onChange(row);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to live updates on all jobs in the caller's org. Useful for the
 * owner dashboard where we want status changes to reflect immediately.
 */
export function subscribeToOrgJobs(
  orgId: string,
  onChange: () => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`jobs:${orgId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jobs",
        filter: `org_id=eq.${orgId}`,
      },
      () => onChange()
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "job_items",
        filter: `org_id=eq.${orgId}`,
      },
      () => onChange()
    )
    .subscribe();

  return channel;
}
