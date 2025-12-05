ALTER TABLE "credit_batches" ADD COLUMN "durability_option" "durability_option";--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "site_management_notes" text;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "affidavit_reference" text;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "intended_use_confirmation" text;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "company_verification_ref" text;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD COLUMN "mixing_timeline_days" integer;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "durability_option";