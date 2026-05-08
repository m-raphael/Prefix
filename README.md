# Prefix

A vulnerability prioritization engine for MSPs and security consultants. Syncs CISA KEV, ingests CSV scan exports, and produces a ranked "Fix This First" report.

## Stack

- **Next.js 16** (App Router) + TypeScript (strict)
- **Prisma** + PostgreSQL 16
- **Clerk** for authentication (RBAC)
- **Tailwind CSS v4** + shadcn/ui
- **NVIDIA Build** (free AI models) for plain-language explanations

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### Setup

```bash
# Clone and install
git clone <repo-url> && cd prefix
npm install

# Start PostgreSQL
docker run -d --name prefix-db -e POSTGRES_PASSWORD=password -e POSTGRES_USER=prefix -e POSTGRES_DB=prefix -p 5432:5432 postgres:16

# Configure environment
cp .env.example .env
# Fill in your Clerk keys from https://dashboard.clerk.com

# Push the schema and generate the client
npx prisma db push
npx prisma generate

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check |
| `npm run db:push` | Push schema to DB |
| `npm run db:migrate` | Create a migration |
| `npm run db:studio` | Open Prisma Studio |

## License

MIT
