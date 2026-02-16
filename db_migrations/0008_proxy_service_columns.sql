ALTER TABLE "proxy" ADD COLUMN "name" text NOT NULL DEFAULT '';
ALTER TABLE "proxy" ADD COLUMN "service_type" text NOT NULL DEFAULT 'proxy';
ALTER TABLE "proxy" ADD COLUMN "certificate_id" uuid;
ALTER TABLE "proxy" ADD COLUMN "custom_cert_path" text;
ALTER TABLE "proxy" ADD COLUMN "custom_key_path" text;
ALTER TABLE "proxy" ADD COLUMN "listen_port" integer NOT NULL DEFAULT 443;
ALTER TABLE "proxy" ADD COLUMN "listen_protocol" text NOT NULL DEFAULT 'https';
ALTER TABLE "proxy" ADD COLUMN "file_serve_path" text;

-- Fix public_urls from jsonb[] to plain jsonb (must drop default first)
ALTER TABLE "proxy" ALTER COLUMN "public_urls" DROP DEFAULT;
ALTER TABLE "proxy" ALTER COLUMN "public_urls" TYPE jsonb USING COALESCE(public_urls[1], '[]'::jsonb);
ALTER TABLE "proxy" ALTER COLUMN "public_urls" SET DEFAULT '[]'::jsonb;
ALTER TABLE "proxy" ALTER COLUMN "public_urls" SET NOT NULL;

-- Make proxy_host_url optional (file services don't need it)
ALTER TABLE "proxy" ALTER COLUMN "proxy_host_url" SET DEFAULT '';
