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
      formulations,
      feedstock_types,
      operators,
      drivers,
      customers,
      suppliers,
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
  // 11. Feedstocks (Chain of Custody Start)
  // ============================================
  console.log('📥 Creating feedstocks...');
  const feedstocksData = await db
    .insert(schema.feedstocks)
    .values([
      {
        code: 'FS-2025-001',
        facilityId: mafingaFacility.id,
        date: '2025-01-15',
        status: 'complete',
        collectionDate: new Date('2025-01-14T08:00:00Z'),
        deliveryDate: new Date('2025-01-15T14:00:00Z'),
        supplierId: supplier1.id,
        driverId: driver1.id,
        vehicleType: 'Truck',
        fuelType: 'Diesel',
        fuelConsumedLiters: 30,
        transportEmissionsTco2e: 0.079,
        feedstockTypeId: mixedWoodChips.id,
        weightKg: 1500,
        moisturePercent: 18.5,
        storageLocationId: feedstockBin1.id,
      },
      {
        code: 'FS-2025-002',
        facilityId: mafingaFacility.id,
        date: '2025-01-18',
        status: 'complete',
        collectionDate: new Date('2025-01-17T07:30:00Z'),
        deliveryDate: new Date('2025-01-18T12:00:00Z'),
        supplierId: supplier2.id,
        driverId: driver2.id,
        vehicleType: 'Truck',
        fuelType: 'Diesel',
        fuelConsumedLiters: 45,
        transportEmissionsTco2e: 0.118,
        feedstockTypeId: hardwood.id,
        weightKg: 2200,
        moisturePercent: 22.0,
        storageLocationId: feedstockPile1.id,
      },
      {
        code: 'FS-2025-003',
        facilityId: mafingaFacility.id,
        date: '2025-01-20',
        status: 'complete',
        supplierId: supplier3.id,
        driverId: driver1.id,
        feedstockTypeId: agriResidue.id,
        weightKg: 800,
        moisturePercent: 25.0,
        storageLocationId: feedstockPile2.id,
      },
      {
        code: 'FS-2025-004',
        facilityId: mafingaFacility.id,
        date: '2025-01-25',
        status: 'missing_data',
        feedstockTypeId: mixedWoodChips.id,
        weightKg: 1200,
        storageLocationId: feedstockBin2.id,
      },
      {
        code: 'FS-2025-005',
        facilityId: mafingaFacility.id,
        date: '2025-02-01',
        status: 'complete',
        supplierId: supplier1.id,
        driverId: driver2.id,
        vehicleType: 'Pickup',
        fuelType: 'Diesel',
        fuelConsumedLiters: 15,
        transportEmissionsTco2e: 0.039,
        feedstockTypeId: hardwood.id,
        weightKg: 1800,
        moisturePercent: 20.0,
        storageLocationId: feedstockPile1.id,
      },
    ])
    .returning();

  // ============================================
  // 12. Production Runs
  // ============================================
  console.log('🔥 Creating production runs...');
  const productionRunsData = await db
    .insert(schema.productionRuns)
    .values([
      {
        code: 'PR-2025-001',
        facilityId: mafingaFacility.id,
        date: '2025-01-16',
        status: 'complete',
        startTime: new Date('2025-01-16T06:00:00Z'),
        endTime: new Date('2025-01-16T14:00:00Z'),
        reactorId: reactor1.id,
        processType: 'Raw Biochar',
        operatorId: operator1.id,
        feedstockMix: 'Mixed Wood Chips',
        feedstockStorageLocationId: feedstockBin1.id,
        feedstockAmountKg: 1500,
        feedingRateKgHr: 100,
        moistureBeforeDryingPercent: 18.5,
        moistureAfterDryingPercent: 8.0,
        biocharAmountKg: 390,
        yieldPercent: 26,
        biocharStorageLocationId: biocharPile1.id,
        pyrolysisTemperatureC: 550,
        residenceTimeMinutes: 45,
        dieselOperationLiters: 25,
        dieselGensetLiters: 15,
        preprocessingFuelLiters: 10,
        electricityKwh: 85,
        emissionsFromFossilsKg: 132,
        emissionsFromGridKg: 43,
        totalEmissionsKg: 175,
        quenchingDryWeightKg: 350,
        quenchingWetWeightKg: 420,
      },
      {
        code: 'PR-2025-002',
        facilityId: mafingaFacility.id,
        date: '2025-01-19',
        status: 'complete',
        startTime: new Date('2025-01-19T05:30:00Z'),
        endTime: new Date('2025-01-19T16:00:00Z'),
        reactorId: reactor2.id,
        processType: 'Raw Biochar',
        operatorId: operator2.id,
        feedstockMix: 'Hardwood',
        feedstockStorageLocationId: feedstockPile1.id,
        feedstockAmountKg: 2200,
        feedingRateKgHr: 120,
        moistureBeforeDryingPercent: 22.0,
        moistureAfterDryingPercent: 10.0,
        biocharAmountKg: 528,
        yieldPercent: 24,
        biocharStorageLocationId: biocharPile2.id,
        pyrolysisTemperatureC: 580,
        residenceTimeMinutes: 50,
        dieselOperationLiters: 35,
        dieselGensetLiters: 20,
        preprocessingFuelLiters: 15,
        electricityKwh: 120,
        emissionsFromFossilsKg: 185,
        emissionsFromGridKg: 60,
        totalEmissionsKg: 245,
        quenchingDryWeightKg: 475,
        quenchingWetWeightKg: 570,
      },
      {
        code: 'PR-2025-003',
        facilityId: mafingaFacility.id,
        date: '2025-01-21',
        status: 'complete',
        startTime: new Date('2025-01-21T06:00:00Z'),
        endTime: new Date('2025-01-21T12:00:00Z'),
        reactorId: reactor1.id,
        processType: 'Raw Biochar',
        operatorId: operator1.id,
        feedstockMix: 'Agricultural Residue',
        feedstockStorageLocationId: feedstockPile2.id,
        feedstockAmountKg: 800,
        feedingRateKgHr: 80,
        moistureBeforeDryingPercent: 25.0,
        moistureAfterDryingPercent: 12.0,
        biocharAmountKg: 168,
        yieldPercent: 21,
        biocharStorageLocationId: biocharPile1.id,
        pyrolysisTemperatureC: 520,
        residenceTimeMinutes: 40,
        dieselOperationLiters: 18,
        dieselGensetLiters: 10,
        preprocessingFuelLiters: 8,
        electricityKwh: 55,
        emissionsFromFossilsKg: 95,
        emissionsFromGridKg: 28,
        totalEmissionsKg: 123,
      },
      {
        code: 'PR-2025-004',
        facilityId: mafingaFacility.id,
        date: '2025-02-02',
        status: 'running',
        startTime: new Date('2025-02-02T06:00:00Z'),
        reactorId: reactor1.id,
        processType: 'Raw Biochar',
        operatorId: operator1.id,
        feedstockMix: 'Hardwood',
        feedstockStorageLocationId: feedstockPile1.id,
        feedstockAmountKg: 1800,
        feedingRateKgHr: 100,
        pyrolysisTemperatureC: 560,
      },
    ])
    .returning();

  const pr1 = productionRunsData[0];
  const pr2 = productionRunsData[1];
  const pr3 = productionRunsData[2];
  const pr4 = productionRunsData[3];

  // ============================================
  // 13. Production Run Readings (Time-Series Monitoring)
  // Isometric Protocol: Appendix II - 5-min temp, 1-min pressure/emissions
  // ============================================
  console.log('📊 Creating production run readings (time-series monitoring)...');

  // Generate readings for PR-2025-001 (8 hours = 480 minutes)
  const pr1Readings = [];
  const pr1Start = new Date('2025-01-16T06:00:00Z');
  for (let i = 0; i < 96; i++) {
    // 96 readings at 5-min intervals = 8 hours
    const timestamp = new Date(pr1Start.getTime() + i * 5 * 60 * 1000);
    // Temperature ramp up, hold, cool down pattern
    let temp = 550;
    if (i < 12) temp = 200 + (i * 30); // Ramp up (first hour)
    else if (i > 84) temp = 550 - ((i - 84) * 40); // Cool down (last hour)
    else temp = 540 + Math.random() * 20; // Steady state with variation

    pr1Readings.push({
      productionRunId: pr1.id,
      timestamp,
      temperatureC: Math.round(temp * 10) / 10,
      pressureBar: 0.2 + Math.random() * 0.1,
      ch4Composition: 0.02 + Math.random() * 0.01,
      n2oComposition: 0.001 + Math.random() * 0.0005,
      coComposition: 0.05 + Math.random() * 0.02,
      co2Composition: 0.15 + Math.random() * 0.05,
      gasFlowRate: 0.05 + Math.random() * 0.01,
    });
  }

  // Generate readings for PR-2025-002 (10.5 hours)
  const pr2Readings = [];
  const pr2Start = new Date('2025-01-19T05:30:00Z');
  for (let i = 0; i < 126; i++) {
    // 126 readings at 5-min intervals = 10.5 hours
    const timestamp = new Date(pr2Start.getTime() + i * 5 * 60 * 1000);
    let temp = 580;
    if (i < 15) temp = 200 + (i * 26); // Ramp up
    else if (i > 110) temp = 580 - ((i - 110) * 35); // Cool down
    else temp = 570 + Math.random() * 20; // Steady state

    pr2Readings.push({
      productionRunId: pr2.id,
      timestamp,
      temperatureC: Math.round(temp * 10) / 10,
      pressureBar: 0.3 + Math.random() * 0.15,
      ch4Composition: 0.018 + Math.random() * 0.008,
      n2oComposition: 0.0008 + Math.random() * 0.0004,
      coComposition: 0.04 + Math.random() * 0.015,
      co2Composition: 0.12 + Math.random() * 0.04,
      gasFlowRate: 0.06 + Math.random() * 0.015,
    });
  }

  // Generate readings for PR-2025-003 (6 hours)
  const pr3Readings = [];
  const pr3Start = new Date('2025-01-21T06:00:00Z');
  for (let i = 0; i < 72; i++) {
    // 72 readings at 5-min intervals = 6 hours
    const timestamp = new Date(pr3Start.getTime() + i * 5 * 60 * 1000);
    let temp = 520;
    if (i < 10) temp = 200 + (i * 32); // Ramp up
    else if (i > 60) temp = 520 - ((i - 60) * 40); // Cool down
    else temp = 510 + Math.random() * 20; // Steady state

    pr3Readings.push({
      productionRunId: pr3.id,
      timestamp,
      temperatureC: Math.round(temp * 10) / 10,
      pressureBar: 0.25 + Math.random() * 0.1,
      ch4Composition: 0.025 + Math.random() * 0.012,
      n2oComposition: 0.0012 + Math.random() * 0.0006,
      coComposition: 0.06 + Math.random() * 0.025,
      co2Composition: 0.18 + Math.random() * 0.06,
      gasFlowRate: 0.045 + Math.random() * 0.01,
    });
  }

  await db.insert(schema.productionRunReadings).values([
    ...pr1Readings,
    ...pr2Readings,
    ...pr3Readings,
  ]);

  // ============================================
  // 14. Samples (Full Isometric Characterization)
  // Isometric Protocol: Section 8.3, Table 2
  // ============================================
  console.log('🧪 Creating samples with full Isometric characterization...');
  await db.insert(schema.samples).values([
    {
      productionRunId: pr1.id,
      samplingTime: new Date('2025-01-16T10:00:00Z'),
      operatorId: operator1.id,
      reactorId: reactor1.id,
      weightG: 200,
      volumeMl: 180,
      temperatureC: 45,
      // Carbon measurements
      totalCarbonPercent: 78.5,
      inorganicCarbonPercent: 1.2,
      organicCarbonPercent: 77.3,
      carbonContentPercent: 78.5, // Legacy field
      // Elemental analysis
      hydrogenContentPercent: 2.1,
      oxygenContentPercent: 8.2,
      nitrogenPercent: 0.8,
      sulfurPercent: 0.05,
      // Stability ratios (Isometric thresholds: H:Corg < 0.5, O:Corg < 0.2)
      hCorgMolarRatio: 0.32,
      oCorgMolarRatio: 0.08,
      // Proximate analysis
      moisturePercent: 8.0,
      ashPercent: 6.5,
      volatileMatterPercent: 18.0,
      fixedCarbonPercent: 67.5,
      // Physical properties
      ph: 9.2,
      saltContentGPerKg: 3.5,
      bulkDensityKgPerM3: 280,
      waterHoldingCapacityPercent: 45,
      // Heavy metals (all below thresholds)
      leadMgPerKg: 15.2, // ≤300
      cadmiumMgPerKg: 0.3, // ≤5
      copperMgPerKg: 25.0, // ≤200
      nickelMgPerKg: 12.0, // ≤100
      mercuryMgPerKg: 0.05, // ≤2
      zincMgPerKg: 85.0, // ≤1000
      chromiumMgPerKg: 18.0, // ≤200
      arsenicMgPerKg: 2.1, // ≤20
      // Contaminants
      pahsEfsa8MgPerKg: 0.4, // ≤1 g/t
      pahsEpa16MgPerKg: 2.8,
      pcddFNgPerKg: 5.2, // ≤20
      pcbMgPerKg: 0.02, // ≤0.2
      // Nutrients
      phosphorusGPerKg: 2.5,
      potassiumGPerKg: 15.0,
      magnesiumGPerKg: 3.2,
      calciumGPerKg: 25.0,
      ironGPerKg: 1.8,
      // Lab info
      labName: 'Tanzania Bureau of Standards',
      labAccreditationNumber: 'ISO17025-TZ-2024-0156',
      analysisMethod: 'ASTM D5373 / ISO 29541',
      notes: 'Good quality biochar, uniform color. All parameters within Isometric thresholds.',
    },
    {
      productionRunId: pr1.id,
      samplingTime: new Date('2025-01-16T13:00:00Z'),
      operatorId: operator1.id,
      reactorId: reactor1.id,
      weightG: 200,
      volumeMl: 175,
      temperatureC: 50,
      // Carbon measurements
      totalCarbonPercent: 79.2,
      inorganicCarbonPercent: 1.1,
      organicCarbonPercent: 78.1,
      carbonContentPercent: 79.2,
      // Elemental analysis
      hydrogenContentPercent: 2.0,
      oxygenContentPercent: 7.8,
      nitrogenPercent: 0.75,
      sulfurPercent: 0.04,
      // Stability ratios
      hCorgMolarRatio: 0.30,
      oCorgMolarRatio: 0.075,
      // Proximate analysis
      moisturePercent: 7.5,
      ashPercent: 7.0,
      volatileMatterPercent: 17.5,
      fixedCarbonPercent: 68.0,
      // Physical properties
      ph: 9.4,
      saltContentGPerKg: 3.8,
      bulkDensityKgPerM3: 275,
      waterHoldingCapacityPercent: 48,
      // Heavy metals
      leadMgPerKg: 14.8,
      cadmiumMgPerKg: 0.28,
      copperMgPerKg: 23.5,
      nickelMgPerKg: 11.5,
      mercuryMgPerKg: 0.04,
      zincMgPerKg: 82.0,
      chromiumMgPerKg: 17.5,
      arsenicMgPerKg: 2.0,
      // Contaminants
      pahsEfsa8MgPerKg: 0.35,
      pahsEpa16MgPerKg: 2.5,
      pcddFNgPerKg: 4.8,
      pcbMgPerKg: 0.018,
      // Nutrients
      phosphorusGPerKg: 2.6,
      potassiumGPerKg: 15.5,
      magnesiumGPerKg: 3.4,
      calciumGPerKg: 26.0,
      ironGPerKg: 1.9,
      // Lab info
      labName: 'Tanzania Bureau of Standards',
      labAccreditationNumber: 'ISO17025-TZ-2024-0156',
      analysisMethod: 'ASTM D5373 / ISO 29541',
    },
    {
      productionRunId: pr2.id,
      samplingTime: new Date('2025-01-19T11:00:00Z'),
      operatorId: operator2.id,
      reactorId: reactor2.id,
      weightG: 250,
      volumeMl: 220,
      temperatureC: 52,
      // Carbon measurements
      totalCarbonPercent: 82.0,
      inorganicCarbonPercent: 0.8,
      organicCarbonPercent: 81.2,
      carbonContentPercent: 82.0,
      // Elemental analysis
      hydrogenContentPercent: 1.8,
      oxygenContentPercent: 6.5,
      nitrogenPercent: 0.6,
      sulfurPercent: 0.03,
      // Stability ratios - excellent for hardwood
      hCorgMolarRatio: 0.26,
      oCorgMolarRatio: 0.06,
      // Proximate analysis
      moisturePercent: 6.0,
      ashPercent: 5.5,
      volatileMatterPercent: 15.0,
      fixedCarbonPercent: 73.5,
      // Physical properties
      ph: 9.8,
      saltContentGPerKg: 2.8,
      bulkDensityKgPerM3: 300,
      waterHoldingCapacityPercent: 52,
      // Heavy metals
      leadMgPerKg: 8.5,
      cadmiumMgPerKg: 0.15,
      copperMgPerKg: 18.0,
      nickelMgPerKg: 8.0,
      mercuryMgPerKg: 0.02,
      zincMgPerKg: 55.0,
      chromiumMgPerKg: 12.0,
      arsenicMgPerKg: 1.2,
      // Contaminants
      pahsEfsa8MgPerKg: 0.22,
      pahsEpa16MgPerKg: 1.8,
      pcddFNgPerKg: 3.5,
      pcbMgPerKg: 0.01,
      // Nutrients
      phosphorusGPerKg: 1.8,
      potassiumGPerKg: 12.0,
      magnesiumGPerKg: 2.5,
      calciumGPerKg: 20.0,
      ironGPerKg: 1.2,
      // 1000-year durability fields (optional)
      randomReflectanceR0: 2.8,
      residualOrganicCarbonPercent: 75.0,
      // Lab info
      labName: 'SGS Tanzania Limited',
      labAccreditationNumber: 'ISO17025-SGS-2024-0892',
      analysisMethod: 'ISO 29541 / ISO 16948',
      notes: 'Premium hardwood biochar. Excellent stability indicators. Qualifies for 1000-year durability option.',
    },
    {
      productionRunId: pr3.id,
      samplingTime: new Date('2025-01-21T09:00:00Z'),
      operatorId: operator1.id,
      reactorId: reactor1.id,
      weightG: 180,
      volumeMl: 160,
      temperatureC: 48,
      // Carbon measurements
      totalCarbonPercent: 72.0,
      inorganicCarbonPercent: 2.5,
      organicCarbonPercent: 69.5,
      carbonContentPercent: 72.0,
      // Elemental analysis
      hydrogenContentPercent: 2.5,
      oxygenContentPercent: 10.0,
      nitrogenPercent: 1.2,
      sulfurPercent: 0.08,
      // Stability ratios
      hCorgMolarRatio: 0.43,
      oCorgMolarRatio: 0.11,
      // Proximate analysis
      moisturePercent: 10.0,
      ashPercent: 9.0,
      volatileMatterPercent: 22.0,
      fixedCarbonPercent: 59.0,
      // Physical properties
      ph: 8.5,
      saltContentGPerKg: 5.2,
      bulkDensityKgPerM3: 275,
      waterHoldingCapacityPercent: 40,
      // Heavy metals - higher due to agricultural residue
      leadMgPerKg: 25.0,
      cadmiumMgPerKg: 0.8,
      copperMgPerKg: 45.0,
      nickelMgPerKg: 22.0,
      mercuryMgPerKg: 0.12,
      zincMgPerKg: 150.0,
      chromiumMgPerKg: 28.0,
      arsenicMgPerKg: 4.5,
      // Contaminants
      pahsEfsa8MgPerKg: 0.65,
      pahsEpa16MgPerKg: 4.2,
      pcddFNgPerKg: 8.5,
      pcbMgPerKg: 0.05,
      // Nutrients - higher due to agricultural residue
      phosphorusGPerKg: 5.5,
      potassiumGPerKg: 25.0,
      magnesiumGPerKg: 4.8,
      calciumGPerKg: 35.0,
      ironGPerKg: 3.5,
      // Lab info
      labName: 'Tanzania Bureau of Standards',
      labAccreditationNumber: 'ISO17025-TZ-2024-0156',
      analysisMethod: 'ASTM D5373',
      notes: 'Agricultural residue biochar - higher ash and nutrient content. Still within all Isometric thresholds.',
    },
  ]);

  // ============================================
  // 15. Incident Reports
  // ============================================
  console.log('⚠️ Creating incident reports...');
  await db.insert(schema.incidentReports).values([
    {
      productionRunId: pr2.id,
      incidentTime: new Date('2025-01-19T08:30:00Z'),
      operatorId: operator2.id,
      reactorId: reactor2.id,
      notes: 'Machine running a bit hot - adjusted air intake',
    },
    {
      productionRunId: pr3.id,
      incidentTime: new Date('2025-01-21T10:00:00Z'),
      operatorId: operator1.id,
      reactorId: reactor1.id,
      notes: 'Brief power fluctuation - switched to genset backup',
    },
  ]);

  // ============================================
  // 16. Biochar Products
  // ============================================
  console.log('📦 Creating biochar products...');
  const biocharProductsData = await db
    .insert(schema.biocharProducts)
    .values([
      {
        code: 'BP-2025-001',
        facilityId: mafingaFacility.id,
        productionDate: new Date('2025-01-17T00:00:00Z'),
        status: 'ready',
        formulationId: rawBiochar.id,
        biocharSourceStorageId: biocharPile1.id,
        linkedProductionRunId: pr1.id,
        biocharAmountKg: 390,
        biocharPerM3Kg: 280,
        compostWeightKg: 0,
        compostPerM3Kg: 0,
        totalWeightKg: 390,
        totalVolumeLiters: 1393,
        densityKgL: 0.28,
        storageLocationId: productPile1.id,
      },
      {
        code: 'BP-2025-002',
        facilityId: mafingaFacility.id,
        productionDate: new Date('2025-01-20T00:00:00Z'),
        status: 'ready',
        formulationId: bcf01.id,
        biocharSourceStorageId: biocharPile2.id,
        linkedProductionRunId: pr2.id,
        biocharAmountKg: 3710,
        biocharPerM3Kg: 300,
        compostWeightKg: 1590,
        compostPerM3Kg: 450,
        totalWeightKg: 5300,
        totalVolumeLiters: 17667,
        densityKgL: 0.3,
        storageLocationId: productPile2.id,
      },
      {
        code: 'BP-2025-003',
        facilityId: mafingaFacility.id,
        productionDate: new Date('2025-01-22T00:00:00Z'),
        status: 'testing',
        formulationId: rawBiochar.id,
        biocharSourceStorageId: biocharPile1.id,
        linkedProductionRunId: pr3.id,
        biocharAmountKg: 168,
        biocharPerM3Kg: 275,
        compostWeightKg: 0,
        compostPerM3Kg: 0,
        totalWeightKg: 168,
        totalVolumeLiters: 611,
        densityKgL: 0.275,
        storageLocationId: productPile1.id,
      },
    ])
    .returning();

  const bp1 = biocharProductsData[0];
  const bp2 = biocharProductsData[1];

  // ============================================
  // 17. Orders
  // ============================================
  console.log('🛒 Creating orders...');
  const ordersData = await db
    .insert(schema.orders)
    .values([
      {
        code: 'OR-2025-001',
        facilityId: mafingaFacility.id,
        orderDate: new Date('2025-01-18T00:00:00Z'),
        status: 'processed',
        customerId: customer1.id,
        invoiceNumber: '25-0001',
        formulationId: bcf01.id,
        quantityTons: 5.3,
        quantityM3: 17.667,
        biocharTons: 3.71,
        packaging: 'loose',
        valueTzs: 3540000,
        applicationStatus: 'Applied',
        bulkDensityKgL: 0.3,
        cSinkType: 'Geo localised C Sink',
        compostPerM3Percent: 30,
      },
      {
        code: 'OR-2025-002',
        facilityId: mafingaFacility.id,
        orderDate: new Date('2025-01-22T00:00:00Z'),
        status: 'processed',
        customerId: customer2.id,
        invoiceNumber: '25-0002',
        formulationId: rawBiochar.id,
        quantityTons: 0.39,
        quantityM3: 1.393,
        biocharTons: 0.39,
        packaging: 'bagged',
        valueTzs: 585000,
        applicationStatus: 'Delivered',
        bulkDensityKgL: 0.28,
        cSinkType: 'Geo localised C Sink',
      },
      {
        code: 'OR-2025-003',
        facilityId: mafingaFacility.id,
        orderDate: new Date('2025-01-28T00:00:00Z'),
        status: 'ordered',
        customerId: customer3.id,
        invoiceNumber: '25-0003',
        formulationId: bcf02.id,
        quantityTons: 2.0,
        quantityM3: 6.667,
        biocharTons: 1.0,
        packaging: 'loose',
        valueTzs: 1500000,
        applicationStatus: 'In preparation',
      },
    ])
    .returning();

  const order1 = ordersData[0];
  const order2 = ordersData[1];

  // ============================================
  // 18. Deliveries
  // ============================================
  console.log('🚚 Creating deliveries...');
  const deliveriesData = await db
    .insert(schema.deliveries)
    .values([
      {
        code: 'DL-2025-001',
        facilityId: mafingaFacility.id,
        deliveryDate: new Date('2025-01-23T00:00:00Z'),
        status: 'delivered',
        orderId: order1.id,
        biocharProductId: bp2.id,
        storageLocationId: productPile2.id,
        quantityTons: 5.3,
        quantityM3: 17.667,
        biocharTons: 3.71,
        fixedCarbonPercent: 73.5,
        driverId: driver1.id,
        vehicleType: 'Truck',
        fuelType: 'Diesel',
        fuelConsumedLiters: 50,
        distanceKm: 167,
        emissionsTco2e: 0.132,
      },
      {
        code: 'DL-2025-002',
        facilityId: mafingaFacility.id,
        deliveryDate: new Date('2025-01-25T00:00:00Z'),
        status: 'delivered',
        orderId: order2.id,
        biocharProductId: bp1.id,
        storageLocationId: productPile1.id,
        quantityTons: 0.39,
        quantityM3: 1.393,
        biocharTons: 0.39,
        fixedCarbonPercent: 67.5,
        driverId: driver2.id,
        vehicleType: 'Pickup',
        fuelType: 'Diesel',
        fuelConsumedLiters: 12,
        distanceKm: 45,
        emissionsTco2e: 0.032,
      },
    ])
    .returning();

  const delivery1 = deliveriesData[0];
  const delivery2 = deliveriesData[1];

  // ============================================
  // 19. Applications (Soil Storage with Durability)
  // Isometric: Biochar Storage in Soil Environments Module v1.2
  // ============================================
  console.log('🌾 Creating applications with durability calculations...');
  const applicationsData = await db
    .insert(schema.applications)
    .values([
      {
        code: 'AP-2025-001',
        facilityId: mafingaFacility.id,
        applicationDate: new Date('2025-01-26T00:00:00Z'),
        status: 'applied',
        deliveryId: delivery1.id,
        biocharAppliedTons: 3.71,
        biocharDryMatterTons: 3.5,
        totalAppliedTons: 5.3,
        gpsLat: -9.01652,
        gpsLng: 32.88408,
        fieldSizeHa: 4.5,
        applicationMethodType: 'mechanical',
        fieldIdentifier: 'Kanji Lalji Coffee Farm - Plot A',
        gisBoundaryReference: 'GIS-TZ-IR-2025-0042',
        // Durability calculation (Isometric Section 5.1)
        durabilityOptionType: '200_year',
        soilTemperatureC: 22.5, // Annual average for tropical highland
        soilTemperatureSource: 'baseline',
        fDurableCalculated: 0.89, // F_durable,200 calculation result
        co2eStoredTonnes: 9.84, // Biochar * Corg * 3.67 * F_durable
      },
      {
        code: 'AP-2025-002',
        facilityId: mafingaFacility.id,
        applicationDate: new Date('2025-01-28T00:00:00Z'),
        status: 'delivered',
        deliveryId: delivery2.id,
        biocharAppliedTons: 0.39,
        biocharDryMatterTons: 0.36,
        totalAppliedTons: 0.39,
        gpsLat: -7.85,
        gpsLng: 35.75,
        fieldSizeHa: 1.2,
        applicationMethodType: 'manual',
        fieldIdentifier: 'Mama Tuma Farm - Maize Field',
        gisBoundaryReference: 'GIS-TZ-IR-2025-0043',
        // Durability calculation
        durabilityOptionType: '200_year',
        soilTemperatureC: 24.2, // Slightly warmer lowland
        soilTemperatureSource: 'baseline',
        fDurableCalculated: 0.87,
        co2eStoredTonnes: 0.78,
      },
    ])
    .returning();

  const app1 = applicationsData[0];
  const app2 = applicationsData[1];

  // ============================================
  // 20. Soil Temperature Measurements (Durability Baseline)
  // Isometric: SubRequirement G-QMBJ-0 - 10+ measurements per site-month
  // ============================================
  console.log('🌡️ Creating soil temperature measurements...');

  // Measurements for Application 1 (Coffee Farm)
  const app1TempMeasurements = [];
  for (let day = 1; day <= 12; day++) {
    // 12 measurements for baseline
    app1TempMeasurements.push({
      applicationId: app1.id,
      measurementDate: `2025-01-${String(day + 10).padStart(2, '0')}`,
      temperatureC: 21.5 + Math.random() * 2, // 21.5-23.5°C range
      measurementMethod: 'ISO 4974 soil thermometer',
      measurementDepthCm: 15,
      measurementLat: -9.01652 + (Math.random() - 0.5) * 0.001,
      measurementLng: 32.88408 + (Math.random() - 0.5) * 0.001,
      notes: day === 1 ? 'Initial baseline measurement' : null,
    });
  }

  // Measurements for Application 2 (Mama Tuma Farm)
  const app2TempMeasurements = [];
  for (let day = 1; day <= 10; day++) {
    // 10 measurements for baseline
    app2TempMeasurements.push({
      applicationId: app2.id,
      measurementDate: `2025-01-${String(day + 15).padStart(2, '0')}`,
      temperatureC: 23.5 + Math.random() * 1.5, // 23.5-25°C range (warmer)
      measurementMethod: 'ISO 4974 soil thermometer',
      measurementDepthCm: 15,
      measurementLat: -7.85 + (Math.random() - 0.5) * 0.001,
      measurementLng: 35.75 + (Math.random() - 0.5) * 0.001,
    });
  }

  await db.insert(schema.soilTemperatureMeasurements).values([
    ...app1TempMeasurements,
    ...app2TempMeasurements,
  ]);

  // ============================================
  // 21. Transport Legs (Emissions Tracking)
  // Isometric: Transportation Emissions Accounting Module v1.1
  // ============================================
  console.log('🚛 Creating transport legs for emissions tracking...');
  await db.insert(schema.transportLegs).values([
    // Feedstock transport leg (FS-2025-001)
    {
      entityType: 'feedstock',
      entityId: feedstocksData[0].id,
      originLat: -8.5,
      originLng: 35.3,
      originName: 'Woody Allen - Mufindi District',
      destinationLat: -8.3548,
      destinationLng: 35.0822,
      destinationName: 'Mafinga Facility',
      distanceKm: 45,
      transportMethodType: 'road',
      vehicleType: 'Medium-duty truck (7.5-16t)',
      vehicleModelYear: '2020',
      fuelType: 'Diesel',
      fuelConsumedLiters: 30,
      loadWeightTonnes: 1.5,
      loadCapacityUtilizationPercent: 75,
      calculationMethodType: 'energy_usage',
      emissionFactorUsed: 2.64,
      emissionFactorSource: 'IPCC 2019 - Table 3.2.1',
      emissionsCo2eKg: 79.2,
      billOfLading: 'BOL-FS-2025-001',
      weighScaleTicketRef: 'WST-2025-0015',
    },
    // Feedstock transport leg (FS-2025-002)
    {
      entityType: 'feedstock',
      entityId: feedstocksData[1].id,
      originLat: -9.33,
      originLng: 34.78,
      originName: 'Green Forest Co-op - Njombe Region',
      destinationLat: -8.3548,
      destinationLng: 35.0822,
      destinationName: 'Mafinga Facility',
      distanceKm: 120,
      transportMethodType: 'road',
      vehicleType: 'Heavy-duty truck (>16t)',
      vehicleModelYear: '2019',
      fuelType: 'Diesel',
      fuelConsumedLiters: 45,
      loadWeightTonnes: 2.2,
      loadCapacityUtilizationPercent: 85,
      calculationMethodType: 'energy_usage',
      emissionFactorUsed: 2.64,
      emissionFactorSource: 'IPCC 2019 - Table 3.2.1',
      emissionsCo2eKg: 118.8,
      billOfLading: 'BOL-FS-2025-002',
      weighScaleTicketRef: 'WST-2025-0018',
    },
    // Delivery transport leg (DL-2025-001)
    {
      entityType: 'delivery',
      entityId: delivery1.id,
      originLat: -8.3548,
      originLng: 35.0822,
      originName: 'Mafinga Facility',
      destinationLat: -9.01652,
      destinationLng: 32.88408,
      destinationName: 'Kanji Lalji - Mafinga',
      distanceKm: 167,
      transportMethodType: 'road',
      vehicleType: 'Heavy-duty truck (>16t)',
      vehicleModelYear: '2021',
      fuelType: 'Diesel',
      fuelConsumedLiters: 50,
      loadWeightTonnes: 5.3,
      loadCapacityUtilizationPercent: 90,
      calculationMethodType: 'energy_usage',
      emissionFactorUsed: 2.64,
      emissionFactorSource: 'IPCC 2019 - Table 3.2.1',
      emissionsCo2eKg: 132.0,
      billOfLading: 'BOL-DL-2025-001',
      weighScaleTicketRef: 'WST-2025-0023',
    },
    // Delivery transport leg (DL-2025-002)
    {
      entityType: 'delivery',
      entityId: delivery2.id,
      originLat: -8.3548,
      originLng: 35.0822,
      originName: 'Mafinga Facility',
      destinationLat: -7.85,
      destinationLng: 35.75,
      destinationName: 'Mama Tuma Farm - Iringa Rural',
      distanceKm: 45,
      transportMethodType: 'road',
      vehicleType: 'Light-duty pickup (<3.5t)',
      vehicleModelYear: '2022',
      fuelType: 'Diesel',
      fuelConsumedLiters: 12,
      loadWeightTonnes: 0.39,
      loadCapacityUtilizationPercent: 40,
      calculationMethodType: 'energy_usage',
      emissionFactorUsed: 2.64,
      emissionFactorSource: 'IPCC 2019 - Table 3.2.1',
      emissionsCo2eKg: 31.68,
      billOfLading: 'BOL-DL-2025-002',
      weighScaleTicketRef: 'WST-2025-0025',
    },
    // Sample transport to lab
    {
      entityType: 'sample',
      entityId: pr1.id, // Reference to production run for sample
      originLat: -8.3548,
      originLng: 35.0822,
      originName: 'Mafinga Facility',
      destinationLat: -6.8,
      destinationLng: 37.0,
      destinationName: 'Tanzania Bureau of Standards - Dar es Salaam',
      distanceKm: 450,
      transportMethodType: 'road',
      vehicleType: 'Light-duty vehicle (<3.5t)',
      vehicleModelYear: '2023',
      fuelType: 'Diesel',
      fuelConsumedLiters: 35,
      loadWeightTonnes: 0.002, // 2kg sample
      loadCapacityUtilizationPercent: 5,
      calculationMethodType: 'energy_usage',
      emissionFactorUsed: 2.64,
      emissionFactorSource: 'IPCC 2019 - Table 3.2.1',
      emissionsCo2eKg: 92.4,
      billOfLading: 'BOL-SAMPLE-2025-001',
    },
  ]);

  // ============================================
  // 22. Credit Batches
  // ============================================
  console.log('💳 Creating credit batches...');
  const creditBatchesData = await db
    .insert(schema.creditBatches)
    .values([
      {
        code: 'CB-2025-001',
        facilityId: mafingaFacility.id,
        date: '2025-01-30',
        status: 'issued',
        reactorId: reactor1.id,
        startDate: new Date('2025-01-16T00:00:00Z'),
        endDate: new Date('2025-01-26T00:00:00Z'),
        certifier: 'Isometric',
        registry: 'Isometric',
        batchesCount: 2,
        weightTons: 4.1,
        creditsTco2e: 9.84,
        valueTzs: 14760000,
        bufferPoolPercent: 5,
      },
      {
        code: 'CB-2025-002',
        facilityId: mafingaFacility.id,
        date: '2025-02-05',
        status: 'verified',
        reactorId: reactor2.id,
        startDate: new Date('2025-01-19T00:00:00Z'),
        endDate: new Date('2025-01-28T00:00:00Z'),
        certifier: 'Isometric',
        registry: 'Isometric',
        batchesCount: 1,
        weightTons: 0.39,
        creditsTco2e: 0.78,
        valueTzs: 1170000,
        bufferPoolPercent: 8,
      },
      {
        code: 'CB-2025-003',
        facilityId: mafingaFacility.id,
        date: '2025-02-10',
        status: 'pending',
        reactorId: reactor1.id,
        startDate: new Date('2025-01-21T00:00:00Z'),
        certifier: 'Isometric',
        registry: 'Isometric',
      },
    ])
    .returning();

  const cb1 = creditBatchesData[0];
  const cb2 = creditBatchesData[1];

  // ============================================
  // 23. Lab Analyses
  // ============================================
  console.log('🔬 Creating lab analyses...');
  await db.insert(schema.labAnalyses).values([
    {
      creditBatchId: cb1.id,
      analysisDate: new Date('2025-01-28T00:00:00Z'),
      analystName: 'Dr. Maria Santos',
      reportFile: '/reports/lab/CB-2025-001-analysis.pdf',
      notes:
        'Carbon content verified at 78.5%. H:Corg ratio = 0.32, O:Corg ratio = 0.08. All heavy metals below thresholds. Meets Isometric requirements for 200-year durability.',
    },
    {
      creditBatchId: cb2.id,
      analysisDate: new Date('2025-02-03T00:00:00Z'),
      analystName: 'Dr. John Kimaro',
      reportFile: '/reports/lab/CB-2025-002-analysis.pdf',
      notes:
        'Premium hardwood biochar. Carbon content 82%. H:Corg = 0.26, O:Corg = 0.06. Excellent stability indicators. Qualifies for 1000-year durability option.',
    },
  ]);

  // ============================================
  // 24. Credit Batch Applications (Junction Table)
  // ============================================
  console.log('🔗 Creating credit batch applications links...');
  await db.insert(schema.creditBatchApplications).values([
    { creditBatchId: cb1.id, applicationId: app1.id },
    { creditBatchId: cb2.id, applicationId: app2.id },
  ]);

  // ============================================
  // 25. Documentation
  // ============================================
  console.log('📎 Creating documentation...');
  await db.insert(schema.documentation).values([
    {
      entityType: 'feedstock',
      entityId: feedstocksData[0].id,
      createdBy: 'Adam Driver',
      notes: 'Delivery photos - mixed wood chips from Woody Allen',
      attachments: [
        { fileUrl: '/uploads/feedstock/FS-2025-001-delivery-1.jpg', fileType: 'photo' },
        { fileUrl: '/uploads/feedstock/FS-2025-001-delivery-2.jpg', fileType: 'photo' },
      ],
    },
    {
      entityType: 'production_run',
      entityId: pr1.id,
      createdBy: 'Smooth Operator',
      notes: 'Production run started smoothly. Temperature holding steady at 550C.',
      attachments: [
        { fileUrl: '/uploads/production/PR-2025-001-start.jpg', fileType: 'photo' },
        { fileUrl: '/uploads/production/PR-2025-001-temp-log.pdf', fileType: 'pdf' },
      ],
    },
    {
      entityType: 'production_run',
      entityId: pr2.id,
      createdBy: 'James Pyro',
      notes: 'Extended run for hardwood batch. Slight temperature adjustment needed mid-run.',
      attachments: [
        { fileUrl: '/uploads/production/PR-2025-002-video.mp4', fileType: 'video' },
      ],
    },
    {
      entityType: 'application',
      entityId: app1.id,
      createdBy: 'Kanji Lalji',
      notes: 'Application to coffee field complete. Biochar well incorporated.',
      attachments: [
        { fileUrl: '/uploads/application/AP-2025-001-field-1.jpg', fileType: 'photo' },
        { fileUrl: '/uploads/application/AP-2025-001-field-2.jpg', fileType: 'photo' },
        { fileUrl: '/uploads/application/AP-2025-001-gps-track.pdf', fileType: 'pdf' },
      ],
    },
    {
      entityType: 'credit_batch',
      entityId: cb1.id,
      createdBy: 'Sarah Manager',
      notes: 'Credit batch verified and issued. All documentation complete.',
      attachments: [
        { fileUrl: '/uploads/credits/CB-2025-001-certificate.pdf', fileType: 'pdf' },
      ],
    },
  ]);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nSummary:');
  console.log('- 3 users');
  console.log('- 2 facilities');
  console.log('- 3 reactors');
  console.log('- 11 storage locations');
  console.log('- 3 suppliers');
  console.log('- 3 customers');
  console.log('- 2 drivers');
  console.log('- 2 operators');
  console.log('- 3 feedstock types');
  console.log('- 3 formulations');
  console.log('- 5 feedstocks');
  console.log('- 4 production runs');
  console.log(`- ${pr1Readings.length + pr2Readings.length + pr3Readings.length} production run readings (time-series monitoring)`);
  console.log('- 4 samples (full Isometric characterization)');
  console.log('- 2 incident reports');
  console.log('- 3 biochar products');
  console.log('- 3 orders');
  console.log('- 2 deliveries');
  console.log('- 2 applications (with durability calculations)');
  console.log(`- ${app1TempMeasurements.length + app2TempMeasurements.length} soil temperature measurements`);
  console.log('- 5 transport legs (emissions tracking)');
  console.log('- 3 credit batches');
  console.log('- 2 lab analyses');
  console.log('- 5 documentation records');

  await pool.end();
}

// Run seed
seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
