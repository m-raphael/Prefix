# Sprints — Repo Architecture Reference for Prefix

## Purpose

Apply the **Repo-Architecture-Reference-Prompt** methodology to produce a living architecture reference that any contributor (human or AI) can read in under 10 minutes to understand how the Prefix codebase works.

The reference answers five questions:

| Dimension | Question |
|-----------|----------|
| **Structure** | Where does everything live? |
| **Data** | How does data flow from entry to storage? |
| **API** | What endpoints exist, what do they expect/return? |
| **UI** | What components exist, how do they compose? |
| **Ops** | How does the project build, test, and deploy? |

## Sprint cadence

One sprint per dimension. Each sprint produces a section of the reference doc. Sprints run sequentially because later dimensions depend on earlier ones for context.

| Sprint | Dimension | Duration | Depends on |
|--------|-----------|----------|------------|
| 1 | Structure | ~1 session | Nothing |
| 2 | Data | ~1 session | Sprint 1 |
| 3 | API | ~1 session | Sprints 1–2 |
| 4 | UI | ~1 session | Sprints 1–3 |
| 5 | Ops | ~1 session | Sprints 1–4 |

---

## Sprint 1 — Structure

**Goal**: Map every directory and file so you can find anything in seconds.

**Inputs**:
- Top-level directory listing
- `src/` tree (app router, lib, components, middleware)
- `prisma/` schema
- `.github/` workflows
- Config files (`next.config.ts`, `tsconfig.json`, `components.json`, `eslint.config.mjs`)

**Deliverable**: Folder map with one-line descriptions.

```
prefix/
  prisma/             Data model (PostgreSQL via Prisma)
  src/
    app/              Next.js App Router pages & API routes
      api/            REST endpoints (ingest, prioritization, reports)
      dashboard/      Authenticated dashboard pages
      admin/          Admin panel pages
      sign-in/        Clerk auth pages
      sign-up/
    components/       Shared React components
      ui/             shadcn/ui primitives (button, card, table, etc.)
    lib/              Business logic & data access
    middleware/        (unused — middleware lives at src/middleware.ts)
  public/             Static assets
  .github/            CI/CD workflows + PR template
```

**Output file**: `docs/arch/01-structure.md`

---

## Sprint 2 — Data

**Goal**: Understand the data model, how entities relate, and how data flows from ingestion to report.

**Inputs**:
- `prisma/schema.prisma` (6 models: Organization, User, Asset, Vulnerability, Finding, AuditLog)
- `src/lib/db.ts` (Prisma client singleton)
- `src/lib/csv.ts` (CSV parsing + upsert pipeline)
- `src/lib/kev.ts` (CISA KEV sync)
- `src/lib/osv.ts` (OSV.dev enrichment)
- `src/lib/score.ts` (priority scoring logic)
- `src/lib/priority.ts` (priority tier assignment)

**Covered**:
- Entity relationship diagram (text-based)
- Ingestion flow: CSV upload → asset/vuln/finding upsert
- Enrichment flow: KEV flag + OSV fixed-version lookup
- Scoring: CVSS × KEV × internet-facing → numeric score → tier (critical/high/medium/low)

**Output file**: `docs/arch/02-data.md`

---

## Sprint 3 — API

**Goal**: Every endpoint documented with method, path, auth requirement, input schema, output shape, and error codes.

**Inputs**:
- `src/app/api/` route handlers
- `src/middleware.ts` (Clerk auth middleware)
- Zod schemas used in route validation

**Expected surface** (derived from Phase 1–3 commits):

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/ingest/csv` | Upload & parse CSV scan export | Clerk |
| `POST` | `/api/sync/kev` | Pull latest CISA KEV catalog | Clerk (admin) |
| `GET` | `/api/findings` | List prioritized findings with filters | Clerk |
| `PATCH` | `/api/findings/[id]` | Update finding status/notes | Clerk |
| `GET` | `/api/reports/fix-first` | Generate "Fix This First" ranked report | Clerk |
| `GET` | `/api/dashboard/stats` | Aggregate stats for dashboard widgets | Clerk |

Each entry includes request/response examples and error codes.

**Output file**: `docs/arch/03-api.md`

---

## Sprint 4 — UI

**Goal**: Component inventory, composition hierarchy, and design conventions.

**Inputs**:
- `src/components/` (finding-detail, findings-filters, findings-table)
- `src/components/ui/` (shadcn/ui primitives)
- `src/app/dashboard/` pages
- `src/app/layout.tsx` (root layout with Clerk provider + theme)
- `tailwind.config` / `globals.css` (Tailwind v4 + CSS custom properties)

**Covered**:
- Component tree: layout → dashboard page → filters + table + detail panel
- State management pattern (server components + client islands)
- shadcn/ui usage conventions
- Styling approach (Tailwind utility classes + `cn()` helper)

**Output file**: `docs/arch/04-ui.md`

---

## Sprint 5 — Ops

**Goal**: Build, test, lint, and CI/CD pipeline documented.

**Inputs**:
- `.github/workflows/` (CI, probably lint + type-check + test + build)
- `package.json` scripts
- `eslint.config.mjs`
- `tsconfig.json`
- `vitest` config
- `.env.example`

**Covered**:
- Local dev setup (Docker PostgreSQL, Clerk keys, env vars)
- CI pipeline stages
- Test strategy (Vitest, unit tests in `src/lib/`)
- Lint + type-check gates
- Database migration workflow (Prisma db push vs migrate)

**Output file**: `docs/arch/05-ops.md`

---

## Completion criteria

All five sprints are **done** when:

- [ ] `docs/arch/` exists with all five markdown files
- [ ] A top-level `docs/arch/README.md` index links them together
- [ ] The index is referenced from the project README
- [ ] Each file can be read independently in under 5 minutes

## How sprints gate future work

After Sprint 5 completes, the architecture reference serves as the onboarding artifact for:
- Any new contributor onboarding
- AI agent context seeding (paste into a fresh session)
- Phase planning (reference before designing new features)
- Code review baseline ("does this change match the documented pattern?")
