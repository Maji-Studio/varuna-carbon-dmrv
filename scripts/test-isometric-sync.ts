/**
 * Test Isometric End-to-End Sync
 *
 * This script tests the complete flow:
 * 1. Seeds test data (if not exists)
 * 2. Syncs credit batch to Isometric
 * 3. Verifies the removal was created with component data
 *
 * Prerequisites:
 * - Database running and migrated
 * - .env file with Isometric credentials:
 *   - ISOMETRIC_PROJECT_ID=prj_1KBMJJGR41S0FZ33
 *   - ISOMETRIC_REMOVAL_TEMPLATE_ID=rvt_1KBMJJGR41S0YJHQ
 *
 * Run with: pnpm tsx scripts/test-isometric-sync.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { syncCreditBatch } from '../src/lib/adapters/isometric/adapter';
import { isometric } from '../src/lib/isometric/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log('\n========================================');
  console.log('     Isometric End-to-End Sync Test');
  console.log('========================================\n');

  // Check environment
  console.log('Configuration:');
  console.log(`  Environment: ${process.env.ISOMETRIC_ENVIRONMENT || 'sandbox'}`);
  console.log(`  Project ID: ${process.env.ISOMETRIC_PROJECT_ID || '(not set)'}`);
  console.log(`  Template ID: ${process.env.ISOMETRIC_REMOVAL_TEMPLATE_ID || '(not set)'}`);
  console.log();

  if (!process.env.ISOMETRIC_PROJECT_ID || !process.env.ISOMETRIC_REMOVAL_TEMPLATE_ID) {
    console.error('Please set ISOMETRIC_PROJECT_ID and ISOMETRIC_REMOVAL_TEMPLATE_ID in .env');
    process.exit(1);
  }

  try {
    // Step 1: Find or require test credit batch
    console.log('Step 1: Finding test credit batch...');
    const creditBatch = await db.query.creditBatches.findFirst({
      where: (cb, { eq }) => eq(cb.code, 'CB-TEST-001'),
    });

    if (!creditBatch) {
      console.log('  Credit batch CB-TEST-001 not found.');
      console.log('  Please run: pnpm tsx scripts/seed-test-data.ts');
      process.exit(1);
    }

    console.log(`  Found: ${creditBatch.code} (${creditBatch.id})`);
    console.log(`  Status: ${creditBatch.status}`);
    console.log(`  Isometric Removal ID: ${creditBatch.isometricRemovalId || '(not synced)'}`);
    console.log(`  Isometric GHG Statement ID: ${creditBatch.isometricGhgStatementId || '(not synced)'}`);
    console.log();

    // Step 2: Test API connection
    console.log('Step 2: Testing Isometric API connection...');
    const org = await isometric.getCertifyOrganisation();
    console.log(`  Connected as: ${org.name} (${org.id})`);
    console.log();

    // Step 3: Verify template exists
    console.log('Step 3: Verifying removal template...');
    const template = await isometric.getRemovalTemplate(
      process.env.ISOMETRIC_PROJECT_ID!,
      process.env.ISOMETRIC_REMOVAL_TEMPLATE_ID!
    );
    console.log(`  Template: ${template.display_name}`);
    console.log(`  Groups: ${template.groups.length}`);

    let totalComponents = 0;
    for (const group of template.groups) {
      totalComponents += group.components.length;
    }
    console.log(`  Total Components: ${totalComponents}`);
    console.log();

    // Step 4: Sync credit batch
    if (creditBatch.isometricGhgStatementId) {
      console.log('Step 4: Credit batch already synced!');
      console.log(`  GHG Statement: ${creditBatch.isometricGhgStatementId}`);
    } else {
      console.log('Step 4: Syncing credit batch to Isometric...');
      console.log('  This will create:');
      console.log('    - A Removal with component data (CO2 calculation inputs)');
      console.log('    - A GHG Statement for verification');
      console.log();

      const result = await syncCreditBatch(creditBatch.id);

      if (result.success) {
        console.log('  Sync successful!');
        console.log(`  GHG Statement ID: ${result.isometricId}`);

        // Fetch the updated credit batch
        const updated = await db.query.creditBatches.findFirst({
          where: (cb, { eq }) => eq(cb.id, creditBatch.id),
        });

        if (updated) {
          console.log(`  Removal ID: ${updated.isometricRemovalId}`);
        }
      } else {
        console.error('  Sync failed:', result.error);
        process.exit(1);
      }
    }
    console.log();

    // Step 5: Verify in Isometric
    console.log('Step 5: Verification');
    console.log('  Check the Certify UI to see your removal:');
    console.log(`  https://certify.isometric.com/projects/${process.env.ISOMETRIC_PROJECT_ID}/removals`);
    console.log();

    console.log('========================================');
    console.log('          Test Complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
