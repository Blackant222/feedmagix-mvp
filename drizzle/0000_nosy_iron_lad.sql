CREATE TABLE "api_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"response_time" integer,
	"user_agent" text,
	"ip_address" varchar(45),
	"request_size" integer,
	"response_size" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pet_id" uuid,
	"type" varchar(20) NOT NULL,
	"input_method" varchar(20) NOT NULL,
	"input_data" jsonb NOT NULL,
	"analysis_result" jsonb,
	"processing_time" integer,
	"confidence" numeric(3, 2),
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"species" varchar(50) NOT NULL,
	"breed" varchar(100),
	"age" integer,
	"weight" numeric(5, 2),
	"activity_level" varchar(20),
	"health_conditions" jsonb DEFAULT '[]'::jsonb,
	"allergies" jsonb DEFAULT '[]'::jsonb,
	"current_food" text,
	"feeding_schedule" jsonb,
	"avatar_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"refresh_expires_at" timestamp NOT NULL,
	"device_info" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "user_sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(100),
	"avatar_url" text,
	"is_email_verified" boolean DEFAULT false,
	"preferences" jsonb DEFAULT '{"language":"fa","theme":"system","notifications":{"email":true,"push":true,"analysis":true,"reminders":true},"privacy":{"shareData":false,"analytics":true}}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webauthn_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" varchar(50),
	"backed_up" boolean DEFAULT false,
	"transports" jsonb,
	"friendly_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_analyses" ADD CONSTRAINT "food_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_analyses" ADD CONSTRAINT "food_analyses_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_usage_logs_user_id_idx" ON "api_usage_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_usage_logs_endpoint_idx" ON "api_usage_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "api_usage_logs_created_at_idx" ON "api_usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_usage_logs_ip_address_idx" ON "api_usage_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "food_analyses_user_id_idx" ON "food_analyses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "food_analyses_pet_id_idx" ON "food_analyses" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "food_analyses_type_idx" ON "food_analyses" USING btree ("type");--> statement-breakpoint
CREATE INDEX "food_analyses_created_at_idx" ON "food_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "food_analyses_favorite_idx" ON "food_analyses" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "pets_user_id_idx" ON "pets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pets_species_idx" ON "pets" USING btree ("species");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_session_token_idx" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webauthn_credentials_user_id_idx" ON "webauthn_credentials" USING btree ("user_id");