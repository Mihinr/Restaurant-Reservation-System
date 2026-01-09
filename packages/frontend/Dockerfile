# Multi-stage build for Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src

# Copy frontend package files
COPY packages/frontend/package.json packages/frontend/
COPY packages/frontend/tsconfig.json packages/frontend/
COPY packages/frontend/tsconfig.node.json packages/frontend/
COPY packages/frontend/vite.config.ts packages/frontend/
COPY packages/frontend/tailwind.config.js packages/frontend/
COPY packages/frontend/postcss.config.js packages/frontend/
COPY packages/frontend/index.html packages/frontend/

# Install dependencies
WORKDIR /app
RUN npm ci

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Copy frontend source
WORKDIR /app
COPY packages/frontend/src packages/frontend/src
# Copy public directory if it exists (Vite public folder is optional)
COPY packages/frontend/public packages/frontend/public

# Build frontend
WORKDIR /app/packages/frontend
ENV VITE_API_URL=http://localhost:3001
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Install curl for health check
RUN apk add --no-cache curl

# Copy built assets
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
