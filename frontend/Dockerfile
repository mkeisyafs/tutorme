# Stage 1: Build static React SPA
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package descriptors and lockfile
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code and configuration files
COPY . .

# Build production SPA assets
RUN bun run build

# Stage 2: Serve static files with Nginx
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
