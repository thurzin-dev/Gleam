-- ============================================================
-- Gleam QC — Per-property room-based checklists
-- ============================================================
-- A property's checklist is stored as an ordered list of rooms,
-- each containing an ordered list of items. Shape:
--   [{ "name": "Kitchen", "items": [{ "id": "...", "label": "Wipe counters" }] }, ...]
-- ============================================================

alter table properties
  add column if not exists checklist jsonb not null default '[]';
