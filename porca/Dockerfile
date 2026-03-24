# install
FROM oven/bun:latest AS builder
WORKDIR /app
COPY . .
RUN bun install && bun build index.ts --minify --target=bun --outfile=index.js

# prod
FROM oven/bun:debian
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libssl-dev openssl curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r porca && useradd -r -g porca -d /app porca && \
    chown -R porca:porca /app
ENV NODE_ENV=production
COPY --from=builder --chown=porca:porca /app/index.js ./index.js
EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

USER porca
CMD ["bun", "run", "index.js"]
