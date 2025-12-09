/**
 * Inspect Isometric Demo Project
 *
 * Run with: pnpm tsx scripts/inspect-isometric.ts
 *
 * Fetches:
 * 1. Removal templates - to understand what inputs are needed
 * 2. Feedstock types - to match with local names
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

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error (${res.status}): ${error}`);
  }

  return res.json();
}

async function main() {
  console.log('\n🔍 Inspecting Isometric Demo Project\n');
  console.log(`Environment: ${process.env.ISOMETRIC_ENVIRONMENT || 'sandbox'}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`API Base: ${API_BASE}\n`);

  // 1. Get Removal Templates
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 REMOVAL TEMPLATES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const templates = await fetchApi<{
      nodes: Array<{
        id: string;
        name: string;
        description?: string;
        components?: Array<{
          id: string;
          name: string;
          blueprint_key: string;
          inputs?: Array<{
            key: string;
            name: string;
            unit?: string;
            description?: string;
          }>;
        }>;
      }>;
    }>(`/projects/${PROJECT_ID}/removal_templates`);

    if (templates.nodes.length === 0) {
      console.log('⚠️  No removal templates found.\n');
    } else {
      for (const template of templates.nodes) {
        console.log(`Template: ${template.name}`);
        console.log(`  ID: ${template.id}`);
        if (template.description) {
          console.log(`  Description: ${template.description}`);
        }
        console.log();

        // Get detailed template info
        const detail = await fetchApi<{
          id: string;
          name: string;
          removal_template_component_groups: Array<{
            id: string;
            name: string;
            description?: string;
            removal_template_components: Array<{
              id: string;
              name: string;
              blueprint_key: string;
              description?: string;
              inputs: Array<{
                key: string;
                name: string;
                unit?: string;
                description?: string;
                required?: boolean;
              }>;
            }>;
          }>;
          components?: Array<{
            id: string;
            name: string;
            blueprint_key: string;
            description?: string;
            inputs: Array<{
              key: string;
              name: string;
              unit?: string;
              description?: string;
              required?: boolean;
            }>;
          }>;
        }>(`/projects/${PROJECT_ID}/removal_templates/${template.id}`);

        // Print full JSON for analysis
        console.log('  Full template structure:');
        console.log(JSON.stringify(detail, null, 2));

        // Try component groups structure
        if (detail.removal_template_component_groups && detail.removal_template_component_groups.length > 0) {
          console.log(`\n  Component Groups (${detail.removal_template_component_groups.length}):`);
          for (const group of detail.removal_template_component_groups) {
            console.log(`\n  📁 GROUP: ${group.name}`);
            console.log(`     ID: ${group.id}`);

            for (const comp of group.removal_template_components || []) {
              console.log(`\n    📦 ${comp.name}`);
              console.log(`       ID: ${comp.id}`);
              console.log(`       Blueprint: ${comp.blueprint_key}`);
              if (comp.description) {
                console.log(`       Description: ${comp.description}`);
              }

              if (comp.inputs && comp.inputs.length > 0) {
                console.log(`       Inputs:`);
                for (const input of comp.inputs) {
                  const required = input.required ? ' (REQUIRED)' : '';
                  const unit = input.unit ? ` [${input.unit}]` : '';
                  console.log(`         - ${input.key}: ${input.name}${unit}${required}`);
                }
              }
            }
          }
        }

        // Fallback to flat components
        if (detail.components && detail.components.length > 0) {
          console.log(`\n  Components (flat) (${detail.components.length}):`);
          for (const comp of detail.components) {
            console.log(`\n    📦 ${comp.name}`);
            console.log(`       ID: ${comp.id}`);
            console.log(`       Blueprint: ${comp.blueprint_key}`);

            if (comp.inputs && comp.inputs.length > 0) {
              console.log(`       Inputs:`);
              for (const input of comp.inputs) {
                const required = input.required ? ' (REQUIRED)' : '';
                const unit = input.unit ? ` [${input.unit}]` : '';
                console.log(`         - ${input.key}: ${input.name}${unit}${required}`);
              }
            }
          }
        }
        console.log();
      }
    }
  } catch (err) {
    console.error('❌ Error fetching templates:', err);
  }

  // 2. Get Feedstock Types
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌿 FEEDSTOCK TYPES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const feedstockTypes = await fetchApi<{
      nodes: Array<{
        id: string;
        name: string;
        supplier_reference_id?: string;
        description?: string;
      }>;
    }>('/feedstock_types');

    if (feedstockTypes.nodes.length === 0) {
      console.log('⚠️  No feedstock types found.\n');
      console.log('   You need to create feedstock types in the Certify UI first.');
      console.log('   Visit: https://certify.isometric.com\n');
    } else {
      console.log(`Found ${feedstockTypes.nodes.length} feedstock type(s):\n`);
      for (const ft of feedstockTypes.nodes) {
        console.log(`  🌿 ${ft.name}`);
        console.log(`     ID: ${ft.id}`);
        if (ft.supplier_reference_id) {
          console.log(`     Reference: ${ft.supplier_reference_id}`);
        }
        if (ft.description) {
          console.log(`     Description: ${ft.description}`);
        }
        console.log();
      }
    }
  } catch (err) {
    console.error('❌ Error fetching feedstock types:', err);
  }

  // 3. Get Component Blueprints (available building blocks)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧩 COMPONENT BLUEPRINTS (first 10)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const blueprints = await fetchApi<{
      nodes: Array<{
        key: string;
        name: string;
        description?: string;
      }>;
    }>('/component_blueprints?first=10');

    for (const bp of blueprints.nodes) {
      console.log(`  🧩 ${bp.name}`);
      console.log(`     Key: ${bp.key}`);
      if (bp.description) {
        console.log(`     ${bp.description}`);
      }
      console.log();
    }
  } catch (err) {
    console.error('❌ Error fetching blueprints:', err);
  }

  console.log('\n✅ Inspection complete!\n');
}

main();
