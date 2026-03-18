# install
FROM oven/bun:latest AS builder
WORKDIR /app
COPY . .
RUN bun install

# prod
FROM oven/bun:debian
WORKDIR /app

RUN apt-get update && apt-get install -y libssl-dev openssl && \
    groupadd -r porca && useradd -r -g porca -d /app porca && \
    chown -R porca:porca /app
ENV NODE_ENV=production
COPY --from=builder --chown=porca:porca /app/package.json ./package.json
COPY --from=builder --chown=porca:porca /app/node_modules ./node_modules
COPY --from=builder --chown=porca:porca /app/index.ts ./index.ts
EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

USER porca
CMD ["bun", "run", "index.ts"]
