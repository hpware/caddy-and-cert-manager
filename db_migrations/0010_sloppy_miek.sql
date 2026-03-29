ALTER TABLE "session_tokens" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session_tokens" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "subject_alt_names" jsonb DEFAULT '[]'::jsonb NOT NULL;