CREATE TABLE "proxy" (
	"id" uuid PRIMARY KEY NOT NULL,
	"public_urls" jsonb[] DEFAULT '{}',
	"certificate_origin" text NOT NULL,
	"other_settings" text DEFAULT '{}' NOT NULL,
	"allow_websocket" boolean DEFAULT false NOT NULL,
	"cache_assets" boolean DEFAULT false NOT NULL,
	"proxy_host_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
