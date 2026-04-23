CREATE TABLE "certificate_group" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject_alt_names" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "proxy" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session_tokens" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "proxy" CASCADE;--> statement-breakpoint
DROP TABLE "session_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "group" uuid;--> statement-breakpoint
ALTER TABLE "certificate_group" ADD CONSTRAINT "certificate_group_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_group_certificate_group_id_fk" FOREIGN KEY ("group") REFERENCES "public"."certificate_group"("id") ON DELETE no action ON UPDATE no action;