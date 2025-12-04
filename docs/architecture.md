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
│   │   └── query-client.ts   # React Query config
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
| **lib/** | Third-party integrations | `auth.ts` (better-auth), `query-client.ts`, `stripe.ts` |
| **utils/** | Pure helper functions | `cn()`, `formatDate()`, `slugify()` |

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
