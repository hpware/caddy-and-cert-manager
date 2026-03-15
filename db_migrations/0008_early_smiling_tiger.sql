CREATE TABLE "session_tokens" (
	"id" text NOT NULL,
	"linked_to_user" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_tokens" ADD CONSTRAINT "session_tokens_linked_to_user_user_id_fk" FOREIGN KEY ("linked_to_user") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;