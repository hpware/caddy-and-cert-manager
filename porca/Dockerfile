# install
FROM oven/bun:latest AS builder
WORKDIR /app
COPY . .
RUN bun install

# prod
FROM oven/bun:debian
WORKDIR /app

RUN apt-get update && apt-get install -y libssl-dev openssl
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.ts ./index.ts
EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "index.ts"]
