-- Add food cache table for storing OCR results and product information
CREATE TABLE "food_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_hash" varchar(64) NOT NULL UNIQUE,
	"brand" varchar(200),
	"product_name" varchar(300),
	"flavor" varchar(200),
	"extracted_text" text NOT NULL,
	"detected_species" varchar(20) NOT NULL,
	"ingredients" jsonb DEFAULT '[]'::jsonb,
	"nutritional_info" jsonb DEFAULT '{}'::jsonb,
	"target_species" varchar(50),
	"lifestage" varchar(50),
	"ocr_confidence" numeric(3, 2),
	"scan_count" integer DEFAULT 1,
	"first_scanned_at" timestamp DEFAULT now() NOT NULL,
	"last_scanned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "food_cache_product_hash_idx" ON "food_cache" USING btree ("product_hash");
--> statement-breakpoint
CREATE INDEX "food_cache_brand_idx" ON "food_cache" USING btree ("brand");
--> statement-breakpoint
CREATE INDEX "food_cache_product_name_idx" ON "food_cache" USING btree ("product_name");
--> statement-breakpoint
CREATE INDEX "food_cache_detected_species_idx" ON "food_cache" USING btree ("detected_species");
--> statement-breakpoint
CREATE INDEX "food_cache_last_scanned_idx" ON "food_cache" USING btree ("last_scanned_at");