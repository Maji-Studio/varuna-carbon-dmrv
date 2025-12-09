/**
 * Test script for creating a GHG Statement via Isometric API
 *
 * Run with: pnpm tsx scripts/test-ghg-statement.ts
 *
 * Workflow:
 * 1. Get removal templates for the project
 * 2. Create a removal
 * 3. Create a GHG statement with the removal
 */

import 'dotenv/config';

const API_BASE = process.env.ISOMETRIC_ENVIRONMENT === 'production'
  ? 'https://api.isometric.com/mrv/v0'
  : 'https://api.sandbox.isometric.com/mrv/v0';

const PROJECT_ID = 'prj_1KBMJJGR41S0FZ33'; // Maji GmbH's Biochar Demo Project

const headers = {
  'Content-Type': 'application/json',
  'X-Client-Secret': process.env.ISOMETRIC_CLIENT_SECRET!,
  Authorization: `Bearer ${process.env.ISOMETRIC_ACCESS_TOKEN!}`,
};

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error (${res.status}): ${error}`);
  }

  return res.json();
}

async function main() {
  console.log('\n🧪 GHG Statement Test\n');
  console.log(`Environment: ${process.env.ISOMETRIC_ENVIRONMENT || 'sandbox'}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`API Base: ${API_BASE}\n`);

  // Step 1: Get removal templates
  console.log('--- Step 1: Get Removal Templates ---');
  try {
    const templates = await fetchApi<{
      nodes: Array<{
        id: string;
        name: string;
        description?: string;
      }>;
    }>(`/projects/${PROJECT_ID}/removal_templates`);

    console.log('Available templates:');
    templates.nodes.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (${t.id})`);
      if (t.description) console.log(`     ${t.description}`);
    });

    if (templates.nodes.length === 0) {
      console.log('\n⚠️  No removal templates found. You need to set up an LCA in Certify first.');
      console.log('   Visit: https://certify.isometric.com to configure your project.');
      return;
    }

    const templateId = templates.nodes[0].id;
    console.log(`\nUsing template: ${templates.nodes[0].name} (${templateId})`);

    // Step 2: Check existing removals
    console.log('\n--- Step 2: Check Existing Removals ---');
    const existingRemovals = await fetchApi<{
      nodes: Array<{
        id: string;
        supplier_reference_id: string;
        started_on: string;
        completed_on: string;
        co2e_net_removed_kg: number;
        ghg_statement_id: string | null;
      }>;
    }>(`/removals?project_id=${PROJECT_ID}`);

    console.log(`Found ${existingRemovals.nodes.length} existing removal(s)`);
    existingRemovals.nodes.forEach((r) => {
      console.log(`  - ${r.id} (ref: ${r.supplier_reference_id})`);
      console.log(`    Period: ${r.started_on} to ${r.completed_on}`);
      console.log(`    CO2e removed: ${r.co2e_net_removed_kg} kg`);
      console.log(`    GHG Statement: ${r.ghg_statement_id || 'None (draft)'}`);
    });

    // Step 3: Create a test removal
    console.log('\n--- Step 3: Create Test Removal ---');
    const testRefId = `test-removal-${Date.now()}`;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 1);

    const removalPayload = {
      project_id: PROJECT_ID,
      removal_template_id: templateId,
      supplier_reference_id: testRefId,
      started_on: startDate.toISOString().split('T')[0],
      completed_on: today.toISOString().split('T')[0],
      // Note: removal_template_components would contain the actual data
      // This depends on the template structure
    };

    console.log('Creating removal with payload:');
    console.log(JSON.stringify(removalPayload, null, 2));

    const removal = await fetchApi<{
      id: string;
      supplier_reference_id: string;
      co2e_net_removed_kg: number;
      ghg_statement_id: string | null;
    }>('/removals', {
      method: 'POST',
      body: JSON.stringify(removalPayload),
    });

    console.log('\n✅ Removal created:');
    console.log(`   ID: ${removal.id}`);
    console.log(`   Reference: ${removal.supplier_reference_id}`);
    console.log(`   CO2e removed: ${removal.co2e_net_removed_kg} kg`);

    // Step 4: Check existing GHG statements
    console.log('\n--- Step 4: Check Existing GHG Statements ---');
    const existingStatements = await fetchApi<{
      nodes: Array<{
        id: string;
        status: string;
        reporting_period_start: string;
        reporting_period_end: string;
      }>;
    }>(`/ghg_statements?project_id=${PROJECT_ID}`);

    console.log(`Found ${existingStatements.nodes.length} existing GHG statement(s)`);
    existingStatements.nodes.forEach((s) => {
      console.log(`  - ${s.id} (${s.status})`);
      console.log(`    Period: ${s.reporting_period_start} to ${s.reporting_period_end}`);
    });

    // Step 5: Create GHG Statement
    console.log('\n--- Step 5: Create GHG Statement ---');
    const statementPayload = {
      project_id: PROJECT_ID,
      end_on: today.toISOString().split('T')[0], // Only end_on is required
    };

    console.log('Creating GHG statement with payload:');
    console.log(JSON.stringify(statementPayload, null, 2));

    const statement = await fetchApi<{
      id: string;
      status: string;
      start_on: string;
      end_on: string;
    }>('/ghg_statements', {
      method: 'POST',
      body: JSON.stringify(statementPayload),
    });

    console.log('\n✅ GHG Statement created:');
    console.log(`   ID: ${statement.id}`);
    console.log(`   Status: ${statement.status}`);
    console.log(`   Period: ${statement.start_on} to ${statement.end_on}`);

    console.log('\n🎉 Test complete!');
    console.log('\nNext steps:');
    console.log('1. Add component data to the removal');
    console.log('2. Submit the GHG statement for verification');
    console.log(`3. View in Certify: https://certify.isometric.com/projects/${PROJECT_ID}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

main();
