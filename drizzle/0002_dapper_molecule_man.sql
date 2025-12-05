ALTER TABLE "credit_batches" ADD COLUMN "soil_temperature_c" real;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "soil_temperature_source" text;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "f_durable_calculated" real;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "soil_temperature_c";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "soil_temperature_source";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "f_durable_calculated";