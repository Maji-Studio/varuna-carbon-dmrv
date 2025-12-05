/**
 * Test script for Isometric API connection
 *
 * Run with: pnpm tsx scripts/test-isometric.ts
 *
 * Make sure you have these env vars set:
 * - ISOMETRIC_CLIENT_SECRET
 * - ISOMETRIC_ACCESS_TOKEN
 * - ISOMETRIC_ENVIRONMENT (sandbox or production)
 */

import 'dotenv/config';

const API_BASE_URLS = {
  registry: {
    sandbox: 'https://api.sandbox.isometric.com/registry/v0',
    production: 'https://api.isometric.com/registry/v0',
  },
  certify: {
    sandbox: 'https://api.sandbox.isometric.com/mrv/v0',
    production: 'https://api.isometric.com/mrv/v0',
  },
} as const;

async function testIsometricApi() {
  const clientSecret = process.env.ISOMETRIC_CLIENT_SECRET;
  const accessToken = process.env.ISOMETRIC_ACCESS_TOKEN;
  const environment = (process.env.ISOMETRIC_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  console.log('\n🔍 Isometric API Test\n');
  console.log(`Environment: ${environment}`);
  console.log(`Client Secret: ${clientSecret ? '✓ Set' : '✗ Missing'}`);
  console.log(`Access Token: ${accessToken ? '✓ Set' : '✗ Missing'}`);

  if (!clientSecret || !accessToken) {
    console.error('\n❌ Missing credentials. Set ISOMETRIC_CLIENT_SECRET and ISOMETRIC_ACCESS_TOKEN in .env');
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Secret': clientSecret,
    Authorization: `Bearer ${accessToken}`,
  };

  // Test 1: Get Organisation (Registry API)
  console.log('\n--- Test 1: Get Organisation (Registry API) ---');
  try {
    const orgRes = await fetch(`${API_BASE_URLS.registry[environment]}/organisation`, { headers });
    if (!orgRes.ok) {
      const error = await orgRes.text();
      console.error(`❌ Failed (${orgRes.status}):`, error);
    } else {
      const org = await orgRes.json();
      console.log('✓ Organisation:', JSON.stringify(org, null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }

  // Test 2: Get Supplier (Registry API)
  console.log('\n--- Test 2: Get Supplier (Registry API) ---');
  try {
    const supplierRes = await fetch(`${API_BASE_URLS.registry[environment]}/supplier`, { headers });
    if (!supplierRes.ok) {
      const error = await supplierRes.text();
      console.error(`❌ Failed (${supplierRes.status}):`, error);
    } else {
      const supplier = await supplierRes.json();
      console.log('✓ Supplier:', JSON.stringify(supplier, null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }

  // Test 3: List Projects (Registry API)
  console.log('\n--- Test 3: List Projects (Registry API) ---');
  try {
    const projectsRes = await fetch(`${API_BASE_URLS.registry[environment]}/projects`, { headers });
    if (!projectsRes.ok) {
      const error = await projectsRes.text();
      console.error(`❌ Failed (${projectsRes.status}):`, error);
    } else {
      const projects = await projectsRes.json();
      console.log('✓ Projects:', JSON.stringify(projects, null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }

  // Test 4: Get Organisation (Certify/MRV API)
  console.log('\n--- Test 4: Get Organisation (Certify/MRV API) ---');
  try {
    const certifyOrgRes = await fetch(`${API_BASE_URLS.certify[environment]}/organisation`, { headers });
    if (!certifyOrgRes.ok) {
      const error = await certifyOrgRes.text();
      console.error(`❌ Failed (${certifyOrgRes.status}):`, error);
    } else {
      const certifyOrg = await certifyOrgRes.json();
      console.log('✓ Certify Organisation:', JSON.stringify(certifyOrg, null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }

  // Test 5: List Projects (Certify/MRV API)
  console.log('\n--- Test 5: List Projects (Certify/MRV API) ---');
  try {
    const certifyProjectsRes = await fetch(`${API_BASE_URLS.certify[environment]}/projects`, { headers });
    if (!certifyProjectsRes.ok) {
      const error = await certifyProjectsRes.text();
      console.error(`❌ Failed (${certifyProjectsRes.status}):`, error);
    } else {
      const certifyProjects = await certifyProjectsRes.json();
      console.log('✓ Certify Projects:', JSON.stringify(certifyProjects, null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }

  console.log('\n✅ Test complete!\n');
}

testIsometricApi();
