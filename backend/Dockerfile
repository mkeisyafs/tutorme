# Stage 1: Build & Dependencies
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package descriptors and lockfile
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy Prisma files and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN bunx prisma generate

# Copy source code and TypeScript config
COPY src ./src
COPY tsconfig.json ./

# Stage 2: Production Runner
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy application artifacts from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["bun", "run", "src/index.ts"]
