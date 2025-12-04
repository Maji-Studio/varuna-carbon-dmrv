/**
 * Database Seed Script
 * Dark Earth Carbon - Biochar DMRV System
 *
 * Seeds realistic test data following the chain of custody:
 * Feedstock → ProductionRun → BiocharProduct → Order → Delivery → Application → CreditBatch
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
  // 13. Samples
  // ============================================
  console.log('🧪 Creating samples...');
  await db.insert(schema.samples).values([
    {
      productionRunId: pr1.id,
      samplingTime: new Date('2025-01-16T10:00:00Z'),
      operatorId: operator1.id,
      reactorId: reactor1.id,
      weightG: 200,
      volumeMl: 180,
      temperatureC: 45,
      carbonContentPercent: 78.5,
      hydrogenContentPercent: 2.1,
      oxygenContentPercent: 8.2,
      moisturePercent: 8.0,
      ashPercent: 6.5,
      volatileMatterPercent: 18.0,
      fixedCarbonPercent: 67.5,
      notes: 'Good quality biochar, uniform color',
    },
    {
      productionRunId: pr1.id,
      samplingTime: new Date('2025-01-16T13:00:00Z'),
      operatorId: operator1.id,
      reactorId: reactor1.id,
      weightG: 200,
      volumeMl: 175,
      temperatureC: 50,
      carbonContentPercent: 79.2,
      hydrogenContentPercent: 2.0,
      oxygenContentPercent: 7.8,
      moisturePercent: 7.5,
      ashPercent: 7.0,
      volatileMatterPercent: 17.5,
      fixedCarbonPercent: 68.0,
    },
    {
      productionRunId: pr2.id,
      samplingTime: new Date('2025-01-19T11:00:00Z'),
      operatorId: operator2.id,
      reactorId: reactor2.id,
      weightG: 250,
      volumeMl: 220,
      temperatureC: 52,
      carbonContentPercent: 82.0,
      hydrogenContentPercent: 1.8,
      oxygenContentPercent: 6.5,
      moisturePercent: 6.0,
      ashPercent: 5.5,
      volatileMatterPercent: 15.0,
      fixedCarbonPercent: 73.5,
      notes: 'Premium hardwood biochar',
    },
    {
      productionRunId: pr3.id,
      samplingTime: new Date('2025-01-21T09:00:00Z'),
      operatorId: operator1.id,
      reactorId: reactor1.id,
      weightG: 180,
      volumeMl: 160,
      temperatureC: 48,
      carbonContentPercent: 72.0,
      hydrogenContentPercent: 2.5,
      oxygenContentPercent: 10.0,
      moisturePercent: 10.0,
      ashPercent: 9.0,
      volatileMatterPercent: 22.0,
      fixedCarbonPercent: 59.0,
      notes: 'Agricultural residue - higher ash content',
    },
  ]);

  // ============================================
  // 14. Incident Reports
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
  // 15. Biochar Products
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
  // 16. Orders
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
  // 17. Deliveries
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
  // 18. Applications (Soil Storage)
  // ============================================
  console.log('🌾 Creating applications...');
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
      },
    ])
    .returning();

  const app1 = applicationsData[0];
  const app2 = applicationsData[1];

  // ============================================
  // 19. Credit Batches
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
  // 20. Lab Analyses
  // ============================================
  console.log('🔬 Creating lab analyses...');
  await db.insert(schema.labAnalyses).values([
    {
      creditBatchId: cb1.id,
      analysisDate: new Date('2025-01-28T00:00:00Z'),
      analystName: 'Dr. Maria Santos',
      reportFile: '/reports/lab/CB-2025-001-analysis.pdf',
      notes: 'Carbon content verified at 78.5%. H:C ratio = 0.027, O:C ratio = 0.078. Meets Isometric requirements.',
    },
    {
      creditBatchId: cb2.id,
      analysisDate: new Date('2025-02-03T00:00:00Z'),
      analystName: 'Dr. John Kimaro',
      reportFile: '/reports/lab/CB-2025-002-analysis.pdf',
      notes: 'Premium hardwood biochar. Carbon content 82%. Excellent stability indicators.',
    },
  ]);

  // ============================================
  // 21. Credit Batch Applications (Junction Table)
  // ============================================
  console.log('🔗 Creating credit batch applications links...');
  await db.insert(schema.creditBatchApplications).values([
    { creditBatchId: cb1.id, applicationId: app1.id },
    { creditBatchId: cb2.id, applicationId: app2.id },
  ]);

  // ============================================
  // 22. Documentation
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
  console.log('- 4 samples');
  console.log('- 2 incident reports');
  console.log('- 3 biochar products');
  console.log('- 3 orders');
  console.log('- 2 deliveries');
  console.log('- 2 applications');
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
