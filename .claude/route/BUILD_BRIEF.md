You are the engineer. Implement the plan in `.claude/route/PLAN.md` in full, in this workspace (`D:\ITTL_PROJECTS\Capex Project Tracker\Capex project`). The plan is the source of truth; read it completely first, then read the existing code it touches (`src/types/capex.ts`, `src/context/CapexContext.tsx`, `src/data/initialData.ts`, `src/App.tsx`, `src/index.css`, `src/components/layout/*`, `src/components/common/*`, and every module view).

Constraints:
- Work only inside this workspace. Git baseline is commit `ce5726c`; do not commit, reset, or rewrite history. Preserve existing user code except where the plan changes it.
- No new npm dependencies. Use what is in package.json (React 19, Tailwind 4, lucide-react, recharts, date-fns, react-hook-form, clsx, tailwind-merge, framer-motion).
- No secrets, no network calls, no destructive shell commands.
- Match the existing code style (functional components, `cn()` helper, TypeScript strict).
- Keep the design consistent: build shared pieces once (`PageHeader`, `glass` classes, `Badge` variants, empty state, table styles) and use them everywhere, instead of per-file literals.
- Business rules live as pure functions in `src/utils/capexRules.ts` and are what the context guards call. Write `src/utils/capexRules.check.ts` (assert-based, runnable with `node src/utils/capexRules.check.ts` on Node 24 with type stripping; use only erasable TS syntax, with `.ts` extensions in relative imports if needed) covering every case listed in acceptance criterion 2.
- Pay special attention to: the corrected PO ceiling formula (never add the PR amount to headroom that already excludes it), the single guarded write path for Task/SubWork, no deletion of financial records, empty-data safety (no NaN/Infinity, no crashes on empty arrays), and the alignment/responsive fixes (sidebar brand row h-16 aligned with header; off-canvas sidebar below lg; header full-width on mobile).
- UI copy: plain, short, active voice. The log screen is called "Activity Log" with the trust-boundary note from the plan. The user switcher is labelled "Acting as (demo)".
- Logo: inline SVG wordmark component per plan (red #ED1C24 rectangle, white heavy "INDO TECH"); use `public/indotech-logo.png` if it loads, SVG otherwise.
- Update README.md: what the app does, how to run, the trust-boundary limitation, how to replace the logo.

When done, run and make pass:
1. `npm run build`
2. `npm run lint`
3. `node src/utils/capexRules.check.ts`

Then report: every file you created/changed/deleted with a one-line reason, the exact output of the three commands, anything in the plan you could not do and why, and any judgement calls you made.
