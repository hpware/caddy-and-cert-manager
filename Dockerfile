# install
FROM oven/bun:latest AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# prod
FROM oven/bun:debian
WORKDIR /app

RUN apt-get update && apt-get install -y libssl-dev openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/db_migrations ./db_migrations
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bunx", "drizzle-kit", "migrate", "&&", "bun", "start"]
