CREATE TYPE "public"."application_method" AS ENUM('manual', 'mechanical');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('delivered', 'applied');--> statement-breakpoint
CREATE TYPE "public"."biochar_product_status" AS ENUM('testing', 'ready');--> statement-breakpoint
CREATE TYPE "public"."credit_batch_status" AS ENUM('pending', 'verified', 'issued');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('processing', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."documentation_entity_type" AS ENUM('feedstock', 'production_run', 'sample', 'incident_report', 'biochar_product', 'order', 'delivery', 'application', 'credit_batch');--> statement-breakpoint
CREATE TYPE "public"."documentation_type" AS ENUM('photo', 'video', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."durability_option" AS ENUM('200_year', '1000_year');--> statement-breakpoint
CREATE TYPE "public"."emissions_calculation_method" AS ENUM('energy_usage', 'distance_based');--> statement-breakpoint
CREATE TYPE "public"."feedstock_status" AS ENUM('missing_data', 'complete');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('ordered', 'processed');--> statement-breakpoint
CREATE TYPE "public"."packaging_type" AS ENUM('loose', 'bagged');--> statement-breakpoint
CREATE TYPE "public"."production_run_status" AS ENUM('running', 'complete');--> statement-breakpoint
CREATE TYPE "public"."storage_location_type" AS ENUM('feedstock_bin', 'feedstock_pile', 'biochar_pile', 'product_pile');--> statement-breakpoint
CREATE TYPE "public"."transport_entity_type" AS ENUM('feedstock', 'biochar', 'sample', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."transport_method" AS ENUM('road', 'rail', 'ship', 'pipeline', 'aircraft');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"gps_lat" real,
	"gps_lng" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"reactor_type" text,
	"design_specs" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reactors_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "storage_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "storage_location_type" NOT NULL,
	"facility_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"gps_lat" real,
	"gps_lng" real,
	"distance_km" real,
	"crop_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"gps_lat" real,
	"gps_lng" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedstock_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedstock_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "feedstocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" "feedstock_status" DEFAULT 'missing_data' NOT NULL,
	"collection_date" timestamp,
	"delivery_date" timestamp,
	"supplier_id" uuid,
	"driver_id" uuid,
	"vehicle_type" text,
	"fuel_type" text,
	"fuel_consumed_liters" real,
	"transport_emissions_tco2e" real,
	"feedstock_type_id" uuid,
	"weight_kg" real,
	"moisture_percent" real,
	"storage_location_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedstocks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "incident_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_run_id" uuid NOT NULL,
	"incident_time" timestamp NOT NULL,
	"operator_id" uuid,
	"reactor_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_run_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_run_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"temperature_c" real,
	"pressure_bar" real,
	"ch4_composition" real,
	"n2o_composition" real,
	"co_composition" real,
	"co2_composition" real,
	"gas_flow_rate" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" "production_run_status" DEFAULT 'running' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"reactor_id" uuid,
	"process_type" text,
	"operator_id" uuid,
	"feedstock_mix" text,
	"feedstock_storage_location_id" uuid,
	"feedstock_amount_kg" real,
	"feeding_rate_kg_hr" real,
	"moisture_before_drying_percent" real,
	"moisture_after_drying_percent" real,
	"biochar_amount_kg" real,
	"yield_percent" real,
	"biochar_storage_location_id" uuid,
	"pyrolysis_temperature_c" real,
	"residence_time_minutes" integer,
	"diesel_operation_liters" real,
	"diesel_genset_liters" real,
	"preprocessing_fuel_liters" real,
	"electricity_kwh" real,
	"emissions_from_fossils_kg" real,
	"emissions_from_grid_kg" real,
	"total_emissions_kg" real,
	"quenching_dry_weight_kg" real,
	"quenching_wet_weight_kg" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_runs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_run_id" uuid NOT NULL,
	"sampling_time" timestamp NOT NULL,
	"operator_id" uuid,
	"reactor_id" uuid,
	"weight_g" real,
	"volume_ml" real,
	"temperature_c" real,
	"total_carbon_percent" real,
	"inorganic_carbon_percent" real,
	"organic_carbon_percent" real,
	"carbon_content_percent" real,
	"hydrogen_content_percent" real,
	"oxygen_content_percent" real,
	"nitrogen_percent" real,
	"sulfur_percent" real,
	"h_corg_molar_ratio" real,
	"o_corg_molar_ratio" real,
	"moisture_percent" real,
	"ash_percent" real,
	"volatile_matter_percent" real,
	"fixed_carbon_percent" real,
	"ph" real,
	"salt_content_g_per_kg" real,
	"bulk_density_kg_per_m3" real,
	"water_holding_capacity_percent" real,
	"lead_mg_per_kg" real,
	"cadmium_mg_per_kg" real,
	"copper_mg_per_kg" real,
	"nickel_mg_per_kg" real,
	"mercury_mg_per_kg" real,
	"zinc_mg_per_kg" real,
	"chromium_mg_per_kg" real,
	"arsenic_mg_per_kg" real,
	"pahs_efsa8_mg_per_kg" real,
	"pahs_epa16_mg_per_kg" real,
	"pcdd_f_ng_per_kg" real,
	"pcb_mg_per_kg" real,
	"phosphorus_g_per_kg" real,
	"potassium_g_per_kg" real,
	"magnesium_g_per_kg" real,
	"calcium_g_per_kg" real,
	"iron_g_per_kg" real,
	"random_reflectance_r0" real,
	"residual_organic_carbon_percent" real,
	"lab_name" text,
	"lab_accreditation_number" text,
	"analysis_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biochar_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"production_date" timestamp,
	"status" "biochar_product_status" DEFAULT 'testing' NOT NULL,
	"formulation_id" uuid,
	"biochar_source_storage_id" uuid,
	"linked_production_run_id" uuid,
	"biochar_amount_kg" real,
	"biochar_per_m3_kg" real,
	"compost_weight_kg" real,
	"compost_per_m3_kg" real,
	"total_weight_kg" real,
	"total_volume_liters" real,
	"density_kg_l" real,
	"storage_location_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "biochar_products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "formulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"biochar_ratio" real,
	"compost_ratio" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "formulations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"delivery_date" timestamp,
	"status" "delivery_status" DEFAULT 'processing' NOT NULL,
	"order_id" uuid,
	"biochar_product_id" uuid,
	"storage_location_id" uuid,
	"quantity_tons" real,
	"quantity_m3" real,
	"biochar_tons" real,
	"fixed_carbon_percent" real,
	"driver_id" uuid,
	"vehicle_type" text,
	"fuel_type" text,
	"fuel_consumed_liters" real,
	"distance_km" real,
	"emissions_tco2e" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"order_date" timestamp,
	"status" "order_status" DEFAULT 'ordered' NOT NULL,
	"customer_id" uuid,
	"invoice_number" text,
	"formulation_id" uuid,
	"quantity_tons" real,
	"quantity_m3" real,
	"biochar_tons" real,
	"packaging" "packaging_type",
	"value_tzs" real,
	"application_status" text,
	"bulk_density_kg_l" real,
	"c_sink_type" text,
	"compost_per_m3_percent" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "transport_legs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "transport_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"origin_lat" real,
	"origin_lng" real,
	"origin_name" text,
	"destination_lat" real,
	"destination_lng" real,
	"destination_name" text,
	"distance_km" real,
	"transport_method" "transport_method",
	"vehicle_type" text,
	"vehicle_model_year" text,
	"fuel_type" text,
	"fuel_consumed_liters" real,
	"electricity_kwh" real,
	"load_weight_tonnes" real,
	"load_capacity_utilization_percent" real,
	"calculation_method" "emissions_calculation_method",
	"emission_factor_used" real,
	"emission_factor_source" text,
	"emissions_co2e_kg" real,
	"bcu_used" real,
	"bcu_provider" text,
	"bcu_certification_ref" text,
	"bill_of_lading" text,
	"weigh_scale_ticket_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"application_date" timestamp,
	"status" "application_status" DEFAULT 'delivered' NOT NULL,
	"delivery_id" uuid,
	"biochar_applied_tons" real,
	"biochar_dry_matter_tons" real,
	"total_applied_tons" real,
	"gps_lat" real,
	"gps_lng" real,
	"field_size_ha" real,
	"application_method" "application_method",
	"field_identifier" text,
	"gis_boundary_reference" text,
	"durability_option" "durability_option",
	"soil_temperature_c" real,
	"soil_temperature_source" text,
	"f_durable_calculated" real,
	"co2e_stored_tonnes" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "applications_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "soil_temperature_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"measurement_date" date NOT NULL,
	"temperature_c" real NOT NULL,
	"measurement_method" text,
	"measurement_depth_cm" real,
	"measurement_lat" real,
	"measurement_lng" real,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_batch_applications" (
	"credit_batch_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_batch_applications_credit_batch_id_application_id_pk" PRIMARY KEY("credit_batch_id","application_id")
);
--> statement-breakpoint
CREATE TABLE "credit_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"date" date,
	"status" "credit_batch_status" DEFAULT 'pending' NOT NULL,
	"reactor_id" uuid,
	"start_date" timestamp,
	"end_date" timestamp,
	"certifier" text,
	"registry" text,
	"batches_count" integer,
	"weight_tons" real,
	"credits_tco2e" real,
	"value_tzs" real,
	"buffer_pool_percent" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_batches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lab_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_batch_id" uuid NOT NULL,
	"analysis_date" timestamp,
	"analyst_name" text,
	"report_file" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "documentation_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_by" text,
	"notes" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reactors" ADD CONSTRAINT "reactors_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstocks" ADD CONSTRAINT "feedstocks_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstocks" ADD CONSTRAINT "feedstocks_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstocks" ADD CONSTRAINT "feedstocks_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstocks" ADD CONSTRAINT "feedstocks_feedstock_type_id_feedstock_types_id_fk" FOREIGN KEY ("feedstock_type_id") REFERENCES "public"."feedstock_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstocks" ADD CONSTRAINT "feedstocks_storage_location_id_storage_locations_id_fk" FOREIGN KEY ("storage_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_production_run_id_production_runs_id_fk" FOREIGN KEY ("production_run_id") REFERENCES "public"."production_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reactor_id_reactors_id_fk" FOREIGN KEY ("reactor_id") REFERENCES "public"."reactors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_run_readings" ADD CONSTRAINT "production_run_readings_production_run_id_production_runs_id_fk" FOREIGN KEY ("production_run_id") REFERENCES "public"."production_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_reactor_id_reactors_id_fk" FOREIGN KEY ("reactor_id") REFERENCES "public"."reactors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_feedstock_storage_location_id_storage_locations_id_fk" FOREIGN KEY ("feedstock_storage_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_biochar_storage_location_id_storage_locations_id_fk" FOREIGN KEY ("biochar_storage_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_production_run_id_production_runs_id_fk" FOREIGN KEY ("production_run_id") REFERENCES "public"."production_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_reactor_id_reactors_id_fk" FOREIGN KEY ("reactor_id") REFERENCES "public"."reactors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biochar_products" ADD CONSTRAINT "biochar_products_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biochar_products" ADD CONSTRAINT "biochar_products_formulation_id_formulations_id_fk" FOREIGN KEY ("formulation_id") REFERENCES "public"."formulations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biochar_products" ADD CONSTRAINT "biochar_products_biochar_source_storage_id_storage_locations_id_fk" FOREIGN KEY ("biochar_source_storage_id") REFERENCES "public"."storage_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biochar_products" ADD CONSTRAINT "biochar_products_linked_production_run_id_production_runs_id_fk" FOREIGN KEY ("linked_production_run_id") REFERENCES "public"."production_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biochar_products" ADD CONSTRAINT "biochar_products_storage_location_id_storage_locations_id_fk" FOREIGN KEY ("storage_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_biochar_product_id_biochar_products_id_fk" FOREIGN KEY ("biochar_product_id") REFERENCES "public"."biochar_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_storage_location_id_storage_locations_id_fk" FOREIGN KEY ("storage_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_formulation_id_formulations_id_fk" FOREIGN KEY ("formulation_id") REFERENCES "public"."formulations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soil_temperature_measurements" ADD CONSTRAINT "soil_temperature_measurements_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_batch_applications" ADD CONSTRAINT "credit_batch_applications_credit_batch_id_credit_batches_id_fk" FOREIGN KEY ("credit_batch_id") REFERENCES "public"."credit_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_batch_applications" ADD CONSTRAINT "credit_batch_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD CONSTRAINT "credit_batches_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD CONSTRAINT "credit_batches_reactor_id_reactors_id_fk" FOREIGN KEY ("reactor_id") REFERENCES "public"."reactors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_analyses" ADD CONSTRAINT "lab_analyses_credit_batch_id_credit_batches_id_fk" FOREIGN KEY ("credit_batch_id") REFERENCES "public"."credit_batches"("id") ON DELETE no action ON UPDATE no action;