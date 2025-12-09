# Architecture

## Folder Structure

```
varuna-carbon-dmrv/
├── drizzle/                  # Database migrations (top-level)
│   └── *.sql
│
├── app/                      # Next.js App Router
│   ├── (auth)/               # Protected routes
│   ├── (public)/             # Public routes
│   ├── layout.tsx
│   └── page.tsx
│
├── src/
│   ├── components/           # React components
│   │   ├── ui/               # Primitives (Button, Input)
│   │   └── shared/           # Domain-agnostic (Header, Sidebar)
│   │
│   ├── config/               # Configuration
│   │   ├── env.server.ts     # Server-only env vars
│   │   └── env.client.ts     # Client-safe env vars
│   │
│   ├── data-access/          # Pure DB operations (Drizzle)
│   │   ├── projects.ts
│   │   ├── batches.ts
│   │   └── ...
│   │
│   ├── db/                   # Database connection & schema
│   │   ├── index.ts          # Drizzle connection
│   │   └── schema.ts         # Table definitions
│   │
│   ├── fn/                   # Server functions
│   │   ├── projects.ts       # Validation + auth + business logic + DB
│   │   └── ...
│   │
│   ├── hooks/                # React hooks
│   │   ├── useProjects.ts    # React Query wrappers
│   │   └── ...
│   │
│   ├── lib/                  # Integrations & third-party
│   │   ├── auth.ts           # better-auth setup
│   │   ├── query-client.ts   # React Query config
│   │   └── isometric/        # Isometric API client
│   │       ├── index.ts      # Public exports
│   │       ├── client.ts     # API client class
│   │       └── types.ts      # Type definitions
│   │
│   ├── queries/              # React Query factories
│   │   ├── projects.ts       # Query keys + options
│   │   └── ...
│   │
│   ├── styles/               # CSS files
│   │   └── globals.css
│   │
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   │
│   └── utils/                # Pure helper functions
│       └── index.ts          # cn(), formatDate(), etc.
│
├── scripts/                  # Dev/build scripts
│   └── wait-for-db.ts
│
├── docs/                     # Documentation
├── drizzle.config.ts
├── docker-compose.yml
└── package.json
```

## Data Flow

```
Component → hooks/ → queries/ → fn/ → data-access/ → db/
```

### Layer Responsibilities

| Layer | Purpose | Example |
|-------|---------|---------|
| **components/** | UI rendering | `<ProjectCard />` |
| **hooks/** | React Query + state | `useProjects()`, `useCreateProject()` |
| **queries/** | Cache keys + query options | `projectKeys`, `getProjectsQuery()` |
| **fn/** | Server functions (auth, validation, business logic) | `createProjectFn()` |
| **data-access/** | Pure Drizzle queries | `createProject()`, `getProjectById()` |
| **db/** | Connection + schema | `db`, `projects` table |

### lib/ vs utils/

| Folder | Purpose | Examples |
|--------|---------|----------|
| **lib/** | Third-party integrations | `auth.ts` (better-auth), `query-client.ts`, `isometric/` |
| **utils/** | Pure helper functions | `cn()`, `formatDate()`, `slugify()` |

## Isometric API Integration

The `src/lib/isometric/` module provides a client for interacting with Isometric's Registry and Certify (MRV) APIs. This enables syncing biochar carbon removal data with Isometric for credit issuance and verification.

### Authentication

Isometric requires two credentials for API authentication:

| Header | Purpose | Source |
|--------|---------|--------|
| `X-Client-Secret` | Identifies the client application | `ISOMETRIC_CLIENT_SECRET` env var |
| `Authorization: Bearer <token>` | Authenticates as a specific organization | `ISOMETRIC_ACCESS_TOKEN` env var |

Credentials are managed in the Isometric UI at: https://registry.isometric.com/account/team-settings

### Environment Variables

```bash
# .env
ISOMETRIC_CLIENT_SECRET=your_client_secret_here
ISOMETRIC_ACCESS_TOKEN=your_access_token_here
ISOMETRIC_ENVIRONMENT=sandbox  # or 'production'
```

### API Endpoints

The client connects to two Isometric APIs:

| API | Sandbox URL | Production URL | Purpose |
|-----|-------------|----------------|---------|
| **Registry** | `api.sandbox.isometric.com/registry/v0` | `api.isometric.com/registry/v0` | Credits, deliveries, retirements |
| **Certify (MRV)** | `api.sandbox.isometric.com/mrv/v0` | `api.isometric.com/mrv/v0` | Projects, removals, GHG statements |

### Usage

```typescript
import { isometric } from '@/lib/isometric';

// Registry API - Get organization info
const org = await isometric.getOrganisation();

// Registry API - List projects
const projects = await isometric.listProjects();

// Registry API - Retire credits
const retirement = await isometric.retireOldestCredits({
  supplier_id: 'sup_123',
  quantity: 100,
  retirement_reason: 'Voluntary offset',
});

// Certify API - Create a removal
const removal = await isometric.createRemoval({
  project_id: 'proj_123',
  removal_template_id: 'template_456',
  reporting_period_start: '2024-01-01',
  reporting_period_end: '2024-03-31',
});

// Certify API - Submit for verification
const statement = await isometric.createGHGStatement({
  project_id: 'proj_123',
  removal_ids: ['rem_789'],
  reporting_period_start: '2024-01-01',
  reporting_period_end: '2024-03-31',
});
```

### Module Structure

```
src/lib/isometric/
├── index.ts      # Public exports
├── client.ts     # IsometricClient class with all API methods
└── types.ts      # TypeScript type definitions

src/lib/adapters/
├── index.ts                    # Public exports
├── types.ts                    # Registry-agnostic interfaces
└── isometric/
    ├── index.ts                # Isometric adapter exports
    ├── adapter.ts              # Main IsometricAdapter class
    ├── sync.ts                 # Batch sync & retry orchestration
    └── transformers/           # Data transformation functions
        ├── index.ts
        ├── facility.ts         # facility → Isometric Facility
        ├── feedstock.ts        # feedstockType → Isometric FeedstockType
        ├── production.ts       # productionRun → Isometric ProductionBatch
        ├── application.ts      # application → StorageLocation + BiocharApplication
        └── credit-batch.ts     # creditBatch → Removal + GHGStatement
```

### Key Concepts

| Isometric Concept | Description |
|-------------------|-------------|
| **Organisation** | Your company entity in Isometric |
| **Supplier** | Entity that produces carbon removals |
| **Project** | A carbon removal project (e.g., biochar production site) |
| **Removal** | A CO₂e removal event for a reporting period |
| **GHG Statement** | Submission of removals for third-party verification |
| **Credit Batch** | Issued carbon credits after verification |
| **Issuance** | Record of credits being issued |
| **Delivery** | Transfer of credits from supplier to buyer |
| **Retirement** | Permanent removal of credits from circulation |

### Data Flow to Isometric

```
Local DB (Varuna) → Certify API (MRV) → Verification → Registry API → Credits
      │                    │                              │
      │                    │                              │
Production Runs     Create Removals            Credit Batches
Biochar Samples     Submit GHG Statement       Deliveries
Applications        Third-party Review         Retirements
```

### Documentation

- Authentication: https://docs.isometric.com/api-reference/authentication
- API Introduction: https://docs.isometric.com/api-reference/introduction
- Key Certify Concepts: https://docs.isometric.com/user-guides/certify/key-certify-concepts
- Key Registry Concepts: https://docs.isometric.com/user-guides/registry/key-registry-concepts

## Example: Creating a Project

### 1. data-access/projects.ts
```typescript
export async function createProject(data: NewProject) {
  const [project] = await db.insert(projects).values(data).returning();
  return project;
}
```

### 2. fn/projects.ts
```typescript
'use server';

const schema = z.object({ name: z.string().min(1) });

export async function createProjectFn(input: unknown) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const validated = schema.parse(input);
  return createProject({ ...validated, status: 'draft' });
}
```

### 3. queries/projects.ts
```typescript
export const projectKeys = {
  all: ['projects'] as const,
};

export function getProjectsQuery() {
  return queryOptions({
    queryKey: projectKeys.all,
    queryFn: () => getProjectsFn(),
  });
}
```

### 4. hooks/useProjects.ts
```typescript
'use client';

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
```

### 5. Component
```typescript
function CreateProjectForm() {
  const { mutate, isPending } = useCreateProject();
  return <button onClick={() => mutate({ name: 'New Project' })}>Create</button>;
}
```

## Path Aliases

```typescript
import { db } from '@/db';
import { cn } from '@/utils';
import { auth } from '@/lib/auth';
```

`@/` → `./src/`
