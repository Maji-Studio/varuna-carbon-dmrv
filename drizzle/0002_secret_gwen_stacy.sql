CREATE TABLE "feedstock_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"status" "feedstock_status" DEFAULT 'missing_data' NOT NULL,
	"delivery_date" timestamp,
	"supplier_id" uuid,
	"driver_id" uuid,
	"vehicle_type" text,
	"fuel_type" text,
	"fuel_consumed_liters" real,
	"transport_emissions_tco2e" real,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedstock_deliveries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "feedstocks" ADD COLUMN "feedstock_delivery_id" uuid;--> statement-breakpoint
ALTER TABLE "feedstock_deliveries" ADD CONSTRAINT "feedstock_deliveries_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstock_deliveries" ADD CONSTRAINT "feedstock_deliveries_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstock_deliveries" ADD CONSTRAINT "feedstock_deliveries_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedstocks" ADD CONSTRAINT "feedstocks_feedstock_delivery_id_feedstock_deliveries_id_fk" FOREIGN KEY ("feedstock_delivery_id") REFERENCES "public"."feedstock_deliveries"("id") ON DELETE no action ON UPDATE no action;