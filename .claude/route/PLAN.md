# Capex Project Tracker: route build plan

App: `D:\ITTL_PROJECTS\Capex Project Tracker\Capex project` (React 19 + TS + Vite 8 + Tailwind 4, state in `src/context/CapexContext.tsx`, persisted to localStorage). Baseline commit `ce5726c`.

## Goal
Turn the partially built app into a professional capex control tool for the INDO TECH capex team, management and auditors:
1. Restyle to the EPMS design language ("Modern SaaS Glassmorphism: frosted glass backdrops, vibrant status badges, responsive layouts") with the INDO TECH logo.
2. Fix alignment and layout defects across every screen.
3. Add four capex controls: PR with a hard budget ceiling, PO dossier, exceptions register, append-only audit log.
4. App starts with **empty data** (no sample projects/POs), except roles and users needed for RBAC.

## Users
- Capex team (role `CAPEX Admin`): create the WBS, raise PRs, create POs (sub-works), upload documents.
- Management / approvers (`Admin`): approve PRs and budget revisions, read dashboards.
- Auditor (`Viewer`): read-only. Dossiers, exceptions, audit log, CSV export.

## Domain model (additions to `src/types/capex.ts`)
Hierarchy stays: Project → Phase → Part → Section → Work Package (`Task`) → Sub-work (`SubWork` = one vendor PO).
- **Budget line = Work Package.** Add `budgetAmount: number` (₹) to `Task`. Task modal gets a required budget field.
- **PurchaseRequisition** (new): `id, prNumber, projectId, taskId, amount (₹ incl. GST), purpose, requestedBy (userId), requestedAt (ISO), status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted to PO' | 'Cancelled', approvedBy?, approvedAt?, rejectionReason?, subWorkId?`.
- **BudgetRevision** (new): `id, taskId, oldBudget, newBudget, reason, requestedBy, requestedAt, status: 'Pending' | 'Approved' | 'Rejected', decidedBy?, decidedAt?, decisionNote?`.
- **SubWork** additions (all optional so old shapes still parse): `prId?`, `payeeBpCode?`, `grnNumber?`, `grnDate?`, `invoiceNumber?`, `invoiceDate?`, `quotesCompared?: number`, `lowestQuoteSelected?: boolean`, `selectionJustification?`.
- **DocumentCategory** gains: `'Capex Proposal' | 'Quote Comparison' | 'Purchase Requisition' | 'GRN'`.
- **ProjectDocument.wbsType** gains `'Purchase Requisition'`; documents for a PO use `wbsType: 'Sub-work'` and `wbsRecordId = subWork.id`, and for a PR `wbsRecordId = pr.id`. The document modal lets the user pick the PR or PO record. The dossier and the "missing documents" exception count only documents linked directly to that PO or its PR, with status ≠ 'Draft'.
- **AuditEntry** (new): `id, at (ISO), userId, userName, action ('create'|'update'|'delete'|'approve'|'reject'|'request'|'blocked'), entityType, entityId, entityLabel, before?: string, after?: string, reason?`.

## Business rules (pure functions in `src/utils/capexRules.ts`, no React)
- `committed(task) = Σ subWork.poValueGst` for sub-works of that task with status ≠ 'Cancelled'.
- `openPR(task) = Σ pr.amount` for PRs of that task with status 'Pending Approval' or 'Approved' (not converted/rejected/cancelled).
- `available(task) = task.budgetAmount − committed − openPR`.
- **Raise PR**: blocked when `amount > available` or `amount <= 0` or no purpose. Blocked attempt is written to the audit log (`action: 'blocked'`). UI then offers "Request budget revision" (new ceiling defaults to committed + openPR + amount; reason required).
- **Create PO (sub-work)**: must link to an `Approved` PR of the same task (and same project). Let `headroom = task.budgetAmount − committed(task) − openPR(task excluding this PR)`. PO value must satisfy `0 < value <= min(pr.amount, headroom)`. Never add the PR amount to a headroom that already excludes it. If more is needed, raise another PR. On save, PR status → 'Converted to PO' and `subWorkId` set, in the same state update.
- **Edit PO value**: `newValue <= currentValue + (task.budgetAmount − committed(task) − openPR(task))`. Over-ceiling edits are blocked and logged.
- **Single write path**: every Task and SubWork mutation in the context (`addTask`, `updateTask`, `addSubWork`, `updateSubWork`, deletes) goes through guarded functions that validate permissions, links (task ↔ project), money invariants and lifecycle. `updateTask` can't change `budgetAmount` once the task has any PR or PO; after that, only an approved revision changes it. All existing modals (`SubWorkModal`, `TaskModal`, WBS tree inline actions) must use these guarded paths. A PO can't be created without a PR anywhere in the UI.
- **No destructive deletes of financial records**: a project/phase/part/section/task that has PRs or POs under it can't be deleted (button disabled, with a tooltip saying why). A PO is cancelled (status 'Cancelled', reason required, audited), never deleted. PRs are cancelled or rejected, never deleted. Revisions are never deleted.
- **Rule checks run against the latest state**: guards compute availability inside the functional `setState` update (or from a ref holding the latest collections), not from a render-time snapshot, so two quick submissions can't both pass.
- **Approve PR / revision**: only users whose role has `finance.approve`. A requester can't approve their own PR or revision. Approving a revision sets `task.budgetAmount = newBudget`.
- Money in integer rupees; use `Math.round` on input; never floats from string concatenation.
- Include `src/utils/capexRules.check.ts`: assert-based self-check runnable with `node src/utils/capexRules.check.ts` (Node 24 type stripping) covering available/ceiling/converted-PR/cancelled-PO/self-approval cases.

## Exceptions register (derived, read-only; `src/utils/exceptions.ts`)
Each: severity (`Audit risk` / `Control gap` / `Data quality`), title, detail, link to the record.
1. Work package over budget (committed + openPR > budget).
2. Same PO number on more than one sub-work.
3. Payee BP code ≠ vendor BP code.
4. PO without linked PR.
5. PO status 'Billed' or 'Paid' without GRN number or invoice number.
6. PO missing required documents (PO Copy, Quote Comparison, Capex Proposal).
7. Lowest quote not selected and no justification, or fewer than 3 quotes without justification.
8. Same BP code with different supplier-name spellings (case/whitespace/"Pvt Ltd" variants).
9. Pending PR or budget revision older than 7 days.

## Audit log
- Context function `logAudit(...)`, called from **every** create/update/delete/approve/reject in the context (existing entities too: project, phase, part, section, milestone, task, sub-work, team, DPR, document, users/roles) and from blocked PR attempts.
- `before`/`after`: short human-readable diffs of changed fields only (e.g. `poValueGst: ₹20,10,000 → ₹21,00,000`).
- Stored in localStorage key `auditLog`. No delete/edit function is exposed. The reset/clear-data function is removed from the UI.
- Screen: filter by entity type, user, action, date range; text search; CSV export.
- Current user: there is no auth. Add an "Acting as" user switcher in the header (from `userPermissions`). It drives permissions (`hasPermission`) and the audit `userId`. Persist the choice in localStorage. Clearly label it (it is a stand-in until real login).

## New screens and navigation
Sidebar group **Procurement** (between Planning and Finance):
- `procurement-pr` **Purchase Requisitions**: table (PR no., work package, amount, status, requester, age); "Raise PR" modal with a live ceiling gauge (budget, committed, open PRs, available, this PR) that turns red and blocks above the ceiling; approve/reject actions for approvers; budget revision requests list with approve/reject.
- `procurement-dossier` **PO Dossier**: pick a PO → document chain (Capex proposal → Quote comparison → PR → PO → GRN → Invoice → Payments) each step ✓ / missing / warning with refs, money trail (budget line, PR, PO, paid, balance), quotes/justification, and that PO's audit history.
- `procurement-exceptions` **Exceptions**: grouped by severity, count badge in sidebar, each item links to the record.
Under **Access & RBAC** (or own item): `audit-log` **Audit Log**.
Rename existing sidebar item "Sub-work" label to "Sub-work (PO)" for clarity.

## Empty data
- `INITIAL_*` arrays for projects, phases, parts, sections, milestones, tasks, subworks, team, DPR, documents → `[]`. Keep `INITIAL_ROLES` and `INITIAL_USER_PERMISSIONS`.
- Bump `STORAGE_PREFIX` to `capex_v2_` so browsers holding old sample data start clean.
- Every list/table/chart has a designed empty state that says what will appear and the action to add the first item (e.g. "No projects yet. Create a project to start the WBS." + button if permitted). Dashboard charts must not crash or show NaN/Infinity with zero data (guard divisions).

## Design system (EPMS glassmorphism + INDO TECH)
- Logo: `src/components/layout/Logo.tsx`, inline SVG wordmark, red (#ED1C24) rounded rectangle with white heavy uppercase "INDO TECH" (font-family Arial Black/Archivo Black, weight 900, fallback). Placed in a 64px (`h-16`) brand row at the top of the sidebar so it lines up with the header. Collapsed sidebar shows a compact "IT" mark. Add `public/` note in README: replace with the official PNG at `public/indotech-logo.png` if available (the Logo component uses the PNG when it loads, SVG otherwise).
- Tokens in `src/index.css` `@theme`: keep blue primary for actions (`#2563EB`), add `--color-brand-red: #ED1C24` used only for the logo, the active-nav indicator bar and focus accents. Semantic success/warning/danger stay distinct from brand red.
- Glass surfaces: app background = soft slate gradient with two blurred color fields (blue and a faint red), fixed; header, sidebar, cards and modals use `bg-white/70` + `backdrop-blur-xl` + `border-white/60` + soft shadow. Add a `glass` utility class pair in index.css (`.glass`, `.glass-strong`) and use it through `Card`, `Modal`, `Header`, `Sidebar` instead of per-file literals.
- Vibrant status badges: one `Badge` variant map for all statuses (project, milestone, task, sub-work, PR, revision, exception severity), with a dot plus label.
- Remove dead Vite template CSS in `src/App.css` (and its import) and unused template assets if unreferenced.
- Fonts already loaded (Outfit headings, Inter body, Fira Code ids/amounts). Money and IDs use `font-mono tabular-nums`, right-aligned in tables.

## Alignment and layout fixes (apply everywhere)
- Sidebar brand row is `h-16` with a bottom border level with the header's; nav starts below it.
- Responsive shell: below `lg` the sidebar is off-canvas (overlay + backdrop, closes on nav), header spans full width; at `lg`+ header `left` and main `padding-left` follow sidebar width (260 / 72). Currently header is offset 260px even on mobile.
- One `PageHeader` component (title, one-line description, right-aligned actions, optional stats row) used by every module view, replacing ad-hoc headers. Same vertical rhythm: page `space-y-6`, cards `p-5`, card header `pb-4 mb-4`.
- Tables: header cells and body cells share padding (`px-4 py-3`), numeric columns right-aligned with `tabular-nums`, status columns centered or left consistently, action column right-aligned with fixed width, tables scroll horizontally inside their card (never the page).
- Forms/modals: two-column grid at `sm+`, one at mobile, labels above inputs, consistent `gap-4`, footer buttons right-aligned, primary on the right.
- Fix invalid classes (e.g. `py-0.2`), mixed radii (use card 12px / control 8px / pill full), inconsistent icon sizes (16px in nav and buttons).
- KPI cards equal height in a responsive grid; charts with consistent heights and empty states.
- Check every view at 1440px, 1024px and 390px widths: no overlap, no clipped text, no horizontal page scroll.

## Trust boundary (stated limitation, accepted for this pass)
There is no backend or login yet, so this pass is a **single-browser working prototype**. The acting-as switcher and the localStorage log can be tampered with by anyone with browser dev tools. So:
- Name the screen **"Activity Log"** in the UI, with a one-line note: "Recorded in this browser. Becomes tamper-proof when the app moves to the server (Supabase) with real login."
- The acting-as control is labelled "Acting as (demo)".
- Don't claim compliance in UI copy. Real enforcement moves to Postgres (constraints, RLS, append-only table) in a later pass.
- Multi-tab use is not supported. Note it in the README.

## Non-goals
- No backend, Supabase, or real authentication in this pass (localStorage stays).
- No Excel import.
- No changes to Gantt logic or DPR logic beyond styling/alignment and audit logging.
- No new npm dependencies.

## Acceptance criteria
1. `npm run build` (tsc + vite) passes with zero errors; `npm run lint` has no errors.
2. `node src/utils/capexRules.check.ts` passes. Cases include: ₹10L budget + approved ₹6L PR → PO of ₹6,00,001 blocked and ₹6,00,000 allowed; two PRs that each fit but together exceed the budget → second blocked; cancelled PO frees its amount; converted PR not double-counted; PO edit above the ceiling blocked; self-approval rejected.
3. Fresh browser: app opens with empty data, every screen shows a proper empty state, no console errors, no NaN/Infinity.
4. Walkthrough works end to end: create project → phase → part → section → work package with ₹10,00,000 budget → raise PR ₹6,00,000 (allowed) → raise PR ₹5,00,000 (blocked, logged) → request revision to ₹11,00,000 → approve as a different user → PR ₹5,00,000 now allowed → approve PRs → create PO from PR → dossier shows the chain with missing GRN/invoice flagged → exceptions list shows them → audit log shows every step with before/after.
5. Viewer (auditor) cannot create, edit, approve or delete anything; buttons are hidden.
6. Sidebar logo row aligns with the header; layout correct at 1440/1024/390 px.
7. Audit log entries cannot be edited or deleted from the UI or context API.
