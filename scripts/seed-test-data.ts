/**
 * Seed Test Data for Isometric Integration
 *
 * Creates a complete chain of custody for one end-to-end verification:
 * Facility → FeedstockType → ProductionRun → Sample → BiocharProduct → Delivery → Application → CreditBatch
 *
 * Production runs are traced via FK chain: CreditBatch → Application → Delivery → BiocharProduct → ProductionRun
 *
 * Run with: pnpm tsx scripts/seed-test-data.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, like } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seedTestData() {
  console.log('\n🌱 Seeding Test Data for Isometric Integration\n');

  try {
    // ============================================
    // Clean up existing test data
    // ============================================
    console.log('Cleaning up existing test data...');

    // Delete in reverse order of dependencies
    await db.delete(schema.creditBatchApplications);
    await db.delete(schema.creditBatches).where(like(schema.creditBatches.code, 'CB-TEST-%'));
    await db.delete(schema.applications).where(like(schema.applications.code, 'AP-TEST-%'));
    await db.delete(schema.deliveries).where(like(schema.deliveries.code, 'DL-TEST-%'));
    await db.delete(schema.biocharProducts).where(like(schema.biocharProducts.code, 'BP-TEST-%'));
    await db.delete(schema.samples);
    await db.delete(schema.productionRuns).where(like(schema.productionRuns.code, 'PR-TEST-%'));
    // Note: Don't delete feedstock_types since they may be referenced by real feedstocks
    await db.delete(schema.facilities).where(eq(schema.facilities.name, 'Maji Test Facility - Arusha'));

    console.log('  ✓ Cleaned up existing test data\n');

    // ============================================
    // 1. Facility (Production Site)
    // ============================================
    console.log('Creating facility...');
    const [facility] = await db
      .insert(schema.facilities)
      .values({
        name: 'Maji Test Facility - Arusha',
        location: 'Arusha, Tanzania',
        gpsLat: -3.3869,
        gpsLng: 36.6828,
      })
      .returning();
    console.log(`  ✓ Facility: ${facility.name} (${facility.id})`);

    // ============================================
    // 2. Feedstock Type (get or create)
    // ============================================
    console.log('Getting/creating feedstock type...');
    let feedstockType = await db.query.feedstockTypes.findFirst({
      where: eq(schema.feedstockTypes.name, 'Mixed Wood Chips'),
    });
    if (!feedstockType) {
      [feedstockType] = await db
        .insert(schema.feedstockTypes)
        .values({
          name: 'Mixed Wood Chips', // Should match Isometric feedstock type name
        })
        .returning();
    }
    console.log(`  ✓ Feedstock Type: ${feedstockType.name} (${feedstockType.id})`);

    // ============================================
    // 3. Production Run with Pyrolysis Data
    // ============================================
    console.log('Creating production run...');
    const startTime = new Date('2025-01-01T08:00:00Z');
    const endTime = new Date('2025-01-01T16:00:00Z');

    const [productionRun] = await db
      .insert(schema.productionRuns)
      .values({
        code: 'PR-TEST-001',
        facilityId: facility.id,
        date: '2025-01-01',
        status: 'complete',
        startTime,
        endTime,

        // Feedstock input
        feedstockMix: 'Mixed Wood Chips',
        feedstockAmountKg: 1000,
        moistureBeforeDryingPercent: 25,
        moistureAfterDryingPercent: 10,

        // Biochar output
        biocharAmountKg: 300, // ~30% yield typical for biochar
        yieldPercent: 30,

        // Processing parameters (Isometric Protocol Section 9)
        pyrolysisTemperatureC: 550, // Must be 350-900°C
        residenceTimeMinutes: 30,

        // Energy accounting
        dieselOperationLiters: 15,
        electricityKwh: 50,

        // Emissions (calculated)
        emissionsFromFossilsKg: 40, // Diesel: ~2.68 kg CO2/liter
        emissionsFromGridKg: 25, // Tanzania grid: ~0.5 kg CO2/kWh
        totalEmissionsKg: 65,
      })
      .returning();
    console.log(`  ✓ Production Run: ${productionRun.code} (${productionRun.id})`);

    // ============================================
    // 4. Sample with Biochar Characterization
    // (Isometric Protocol: Table 2 requirements)
    // ============================================
    console.log('Creating sample with biochar characterization...');
    const [sample] = await db
      .insert(schema.samples)
      .values({
        productionRunId: productionRun.id,
        samplingTime: new Date('2025-01-01T17:00:00Z'),

        // Sample details
        weightG: 250,
        temperatureC: 25,

        // Carbon Measurements (Isometric: Required)
        totalCarbonPercent: 78.5,
        inorganicCarbonPercent: 3.3,
        organicCarbonPercent: 75.2, // Calculated: Total - Inorganic

        // Elemental Analysis (Isometric: Required)
        hydrogenContentPercent: 2.1,
        oxygenContentPercent: 8.5,
        nitrogenPercent: 0.8,
        sulfurPercent: 0.1,

        // Stability Ratios (CRITICAL for Isometric eligibility)
        hCorgMolarRatio: 0.35, // Must be < 0.5 for 200-year durability
        oCorgMolarRatio: 0.15, // Must be < 0.2 for 200-year durability

        // Proximate Analysis
        moisturePercent: 3.2,
        ashPercent: 12.5,
        volatileMatterPercent: 8.3,
        fixedCarbonPercent: 76.0,

        // Physical Properties
        ph: 9.5,
        saltContentGPerKg: 2.1,
        bulkDensityKgPerM3: 280,
        waterHoldingCapacityPercent: 150,

        // Heavy Metals (Isometric: Required with thresholds)
        leadMgPerKg: 5, // Threshold: ≤300
        cadmiumMgPerKg: 0.3, // Threshold: ≤5
        copperMgPerKg: 25, // Threshold: ≤200
        nickelMgPerKg: 15, // Threshold: ≤100
        mercuryMgPerKg: 0.05, // Threshold: ≤2
        zincMgPerKg: 80, // Threshold: ≤1000
        chromiumMgPerKg: 20, // Threshold: ≤200
        arsenicMgPerKg: 2, // Threshold: ≤20

        // Contaminants (Isometric: Required)
        pahsEfsa8MgPerKg: 0.3, // Threshold: ≤1
        pahsEpa16MgPerKg: 2.5, // Declaration only
        pcddFNgPerKg: 5, // Threshold: ≤20
        pcbMgPerKg: 0.05, // Threshold: ≤0.2

        // Nutrients (Isometric: Required declaration)
        phosphorusGPerKg: 1.2,
        potassiumGPerKg: 15.5,
        magnesiumGPerKg: 3.2,
        calciumGPerKg: 25.0,
        ironGPerKg: 2.8,

        // Lab info
        labName: 'Tanzania Standards Bureau',
        labAccreditationNumber: 'TSB-ISO17025-2024',
        analysisMethod: 'ISO 29541 / ASTM D5373',
      })
      .returning();
    console.log(`  ✓ Sample: ${sample.id}`);
    console.log(`    Carbon: ${sample.organicCarbonPercent}% Corg`);
    console.log(`    H:Corg ratio: ${sample.hCorgMolarRatio} (must be <0.5)`);
    console.log(`    O:Corg ratio: ${sample.oCorgMolarRatio} (must be <0.2)`);

    // ============================================
    // 5. Biochar Product (links to Production Run)
    // ============================================
    console.log('Creating biochar product...');
    const [biocharProduct] = await db
      .insert(schema.biocharProducts)
      .values({
        code: 'BP-TEST-001',
        facilityId: facility.id,
        productionDate: new Date('2025-01-01T17:00:00Z'),
        status: 'ready',
        linkedProductionRunId: productionRun.id, // Links to production run
        biocharAmountKg: 300,
        totalWeightKg: 300,
      })
      .returning();
    console.log(`  ✓ Biochar Product: ${biocharProduct.code} (${biocharProduct.id})`);
    console.log(`    Linked to: ${productionRun.code}`);

    // ============================================
    // 6. Delivery (links to Biochar Product)
    // ============================================
    console.log('Creating delivery...');
    const [delivery] = await db
      .insert(schema.deliveries)
      .values({
        code: 'DL-TEST-001',
        facilityId: facility.id,
        deliveryDate: new Date('2025-01-14T08:00:00Z'),
        status: 'delivered',
        biocharProductId: biocharProduct.id, // Links to biochar product
        quantityTons: 0.3,
        biocharTons: 0.3,
        distanceKm: 25,
        vehicleType: 'Truck',
        fuelType: 'Diesel',
        fuelConsumedLiters: 10,
        emissionsTco2e: 0.027, // ~2.68 kg CO2/liter * 10 liters
      })
      .returning();
    console.log(`  ✓ Delivery: ${delivery.code} (${delivery.id})`);
    console.log(`    Linked to: ${biocharProduct.code}`);

    // ============================================
    // 7. Application (links to Delivery)
    // ============================================
    console.log('Creating application...');
    const [application] = await db
      .insert(schema.applications)
      .values({
        code: 'AP-TEST-001',
        facilityId: facility.id,
        applicationDate: new Date('2025-01-15T10:00:00Z'),
        status: 'applied',
        deliveryId: delivery.id, // Links to delivery (completes FK chain)

        // Biochar applied
        biocharAppliedTons: 0.3, // 300kg from production run
        biocharDryMatterTons: 0.29,
        totalAppliedTons: 0.3,

        // GPS location (required by Isometric)
        gpsLat: -3.4,
        gpsLng: 36.7,

        // Field details
        fieldSizeHa: 1.0,
        applicationMethodType: 'mechanical',
        fieldIdentifier: 'Test Field Alpha',

        // Truck weighing (for Isometric BiocharApplication)
        truckMassOnArrivalKg: 5300,
        truckMassOnDepartureKg: 5000,

        // CO2e calculation result
        // Formula: mass * carbon_content * 3.67 (CO2/C ratio) * F_durable
        // 300kg * 0.752 * 3.67 * 0.8 ≈ 662 kg CO2e
        co2eStoredTonnes: 0.662,
      })
      .returning();
    console.log(`  ✓ Application: ${application.code} (${application.id})`);
    console.log(`    Location: ${application.gpsLat}, ${application.gpsLng}`);
    console.log(`    Biochar: ${application.biocharAppliedTons} tonnes`);
    console.log(`    Linked to: ${delivery.code}`);

    // ============================================
    // 8. Credit Batch (Verification Submission)
    // ============================================
    console.log('Creating credit batch...');
    const [creditBatch] = await db
      .insert(schema.creditBatches)
      .values({
        code: 'CB-TEST-001',
        facilityId: facility.id,
        // Production runs are traced via FK chain: CreditBatch → Application → Delivery → BiocharProduct → ProductionRun
        date: '2025-01-31',
        status: 'pending',

        // Reporting period
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),

        // Certifier
        certifier: 'Isometric',
        registry: 'Isometric',

        // Credit details
        batchesCount: 1,
        weightTons: 0.3,
        creditsTco2e: 0.662,

        // Buffer pool (Isometric: 2-20% based on risk)
        bufferPoolPercent: 5,

        // Durability calculation (200-year option)
        durabilityOptionType: '200_year',
        soilTemperatureC: 22.5, // Annual average for Arusha region
        soilTemperatureSource: 'baseline',
        fDurableCalculated: 0.8, // Calculated from H:Corg + soil temp
      })
      .returning();
    console.log(`  ✓ Credit Batch: ${creditBatch.code} (${creditBatch.id})`);
    console.log(`    Credits: ${creditBatch.creditsTco2e} tCO2e`);
    console.log(`    Durability: ${creditBatch.durabilityOptionType}`);

    // ============================================
    // 9. Link Credit Batch to Application
    // (Production run is traced via FK chain: Application → Delivery → BiocharProduct → ProductionRun)
    // ============================================
    console.log('Linking credit batch to application...');
    await db.insert(schema.creditBatchApplications).values({
      creditBatchId: creditBatch.id,
      applicationId: application.id,
    });
    console.log(`  ✓ Linked CB-TEST-001 → AP-TEST-001`);
    console.log(`    FK chain: AP-TEST-001 → DL-TEST-001 → BP-TEST-001 → PR-TEST-001`);

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '═'.repeat(50));
    console.log('✅ Test Data Seeded Successfully!');
    console.log('═'.repeat(50));
    console.log('\nChain of Custody (FK traversal):');
    console.log(`  Credit Batch:     ${creditBatch.id} (CB-TEST-001)`);
    console.log(`    ↓`);
    console.log(`  Application:      ${application.id} (AP-TEST-001)`);
    console.log(`    ↓`);
    console.log(`  Delivery:         ${delivery.id} (DL-TEST-001)`);
    console.log(`    ↓`);
    console.log(`  Biochar Product:  ${biocharProduct.id} (BP-TEST-001)`);
    console.log(`    ↓`);
    console.log(`  Production Run:   ${productionRun.id} (PR-TEST-001)`);
    console.log(`    ↓`);
    console.log(`  Sample:           ${sample.id}`);
    console.log(`\nOther entities:`);
    console.log(`  Facility:         ${facility.id}`);
    console.log(`  Feedstock Type:   ${feedstockType.id}`);

    console.log('\nNext Steps:');
    console.log('  1. Run pullFeedstockTypes() to match feedstock types');
    console.log('  2. Run syncCreditBatch(creditBatchId) to submit to Isometric');
    console.log('  3. Check Certify UI: https://certify.isometric.com\n');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedTestData();
