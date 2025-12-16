/**
 * Database Seed Script
 * Dark Earth Carbon - Biochar DMRV System
 *
 * Seeds realistic test data following the chain of custody:
 * Feedstock → ProductionRun → BiocharProduct → Order → Delivery → Application → CreditBatch
 *
 * Includes Isometric Protocol v1.2 compliance data:
 * - Production Run Readings (time-series monitoring)
 * - Full biochar characterization (samples)
 * - Durability calculations (applications)
 * - Soil temperature measurements
 * - Transport legs (emissions tracking)
 *
 * Run with: pnpm db:seed
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// ============================================
// Seed Data
// ============================================

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ============================================
  // 0. Clear existing data (truncate all tables)
  // ============================================
  console.log('🗑️  Clearing existing data...');
  await db.execute(`
    TRUNCATE TABLE
      documentation,
      credit_batch_applications,
      lab_analyses,
      credit_batches,
      transport_legs,
      soil_temperature_measurements,
      applications,
      deliveries,
      orders,
      biochar_products,
      incident_reports,
      samples,
      production_run_readings,
      production_runs,
      feedstocks,
      feedstock_deliveries,
      formulations,
      feedstock_types,
      operators,
      drivers,
      customers,
      suppliers,
      vehicles,
      storage_locations,
      reactors,
      facilities,
      users
    CASCADE
  `);
  console.log('✅ Tables cleared\n');

  // ============================================
  // 1. Users
  // ============================================
  console.log('👤 Creating users...');
  const [user1] = await db
    .insert(schema.users)
    .values([
      { email: 'admin@darkearthcarbon.com', name: 'Admin User' },
      { email: 'operator@darkearthcarbon.com', name: 'John Operator' },
      { email: 'manager@darkearthcarbon.com', name: 'Sarah Manager' },
    ])
    .returning();

  // ============================================
  // 2. Facilities
  // ============================================
  console.log('🏭 Creating facilities...');
  const [mafingaFacility, iringaFacility] = await db
    .insert(schema.facilities)
    .values([
      {
        name: 'Mafinga',
        location: 'Mafinga, Iringa Region, Tanzania',
        gpsLat: -8.3548,
        gpsLng: 35.0822,
      },
      {
        name: 'Iringa Central',
        location: 'Iringa Town, Iringa Region, Tanzania',
        gpsLat: -7.77,
        gpsLng: 35.69,
      },
    ])
    .returning();

  // ============================================
  // 3. Reactors
  // ============================================
  console.log('⚙️ Creating reactors...');
  const [reactor1, reactor2, reactor3] = await db
    .insert(schema.reactors)
    .values([
      {
        code: 'R-001',
        facilityId: mafingaFacility.id,
        reactorType: 'fixed-bed',
        designSpecs: 'Batch pyrolysis reactor, 500kg capacity',
      },
      {
        code: 'R-002',
        facilityId: mafingaFacility.id,
        reactorType: 'auger',
        designSpecs: 'Continuous auger reactor, 100kg/hr throughput',
      },
      {
        code: 'R-003',
        facilityId: iringaFacility.id,
        reactorType: 'fixed-bed',
        designSpecs: 'Batch pyrolysis reactor, 300kg capacity',
      },
    ])
    .returning();

  // ============================================
  // 4. Storage Locations
  // ============================================
  console.log('📦 Creating storage locations...');
  const storageLocationsData = await db
    .insert(schema.storageLocations)
    .values([
      // Mafinga feedstock storage
      { name: 'Bin 1', type: 'feedstock_bin', facilityId: mafingaFacility.id },
      { name: 'Bin 2', type: 'feedstock_bin', facilityId: mafingaFacility.id },
      { name: 'Feedstock Pile 001', type: 'feedstock_pile', facilityId: mafingaFacility.id },
      { name: 'Feedstock Pile 002', type: 'feedstock_pile', facilityId: mafingaFacility.id },
      // Mafinga biochar storage
      { name: 'Biochar Pile 001', type: 'biochar_pile', facilityId: mafingaFacility.id },
      { name: 'Biochar Pile 002', type: 'biochar_pile', facilityId: mafingaFacility.id },
      // Mafinga product storage
      { name: 'Product Pile 001', type: 'product_pile', facilityId: mafingaFacility.id },
      { name: 'Product Pile 002', type: 'product_pile', facilityId: mafingaFacility.id },
      // Iringa storage
      { name: 'Bin 7', type: 'feedstock_bin', facilityId: iringaFacility.id },
      { name: 'Biochar Pile 003', type: 'biochar_pile', facilityId: iringaFacility.id },
      { name: 'Product Pile 003', type: 'product_pile', facilityId: iringaFacility.id },
    ])
    .returning();

  const feedstockBin1 = storageLocationsData[0];
  const feedstockBin2 = storageLocationsData[1];
  const feedstockPile1 = storageLocationsData[2];
  const feedstockPile2 = storageLocationsData[3];
  const biocharPile1 = storageLocationsData[4];
  const biocharPile2 = storageLocationsData[5];
  const productPile1 = storageLocationsData[6];
  const productPile2 = storageLocationsData[7];

  // ============================================
  // 4b. Vehicles
  // ============================================
  console.log('🚛 Creating vehicles...');
  const [truck1, truck2, truck3] = await db
    .insert(schema.vehicles)
    .values([
      {
        name: 'Truck 1',
        fuelType: 'Diesel',
        fuelConsumptionLPerKm: 0.30, // 0.30 L/km
      },
      {
        name: 'Truck 2',
        fuelType: 'Diesel',
        fuelConsumptionLPerKm: 0.28, // 0.28 L/km
      },
      {
        name: 'Truck 3',
        fuelType: 'Diesel',
        fuelConsumptionLPerKm: 0.32, // 0.32 L/km
      },
    ])
    .returning();

  // ============================================
  // 5. Suppliers
  // ============================================
  console.log('🌲 Creating suppliers...');
  const [supplier1, supplier2, supplier3] = await db
    .insert(schema.suppliers)
    .values([
      {
        name: 'Woody Allen',
        location: 'Mufindi District',
        gpsLat: -8.5,
        gpsLng: 35.3,
      },
      {
        name: 'Green Forest Co-op',
        location: 'Njombe Region',
        gpsLat: -9.33,
        gpsLng: 34.78,
      },
      {
        name: 'Highland Timber Ltd',
        location: 'Iringa Rural',
        gpsLat: -7.9,
        gpsLng: 35.5,
      },
    ])
    .returning();

  // ============================================
  // 6. Customers
  // ============================================
  console.log('👨‍🌾 Creating customers...');
  const [customer1, customer2, customer3] = await db
    .insert(schema.customers)
    .values([
      {
        name: 'Kanji Lalji',
        location: 'Mafinga',
        gpsLat: -9.01652,
        gpsLng: 32.88408,
        distanceKm: 167,
        cropType: 'Coffee',
      },
      {
        name: 'Mama Tuma Farm',
        location: 'Iringa Rural',
        gpsLat: -7.85,
        gpsLng: 35.75,
        distanceKm: 45,
        cropType: 'Maize',
      },
      {
        name: 'Kilolo Organic Growers',
        location: 'Kilolo District',
        gpsLat: -8.1,
        gpsLng: 36.1,
        distanceKm: 89,
        cropType: 'Vegetables',
      },
    ])
    .returning();

  // ============================================
  // 7. Drivers
  // ============================================
  console.log('🚛 Creating drivers...');
  const [driver1, driver2] = await db
    .insert(schema.drivers)
    .values([
      { name: 'Adam Driver', contact: '+255 736 536 700' },
      { name: 'Joseph Mwanga', contact: '+255 754 123 456' },
    ])
    .returning();

  // ============================================
  // 8. Operators
  // ============================================
  console.log('👷 Creating operators...');
  const [operator1, operator2] = await db
    .insert(schema.operators)
    .values([{ name: 'Smooth Operator' }, { name: 'James Pyro' }])
    .returning();

  // ============================================
  // 9. Feedstock Types
  // ============================================
  console.log('🌿 Creating feedstock types...');
  const [mixedWoodChips, hardwood, agriResidue] = await db
    .insert(schema.feedstockTypes)
    .values([
      { name: 'Mixed Wood Chips' },
      { name: 'Hardwood' },
      { name: 'Agricultural Residue' },
    ])
    .returning();

  // ============================================
  // 10. Formulations
  // ============================================
  console.log('📋 Creating formulations...');
  const [rawBiochar, bcf01, bcf02] = await db
    .insert(schema.formulations)
    .values([
      {
        code: 'RAW',
        name: 'Raw Biochar',
        biocharRatio: 100,
        compostRatio: 0,
      },
      {
        code: 'BCF-01',
        name: 'BCF-01 - Organic',
        biocharRatio: 70,
        compostRatio: 30,
      },
      {
        code: 'BCF-02',
        name: 'BCF-02 - Premium',
        biocharRatio: 50,
        compostRatio: 50,
      },
    ])
    .returning();

  // ============================================
  // 10b. Feedstock Deliveries (Incoming biomass shipments)
  // ============================================
  console.log('📦 Creating feedstock deliveries...');
  await db.insert(schema.feedstockDeliveries).values([
    // --- 3 INCOMPLETE ENTRIES (for testing data entry workflow) ---
    {
      code: 'FD-2025-001',
      facilityId: mafingaFacility.id,
      status: 'missing_data',
      deliveryDate: new Date('2025-01-15T10:00:00Z'),
      vehicleId: truck1.id,
      feedstockTypeId: mixedWoodChips.id,
      // Missing: supplier, driver, weight, moisture
    },
    {
      code: 'FD-2025-002',
      facilityId: mafingaFacility.id,
      status: 'missing_data',
      supplierId: supplier1.id,
      feedstockTypeId: hardwood.id,
      weightKg: 1500,
      // Missing: delivery date, driver, vehicle, moisture
    },
    {
      code: 'FD-2025-003',
      facilityId: mafingaFacility.id,
      status: 'missing_data',
      supplierId: supplier2.id,
      driverId: driver1.id,
      vehicleId: truck2.id,
      // Missing: delivery date, feedstock type, weight, moisture
    },
  ]);

  // ============================================
  // 11. Feedstocks (Chain of Custody Start)
  // ============================================
  // NOTE: All feedstocks commented out for testing - using feedstock deliveries only
  // console.log('📥 Creating feedstocks...');
  // const feedstocksData = await db
  //   .insert(schema.feedstocks)
  //   .values([
  //     // --- INCOMPLETE ENTRIES (for testing data entry workflow) ---
  //     {
  //       code: 'FS-2025-004',
  //       facilityId: mafingaFacility.id,
  //       date: '2025-01-25',
  //       status: 'missing_data',
  //       feedstockTypeId: mixedWoodChips.id,
  //       weightKg: 1200,
  //       storageLocationId: feedstockBin2.id,
  //       // Missing: supplier, driver, delivery info, moisture
  //     },
  //     {
  //       code: 'FS-2025-006',
  //       facilityId: mafingaFacility.id,
  //       date: '2025-02-05',
  //       status: 'missing_data',
  //       feedstockTypeId: hardwood.id,
  //       weightKg: 900,
  //       storageLocationId: feedstockBin1.id,
  //       // Missing: supplier, driver, delivery info, moisture
  //     },
  //     {
  //       code: 'FS-2025-007',
  //       facilityId: mafingaFacility.id,
  //       date: '2025-02-08',
  //       status: 'missing_data',
  //       supplierId: supplier1.id,
  //       feedstockTypeId: agriResidue.id,
  //       moisturePercent: 19.0,
  //       storageLocationId: feedstockPile1.id,
  //       // Missing: driver, delivery info, weight
  //     },
  //   ])
  //   .returning();

  // ============================================
  // 12. Production Runs
  // ============================================
  // NOTE: All production runs commented out for testing - only data entry forms with incomplete status
  // console.log('🔥 Creating production runs...');
  // const productionRunsData = await db
  //   .insert(schema.productionRuns)
  //   .values([
  //     {
  //       code: 'PR-2025-001',
  //       facilityId: mafingaFacility.id,
  //       date: '2025-01-16',
  //       status: 'complete',
  //       startTime: new Date('2025-01-16T06:00:00Z'),
  //       endTime: new Date('2025-01-16T14:00:00Z'),
  //       reactorId: reactor1.id,
  //       operatorId: operator1.id,
  //       feedstockMix: 'Mixed Wood Chips',
  //       feedstockStorageLocationId: feedstockBin1.id,
  //       feedstockAmountKg: 1500,
  //       feedingRateKgHr: 100,
  //       moistureBeforeDryingPercent: 18.5,
  //       moistureAfterDryingPercent: 8.0,
  //       biocharAmountKg: 390,
  //       yieldPercent: 26,
  //       biocharStorageLocationId: biocharPile1.id,
  //       pyrolysisTemperatureC: 550,
  //       residenceTimeMinutes: 45,
  //       dieselOperationLiters: 25,
  //       dieselGensetLiters: 15,
  //       preprocessingFuelLiters: 10,
  //       electricityKwh: 85,
  //       emissionsFromFossilsKg: 132,
  //       emissionsFromGridKg: 43,
  //       totalEmissionsKg: 175,
  //       quenchingDryWeightKg: 350,
  //       quenchingWetWeightKg: 420,
  //     },
  //     {
  //       code: 'PR-2025-002',
  //       facilityId: mafingaFacility.id,
  //       date: '2025-01-19',
  //       status: 'complete',
  //       startTime: new Date('2025-01-19T05:30:00Z'),
  //       endTime: new Date('2025-01-19T16:00:00Z'),
  //       reactorId: reactor2.id,
  //       operatorId: operator2.id,
  //       feedstockMix: 'Hardwood',
  //       feedstockStorageLocationId: feedstockPile1.id,
  //       feedstockAmountKg: 2200,
  //       feedingRateKgHr: 120,
  //       moistureBeforeDryingPercent: 22.0,
  //       moistureAfterDryingPercent: 10.0,
  //       biocharAmountKg: 528,
  //       yieldPercent: 24,
  //       biocharStorageLocationId: biocharPile2.id,
  //       pyrolysisTemperatureC: 580,
  //       residenceTimeMinutes: 50,
  //       dieselOperationLiters: 35,
  //       dieselGensetLiters: 20,
  //       preprocessingFuelLiters: 15,
  //       electricityKwh: 120,
  //       emissionsFromFossilsKg: 185,
  //       emissionsFromGridKg: 60,
  //       totalEmissionsKg: 245,
  //       quenchingDryWeightKg: 475,
  //       quenchingWetWeightKg: 570,
  //     },
  //     {
  //       code: 'PR-2025-003',
  //       facilityId: mafingaFacility.id,
  //       date: '2025-01-21',
  //       status: 'complete',
  //       startTime: new Date('2025-01-21T06:00:00Z'),
  //       endTime: new Date('2025-01-21T12:00:00Z'),
  //       reactorId: reactor1.id,
  //       operatorId: operator1.id,
  //       feedstockMix: 'Agricultural Residue',
  //       feedstockStorageLocationId: feedstockPile2.id,
  //       feedstockAmountKg: 800,
  //       feedingRateKgHr: 80,
  //       moistureBeforeDryingPercent: 25.0,
  //       moistureAfterDryingPercent: 12.0,
  //       biocharAmountKg: 168,
  //       yieldPercent: 21,
  //       biocharStorageLocationId: biocharPile1.id,
  //       pyrolysisTemperatureC: 520,
  //       residenceTimeMinutes: 40,
  //       dieselOperationLiters: 18,
  //       dieselGensetLiters: 10,
  //       preprocessingFuelLiters: 8,
  //       electricityKwh: 55,
  //       emissionsFromFossilsKg: 95,
  //       emissionsFromGridKg: 28,
  //       totalEmissionsKg: 123,
  //     },
  //     {
  //       code: 'PR-2025-004',
  //       facilityId: mafingaFacility.id,
  //       date: '2025-02-02',
  //       status: 'running',
  //       startTime: new Date('2025-02-02T06:00:00Z'),
  //       reactorId: reactor1.id,
  //       operatorId: operator1.id,
  //       feedstockMix: 'Hardwood',
  //       feedstockStorageLocationId: feedstockPile1.id,
  //       feedstockAmountKg: 1800,
  //       feedingRateKgHr: 100,
  //       pyrolysisTemperatureC: 560,
  //     },
  //   ])
  //   .returning();

  // const pr1 = productionRunsData[0];
  // const pr2 = productionRunsData[1];
  // const pr3 = productionRunsData[2];
  // const pr4 = productionRunsData[3];

  // ============================================
  // 13. Production Run Readings (Time-Series Monitoring)
  // Isometric Protocol: Appendix II - 5-min temp, 1-min pressure/emissions
  // ============================================
  // NOTE: Commented out - no production runs to reference
  // console.log('📊 Creating production run readings (time-series monitoring)...');
  // (Production run readings code commented out)

  // ============================================
  // SECTIONS 14-25 COMMENTED OUT
  // All dependent data (samples, incident reports, biochar products, orders,
  // deliveries, applications, soil temp, transport legs, credit batches,
  // lab analyses, credit batch applications, documentation) has been
  // commented out since there are no production runs to reference.
  // ============================================

  console.log('\n✅ Database seeded successfully!');
  console.log('\nSummary (Minimal Seed - Data Entry Testing):');
  console.log('- 3 users');
  console.log('- 2 facilities');
  console.log('- 3 reactors');
  console.log('- 11 storage locations');
  console.log('- 3 vehicles');
  console.log('- 3 suppliers');
  console.log('- 3 customers');
  console.log('- 2 drivers');
  console.log('- 2 operators');
  console.log('- 3 feedstock types');
  console.log('- 3 formulations');
  console.log('- 3 feedstock deliveries (all incomplete - for data entry testing)');
  console.log('');
  console.log('Data Entry Forms: 3 incomplete, 0 complete');

  await pool.end();
}

// Run seed
seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
