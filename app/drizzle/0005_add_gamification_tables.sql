-- Migration: Add gamification and enhancement tables
-- Created: 2025-01-16
-- Description: Adds tables for user achievements, pet health scores, food comparisons, user streaks, and pet analytics

CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_type" varchar(50) NOT NULL,
	"achievement_key" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"icon_url" text,
	"points" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"progress" integer DEFAULT 0,
	"max_progress" integer DEFAULT 1,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "pet_health_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"overall_score" integer NOT NULL,
	"nutrition_score" integer NOT NULL,
	"activity_score" integer NOT NULL,
	"health_trend" varchar(20) NOT NULL,
	"factors" jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "food_comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pet_id" uuid,
	"comparison_name" varchar(200),
	"food_items" jsonb NOT NULL,
	"winner" jsonb,
	"comparison_matrix" jsonb,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"is_bookmarked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "user_streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"streak_type" varchar(50) NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"streak_start_date" timestamp,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "pet_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"analytics_date" timestamp NOT NULL,
	"feeding_stats" jsonb NOT NULL,
	"health_metrics" jsonb,
	"behavior_patterns" jsonb,
	"insights" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "pet_health_scores" ADD CONSTRAINT "pet_health_scores_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "food_comparisons" ADD CONSTRAINT "food_comparisons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "food_comparisons" ADD CONSTRAINT "food_comparisons_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "pet_analytics" ADD CONSTRAINT "pet_analytics_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements" USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX "user_achievements_type_idx" ON "user_achievements" USING btree ("achievement_type");
--> statement-breakpoint

CREATE INDEX "user_achievements_completed_idx" ON "user_achievements" USING btree ("is_completed");
--> statement-breakpoint

CREATE INDEX "pet_health_scores_pet_id_idx" ON "pet_health_scores" USING btree ("pet_id");
--> statement-breakpoint

CREATE INDEX "pet_health_scores_calculated_at_idx" ON "pet_health_scores" USING btree ("calculated_at");
--> statement-breakpoint

CREATE INDEX "food_comparisons_user_id_idx" ON "food_comparisons" USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX "food_comparisons_pet_id_idx" ON "food_comparisons" USING btree ("pet_id");
--> statement-breakpoint

CREATE INDEX "food_comparisons_created_at_idx" ON "food_comparisons" USING btree ("created_at");
--> statement-breakpoint

CREATE INDEX "food_comparisons_bookmarked_idx" ON "food_comparisons" USING btree ("is_bookmarked");
--> statement-breakpoint

CREATE INDEX "user_streaks_user_id_idx" ON "user_streaks" USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX "user_streaks_type_idx" ON "user_streaks" USING btree ("streak_type");
--> statement-breakpoint

CREATE INDEX "user_streaks_active_idx" ON "user_streaks" USING btree ("is_active");
--> statement-breakpoint

CREATE INDEX "pet_analytics_pet_id_idx" ON "pet_analytics" USING btree ("pet_id");
--> statement-breakpoint

CREATE INDEX "pet_analytics_date_idx" ON "pet_analytics" USING btree ("analytics_date");
--> statement-breakpoint