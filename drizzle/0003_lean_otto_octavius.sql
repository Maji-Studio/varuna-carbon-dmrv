ALTER TABLE "facilities" ADD COLUMN "isometric_facility_id" text;--> statement-breakpoint
ALTER TABLE "feedstock_types" ADD COLUMN "isometric_feedstock_type_id" text;--> statement-breakpoint
ALTER TABLE "production_runs" ADD COLUMN "isometric_production_batch_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "truck_mass_on_arrival_kg" real;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "truck_mass_on_departure_kg" real;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "isometric_storage_location_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "isometric_biochar_application_id" text;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "isometric_removal_id" text;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "isometric_ghg_statement_id" text;