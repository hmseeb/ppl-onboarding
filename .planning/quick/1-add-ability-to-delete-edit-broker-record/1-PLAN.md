---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/admin/brokers/[id]/route.ts
  - components/admin/BrokerTable.tsx
autonomous: true
requirements: [QUICK-1]

must_haves:
  truths:
    - "Admin can delete a broker record from the dashboard"
    - "Admin can edit broker fields inline and save changes"
    - "Delete requires confirmation before executing"
    - "Edits persist across page refresh"
  artifacts:
    - path: "app/api/admin/brokers/[id]/route.ts"
      provides: "DELETE and PATCH endpoints for individual broker"
      exports: ["DELETE", "PATCH"]
    - path: "components/admin/BrokerTable.tsx"
      provides: "Edit and delete UI within BrokerCard expanded view"
  key_links:
    - from: "components/admin/BrokerTable.tsx"
      to: "/api/admin/brokers/[id]"
      via: "fetch DELETE and PATCH calls"
      pattern: "fetch.*api/admin/brokers"
---

<objective>
Add edit and delete capabilities for broker records on the admin dashboard.

Purpose: Admin needs to correct broker data and remove test/invalid records without touching Supabase directly.
Output: DELETE + PATCH API endpoints and edit/delete UI in the broker card expanded view.
</objective>

<execution_context>
@/Users/haseeb/.claude/get-shit-done/workflows/execute-plan.md
@/Users/haseeb/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@app/api/admin/brokers/route.ts
@components/admin/BrokerTable.tsx
@lib/types.ts
@lib/auth.ts
@lib/supabase/server.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create admin broker PATCH and DELETE API endpoints</name>
  <files>app/api/admin/brokers/[id]/route.ts</files>
  <action>
Create a new route handler at `app/api/admin/brokers/[id]/route.ts` with two methods:

**DELETE handler:**
- Verify admin auth using the same cookie pattern from `app/api/admin/brokers/route.ts` (read `ADMIN_COOKIE_NAME` cookie, call `verifySessionCookie`, return 401 if invalid)
- Extract `id` from route params (Next.js 16 style: `params` is a Promise, await it)
- Use `createServiceClient()` to delete from `brokers` table where `id` matches
- Return 200 `{ success: true }` on success, 404 if broker not found, 500 on DB error

**PATCH handler:**
- Same auth check as DELETE
- Extract `id` from route params
- Parse JSON body. Allow updating these fields only (whitelist): `first_name`, `last_name`, `email`, `phone`, `company_name`, `state`, `primary_vertical`, `secondary_vertical`, `batch_size`, `deal_amount`, `delivery_methods`, `delivery_email`, `delivery_phone`, `crm_webhook_url`, `contact_hours`, `custom_hours_start`, `custom_hours_end`, `weekend_pause`
- Filter incoming body to only include whitelisted keys that are present
- If no valid fields provided, return 400
- Use `createServiceClient()` to update the broker row, return the updated broker
- Return 200 with updated broker data, 404 if not found, 500 on DB error

Follow the exact import and auth pattern from `app/api/admin/brokers/route.ts`.
  </action>
  <verify>
    <automated>cd /Users/haseeb/ppl-onboarding && npx tsc --noEmit app/api/admin/brokers/\[id\]/route.ts 2>&1 | head -20</automated>
    <manual>Confirm route file exports DELETE and PATCH with proper auth guards</manual>
  </verify>
  <done>DELETE /api/admin/brokers/[id] removes broker, PATCH /api/admin/brokers/[id] updates whitelisted fields. Both require admin auth cookie.</done>
</task>

<task type="auto">
  <name>Task 2: Add edit and delete UI to BrokerCard in BrokerTable</name>
  <files>components/admin/BrokerTable.tsx</files>
  <action>
Modify `components/admin/BrokerTable.tsx` to add edit and delete functionality inside each `BrokerCard` expanded panel.

**Delete button:**
- Add a red "Delete" button (using `Trash2` icon from lucide-react) in the expanded card footer area (the preferences footer div)
- On click, show a `window.confirm("Delete {first_name} {last_name}? This cannot be undone.")` dialog
- If confirmed, call `DELETE /api/admin/brokers/{broker.id}`
- On success, remove the broker from the local `brokers` state array in `BrokerTable` and decrement `total` by 1
- Pass an `onDelete` callback prop from `BrokerTable` to `BrokerCard`

**Edit mode:**
- Add an "Edit" button (using `Pencil` icon from lucide-react) next to the delete button
- When clicked, toggle the card into edit mode where `DetailRow` values become editable inputs
- In edit mode, editable fields: `first_name`, `last_name`, `email`, `phone`, `company_name`, `state`, `batch_size`, `deal_amount`. Use plain `<input>` elements styled with the existing glass input pattern (`glass rounded-lg px-2 py-1 text-sm text-foreground`)
- Show "Save" and "Cancel" buttons in edit mode (Save is primary colored, Cancel is muted)
- On Save, call `PATCH /api/admin/brokers/{broker.id}` with changed fields only
- On success, update the broker in the local `brokers` state array and exit edit mode
- On Cancel, discard changes and exit edit mode
- While saving, show a loading spinner on the Save button and disable both buttons

**State management:**
- Add `editMode` boolean state and `editData` partial broker state to `BrokerCard`
- Add `onDelete: (id: string) => void` and `onUpdate: (id: string, data: Partial<Broker>) => void` props to `BrokerCard`
- In `BrokerTable`, implement `handleDelete` (filters broker from array, decrements total) and `handleUpdate` (maps over brokers array, replaces matching id with merged data)

Keep the existing glass/red theme styling. Edit inputs should be compact and fit within the existing DetailRow layout.
  </action>
  <verify>
    <automated>cd /Users/haseeb/ppl-onboarding && npx tsc --noEmit components/admin/BrokerTable.tsx 2>&1 | head -20</automated>
    <manual>Open /admin, expand a broker card, verify Edit and Delete buttons appear. Test edit mode toggles inputs, Save calls API, Delete shows confirm dialog.</manual>
  </verify>
  <done>Each broker card has working Edit (inline form with Save/Cancel) and Delete (with confirmation) buttons. Changes persist via API calls and update local state immediately.</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors: `cd /Users/haseeb/ppl-onboarding && npx tsc --noEmit`
- Dev server starts: `cd /Users/haseeb/ppl-onboarding && bun dev` (verify no runtime errors in console)
- Manual: Visit /admin, expand a card, click Edit, modify a field, Save. Refresh page, confirm change persisted.
- Manual: Visit /admin, expand a card, click Delete, confirm dialog, verify broker removed from list.
</verification>

<success_criteria>
- Admin can edit broker info fields inline and save successfully
- Admin can delete a broker with confirmation dialog
- Both operations require admin authentication
- UI updates immediately without full page refresh
- Changes persist in database across page refreshes
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-ability-to-delete-edit-broker-record/1-SUMMARY.md`
</output>
