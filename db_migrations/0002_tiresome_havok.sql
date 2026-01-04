CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "core_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "core_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "core_users" CASCADE;--> statement-breakpoint
DROP TABLE "core_verifications" CASCADE;--> statement-breakpoint
DROP TABLE "jwks" CASCADE;--> statement-breakpoint
DROP TABLE "sso_provider" CASCADE;