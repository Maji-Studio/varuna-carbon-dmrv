# Architecture

## Folder Structure

```
varuna-carbon-dmrv/
├── drizzle/                  # Database migrations (top-level)
│   └── *.sql
│
├── app/                      # Next.js App Router
│   └── data-entry/           # Data entry forms
│       ├── actions.ts        # Shared form options
│       ├── feedstock/
│       ├── feedstock-delivery/
│       ├── production-run/
│       ├── sampling/
│       ├── incident/
│       └── biochar-product/
│
├── src/
│   ├── components/           # React components
│   │   ├── ui/               # Primitives (Button, Input)
│   │   ├── forms/            # Form components (TanStack Form)
│   │   └── data-entry/       # Data entry layout components
│   │
│   ├── config/               # Configuration
│   │   └── env.ts            # Environment variable validation
│   │
│   ├── data-access/          # Pure DB operations (Drizzle)
│   │   ├── feedstocks.ts
│   │   ├── feedstock-deliveries.ts
│   │   ├── production-runs.ts
│   │   ├── samples.ts
│   │   ├── incidents.ts
│   │   └── biochar-products.ts
│   │
│   ├── db/                   # Database connection & schema
│   │   ├── index.ts          # Drizzle connection
│   │   ├── schema.ts         # Barrel file
│   │   └── schema/           # Table definitions by domain
│   │
│   ├── fn/                   # Server functions ("use server")
│   │   ├── feedstocks.ts
│   │   ├── feedstock-deliveries.ts
│   │   ├── production-runs.ts
│   │   ├── samples.ts
│   │   ├── incidents.ts
│   │   └── biochar-products.ts
│   │
│   ├── lib/                  # Integrations & third-party
│   │   ├── auth.ts           # better-auth setup
│   │   ├── query-client.ts   # React Query config
│   │   ├── form-utils.ts     # Form utility functions
│   │   ├── validations/      # Validation utilities
│   │   │   └── completion.ts # Completion check functions for forms
│   │   ├── actions/          # Shared server actions
│   │   │   └── utils.ts      # Helper functions
│   │   └── isometric/        # Isometric API client
│   │       ├── index.ts      # Public exports
│   │       ├── client.ts     # API client class
│   │       ├── types.ts      # Type definitions
│   │       ├── adapter.ts    # Sync functions
│   │       ├── utils/        # Aggregation utilities
│   │       └── transformers/ # Data transformation functions
│   │
│   ├── styles/               # CSS files
│   │   └── globals.css
│   │
│   ├── types/                # TypeScript types
│   │   ├── index.ts
│   │   └── actions.ts        # ActionResult type
│   │
│   └── utils/                # Pure helper functions
│       └── index.ts          # cn(), formatDate(), etc.
│
├── scripts/                  # Dev/build scripts
├── docs/                     # Documentation
├── drizzle.config.ts
├── docker-compose.yml
└── package.json
```

## Data Flow

```
Component → fn/ → data-access/ → db/
    │
    └─ (for complex UI: hooks/ → queries/ → fn/)
```

### Layer Responsibilities

| Layer | Purpose | Example |
|-------|---------|---------|
| **components/** | UI rendering | `<FeedstockForm />` |
| **fn/** | Server functions (validation + business logic) | `createFeedstockFn()` |
| **data-access/** | Pure Drizzle queries | `insert()`, `findByIdWithRelations()` |
| **db/** | Connection + schema | `db`, `feedstocks` table |

### Optional Layers (Add When Needed)

| Layer | When to Add | Purpose |
|-------|-------------|---------|
| **hooks/** | Client-side caching needed | React Query mutation wrappers |
| **queries/** | Multiple components share data | Query key factories |

### lib/ vs utils/

| Folder | Purpose | Examples |
|--------|---------|----------|
| **lib/** | Third-party integrations, validation | `auth.ts`, `isometric/`, `validations/` |
| **utils/** | Pure helper functions | `cn()`, `formatDate()`, `calculateDistanceKm()` |

## Server Function Pattern

Each `fn/*.ts` file follows this structure:

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResult } from "@/types/actions";
import * as entityData from "@/data-access/entity";

// ============================================
// SCHEMAS (inline, close to usage)
// ============================================

const entityFormSchema = z.object({
  facilityId: z.string().uuid("Please select a facility"),
  // ... other fields
});

export type EntityFormInput = z.infer<typeof entityFormSchema>;

// ============================================
// COMPLETION CHECK
// ============================================

function isComplete(values: Partial<EntityFormInput>): boolean {
  return Boolean(values.facilityId && /* other required fields */);
}

// ============================================
// SERVER FUNCTIONS
// ============================================

export async function createEntityFn(
  input: EntityFormInput
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate
  const parsed = entityFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Business logic
  const status = isComplete(parsed.data) ? "complete" : "missing_data";

  // 3. Call data-access
  const result = await entityData.insert({ ...parsed.data, status });

  // 4. Revalidate
  revalidatePath("/data-entry");

  return { success: true, data: { id: result.id } };
}
```

## Data Access Pattern

Each `data-access/*.ts` file follows this structure:

```typescript
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { entities } from "@/db/schema";

// ============================================
// TYPES
// ============================================

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

// ============================================
// QUERIES
// ============================================

export async function findByIdWithRelations(id: string) {
  const result = await db.query.entities.findFirst({
    where: eq(entities.id, id),
    with: { facility: true, /* other relations */ },
  });
  return result || null;
}

// Infer type from function return
export type EntityWithRelations = NonNullable<
  Awaited<ReturnType<typeof findByIdWithRelations>>
>;

// ============================================
// MUTATIONS
// ============================================

export async function insert(data: NewEntity): Promise<Entity> {
  const [result] = await db
    .insert(entities)
    .values({ ...data, updatedAt: new Date() })
    .returning();
  return result;
}
```

## Isometric API Integration

The `src/lib/isometric/` module provides a client for interacting with Isometric's Registry and Certify (MRV) APIs. This enables syncing biochar carbon removal data with Isometric for credit issuance and verification.

### Module Structure

```
src/lib/isometric/
├── index.ts          # Public exports
├── client.ts         # IsometricClient class with all API methods
├── types.ts          # TypeScript type definitions
├── adapter.ts        # Sync functions (syncFacility, syncCreditBatch, etc.)
├── utils/            # Aggregation utilities
│   └── aggregation.ts
└── transformers/     # Data transformation functions
    ├── index.ts
    ├── facility.ts
    ├── feedstock.ts
    ├── production.ts
    ├── application.ts
    ├── credit-batch.ts
    └── removal.ts
```

### Authentication

Isometric requires two credentials for API authentication:

| Header | Purpose | Source |
|--------|---------|--------|
| `X-Client-Secret` | Identifies the client application | `ISOMETRIC_CLIENT_SECRET` env var |
| `Authorization: Bearer <token>` | Authenticates as a specific organization | `ISOMETRIC_ACCESS_TOKEN` env var |

### Environment Variables

```bash
# .env
ISOMETRIC_CLIENT_SECRET=your_client_secret_here
ISOMETRIC_ACCESS_TOKEN=your_access_token_here
ISOMETRIC_ENVIRONMENT=sandbox  # or 'production'
ISOMETRIC_PROJECT_ID=prj_xxx   # Certify project ID
ISOMETRIC_REMOVAL_TEMPLATE_ID=rvt_xxx  # Removal template ID
```

### API Endpoints

| API | Sandbox URL | Production URL | Purpose |
|-----|-------------|----------------|---------|
| **Registry** | `api.sandbox.isometric.com/registry/v0` | `api.isometric.com/registry/v0` | Credits, deliveries, retirements |
| **Certify (MRV)** | `api.sandbox.isometric.com/mrv/v0` | `api.isometric.com/mrv/v0` | Projects, removals, GHG statements |

### Usage

```typescript
import { isometric, syncCreditBatch } from '@/lib/isometric';

// Get organization info
const org = await isometric.getCertifyOrganisation();

// Sync a credit batch to Isometric (creates Removal + GHG Statement)
const result = await syncCreditBatch(creditBatchId);
if (result.success) {
  console.log('GHG Statement ID:', result.isometricId);
}
```

### Data Flow to Isometric

```
Local DB (Varuna) → Certify API (MRV) → Verification → Registry API → Credits
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

## Path Aliases

```typescript
import { db } from '@/db';
import { cn } from '@/utils';
import { createFeedstockFn } from '@/fn/feedstocks';
import * as feedstockData from '@/data-access/feedstocks';
import { isometric } from '@/lib/isometric';
```

`@/` → `./src/`
