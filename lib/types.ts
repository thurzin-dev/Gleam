export type UserRole = "owner" | "cleaner";

export type JobStatus = "pending" | "in_progress" | "completed";

export type ChecklistItem = {
  id: string;
  label: string;
};

export type PropertyRoom = {
  name: string;
  items: ChecklistItem[];
};

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Property {
  id: string;
  org_id: string;
  name: string;
  address: string;
  checklist: PropertyRoom[];
  created_at: string;
}

export interface ChecklistTemplate {
  id: string;
  org_id: string;
  name: string;
  items: ChecklistItem[];
  created_at: string;
}

export interface Job {
  id: string;
  org_id: string;
  property_id: string;
  assigned_to: string | null;
  checklist_template_id: string | null;
  status: JobStatus;
  scheduled_date: string;
  created_at: string;
}

export interface JobItem {
  id: string;
  job_id: string;
  org_id: string;
  label: string;
  checked: boolean;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
