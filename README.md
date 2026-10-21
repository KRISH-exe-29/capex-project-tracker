# INDO TECH Capex Project Tracker

Capex control for the INDO TECH capex team, management and auditors. It replaces the master sheet / PO tracker / payment tracker workbooks with one connected record:

```
Project → Phase → Part → Section → Work package (budget line) → Purchase requisition → Purchase order → GRN / invoice / payment
```

## What it enforces

| Control | Where |
| --- | --- |
| A PR cannot exceed what is left on its work package: `available = budget − PO committed − open PRs` | Procurement → Requisitions |
| Going over needs a budget revision, approved by someone else with finance-approve rights | Requisitions → Budget revisions |
| Every PO comes from an approved PR and cannot exceed the PR amount or the budget left | Purchase Orders, PO form |
| A work package budget is locked once it has a PR or PO; only an approved revision changes it | Work Packages |
| Nobody approves their own PR or revision, or changes their own permissions | Data layer (`CapexContext`) |
| Records with PRs or POs are never deleted; POs and PRs are cancelled with a reason | Data layer |
| Payments are recorded with GRN and invoice numbers and the payee BP code | Finance → Billing |
| Every create, change, approval and blocked attempt is logged with before/after values | Records → Activity Log |

The **PO Dossier** puts the whole chain for one PO on a single page (proposal, quotes, PR, PO, GRN, invoice, payment, money trail, history). The **Exceptions** register flags over-budget lines, POs without PRs, payee ≠ vendor, billed/paid without GRN or invoice, missing documents, quote selection without a reason, duplicate PO numbers, supplier-name variants and approvals waiting over 7 days.

Business rules live in `src/utils/capexRules.ts` (pure functions) and `src/utils/exceptions.ts`.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

Checks before release:

```bash
npm run build                       # type check + production build
npm run lint
node src/utils/capexRules.check.ts  # budget-ceiling rule self-check (Node 22.6+)
```

The app starts empty. Three demo users exist: **Management Approver** (Admin), **Capex Team** (CAPEX Admin) and **Auditor** (Viewer). Switch between them with the *Acting as* menu in the header.

## Trust boundary (read this)

This version keeps all data in the browser (`localStorage`, keys prefixed `capex_v2_`). It is a working prototype for one browser, not an audit-grade system:

- The *Acting as (demo)* menu stands in for login. Anyone can pick any user.
- The Activity Log cannot be edited from the app, but browser developer tools can change it.
- Open the app in one tab at a time; two tabs do not see each other's changes.
- Documents are a register (name, type, link, status). The files themselves are not stored.

Moving to the EPMS stack (Supabase/Postgres with real login, RLS, database constraints for the ceiling and an append-only audit table) is what makes these controls enforceable.

## Logo

The sidebar uses the official INDO TECH logo from `src/assets/indotech-logo.jpg` (a 720 × 120 copy of the company artwork). To change it, replace that file with the new artwork at the same 6:1 proportion.
