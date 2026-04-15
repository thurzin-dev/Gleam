// Hardcoded sample data — no backend wired yet.

export type JobStatus = "not_started" | "in_progress" | "completed";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  photoUrl?: string;
}

export interface Room {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface Property {
  id: string;
  clientName: string;
  address: string;
  rooms: Room[];
}

export interface Cleaner {
  id: string;
  name: string;
  email: string;
  status: "active" | "invited";
  initials: string;
}

export interface Job {
  id: string;
  date: string;
  time: string;
  propertyId: string;
  propertyAddress: string;
  clientName: string;
  cleanerId: string;
  cleanerName: string;
  status: JobStatus;
  rooms: Room[];
}

export const org = {
  name: "CleanPro Austin",
  owner: "Sarah Johnson",
  initials: "CP",
  avatar: "S",
};

export const cleaners: Cleaner[] = [
  {
    id: "c1",
    name: "Maria Garcia",
    email: "maria@cleanproaustin.com",
    status: "active",
    initials: "MG",
  },
  {
    id: "c2",
    name: "James Wilson",
    email: "james@cleanproaustin.com",
    status: "active",
    initials: "JW",
  },
  {
    id: "c3",
    name: "Priya Patel",
    email: "priya@cleanproaustin.com",
    status: "active",
    initials: "PP",
  },
  {
    id: "c4",
    name: "Liam Chen",
    email: "liam@cleanproaustin.com",
    status: "invited",
    initials: "LC",
  },
];

const bathroomItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}-1`, label: "Clean toilet, inside and out", done: false },
  { id: `${prefix}-2`, label: "Scrub shower and tub", done: false },
  { id: `${prefix}-3`, label: "Wipe mirrors and vanity", done: false },
  { id: `${prefix}-4`, label: "Mop floor", done: false },
  { id: `${prefix}-5`, label: "Empty trash and replace liner", done: false },
];

const kitchenItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}-1`, label: "Wipe countertops and backsplash", done: false },
  { id: `${prefix}-2`, label: "Clean stovetop and range hood", done: false },
  { id: `${prefix}-3`, label: "Clean inside of microwave", done: false },
  { id: `${prefix}-4`, label: "Wipe outside of all appliances", done: false },
  { id: `${prefix}-5`, label: "Sweep and mop floor", done: false },
  { id: `${prefix}-6`, label: "Empty trash and replace liner", done: false },
];

const bedroomItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}-1`, label: "Make bed, fresh linens if provided", done: false },
  { id: `${prefix}-2`, label: "Dust all surfaces and nightstands", done: false },
  { id: `${prefix}-3`, label: "Vacuum carpet and under bed", done: false },
  { id: `${prefix}-4`, label: "Clean mirrors", done: false },
];

const livingItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}-1`, label: "Dust shelves, TV and electronics", done: false },
  { id: `${prefix}-2`, label: "Vacuum couch and cushions", done: false },
  { id: `${prefix}-3`, label: "Vacuum or sweep floor", done: false },
  { id: `${prefix}-4`, label: "Wipe coffee table and side tables", done: false },
];

export const properties: Property[] = [
  {
    id: "p1",
    clientName: "Thompson Family",
    address: "1248 Maple Ridge Dr, Austin, TX 78704",
    rooms: [
      { id: "p1-r1", name: "Kitchen", items: kitchenItems("p1-r1") },
      { id: "p1-r2", name: "Master Bathroom", items: bathroomItems("p1-r2") },
      { id: "p1-r3", name: "Guest Bathroom", items: bathroomItems("p1-r3") },
      { id: "p1-r4", name: "Living Room", items: livingItems("p1-r4") },
      { id: "p1-r5", name: "Master Bedroom", items: bedroomItems("p1-r5") },
    ],
  },
  {
    id: "p2",
    clientName: "Nguyen Residence",
    address: "502 Barton Springs Rd, Austin, TX 78704",
    rooms: [
      { id: "p2-r1", name: "Kitchen", items: kitchenItems("p2-r1") },
      { id: "p2-r2", name: "Bathroom", items: bathroomItems("p2-r2") },
      { id: "p2-r3", name: "Living Room", items: livingItems("p2-r3") },
    ],
  },
  {
    id: "p3",
    clientName: "Rivera Rentals LLC",
    address: "88 Zilker Pkwy, Austin, TX 78746",
    rooms: [
      { id: "p3-r1", name: "Kitchen", items: kitchenItems("p3-r1") },
      { id: "p3-r2", name: "Bathroom", items: bathroomItems("p3-r2") },
      { id: "p3-r3", name: "Bedroom", items: bedroomItems("p3-r3") },
    ],
  },
  {
    id: "p4",
    clientName: "Elena Martinez",
    address: "3321 Oakwood Blvd, Round Rock, TX 78664",
    rooms: [
      { id: "p4-r1", name: "Kitchen", items: kitchenItems("p4-r1") },
      { id: "p4-r2", name: "Master Bathroom", items: bathroomItems("p4-r2") },
      { id: "p4-r3", name: "Living Room", items: livingItems("p4-r3") },
      { id: "p4-r4", name: "Bedroom", items: bedroomItems("p4-r4") },
    ],
  },
];

// Clone rooms and optionally pre-mark items as done so sample data feels alive.
function seedRooms(
  baseRooms: Room[],
  prefix: string,
  doneCount: number
): Room[] {
  let remaining = doneCount;
  let photoIdx = 0;
  return baseRooms.map((room) => ({
    ...room,
    id: `${prefix}-${room.id}`,
    items: room.items.map((item) => {
      const shouldMark = remaining > 0;
      if (shouldMark) remaining -= 1;
      // Alternate photos deterministically so SSR and hydration match.
      const withPhoto = shouldMark && photoIdx++ % 2 === 0;
      return {
        ...item,
        id: `${prefix}-${item.id}`,
        done: shouldMark,
        photoUrl: withPhoto ? "/placeholder-photo.svg" : undefined,
      };
    }),
  }));
}

export const jobs: Job[] = [
  {
    id: "j1",
    date: "2026-04-15",
    time: "08:30 AM",
    propertyId: "p1",
    propertyAddress: properties[0].address,
    clientName: properties[0].clientName,
    cleanerId: "c1",
    cleanerName: "Maria Garcia",
    status: "in_progress",
    rooms: seedRooms(properties[0].rooms, "j1", 9),
  },
  {
    id: "j2",
    date: "2026-04-15",
    time: "10:00 AM",
    propertyId: "p2",
    propertyAddress: properties[1].address,
    clientName: properties[1].clientName,
    cleanerId: "c2",
    cleanerName: "James Wilson",
    status: "completed",
    rooms: seedRooms(properties[1].rooms, "j2", 99),
  },
  {
    id: "j3",
    date: "2026-04-15",
    time: "01:00 PM",
    propertyId: "p3",
    propertyAddress: properties[2].address,
    clientName: properties[2].clientName,
    cleanerId: "c3",
    cleanerName: "Priya Patel",
    status: "not_started",
    rooms: seedRooms(properties[2].rooms, "j3", 0),
  },
  {
    id: "j4",
    date: "2026-04-15",
    time: "03:30 PM",
    propertyId: "p4",
    propertyAddress: properties[3].address,
    clientName: properties[3].clientName,
    cleanerId: "c1",
    cleanerName: "Maria Garcia",
    status: "not_started",
    rooms: seedRooms(properties[3].rooms, "j4", 0),
  },
  {
    id: "j5",
    date: "2026-04-16",
    time: "09:00 AM",
    propertyId: "p1",
    propertyAddress: properties[0].address,
    clientName: properties[0].clientName,
    cleanerId: "c2",
    cleanerName: "James Wilson",
    status: "not_started",
    rooms: seedRooms(properties[0].rooms, "j5", 0),
  },
];

export function countProgress(rooms: Room[]) {
  const total = rooms.reduce((acc, r) => acc + r.items.length, 0);
  const done = rooms.reduce(
    (acc, r) => acc + r.items.filter((i) => i.done).length,
    0
  );
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function statusLabel(status: JobStatus): string {
  if (status === "not_started") return "Not Started";
  if (status === "in_progress") return "In Progress";
  return "Completed";
}

export function statusVariant(
  status: JobStatus
): "neutral" | "info" | "success" {
  if (status === "not_started") return "neutral";
  if (status === "in_progress") return "info";
  return "success";
}
