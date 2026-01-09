# Multi-stage build for Table Service
FROM node:18 AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src

# Copy table-service package files
COPY packages/table-service/package.json packages/table-service/
COPY packages/table-service/tsconfig.json packages/table-service/

# Install dependencies
WORKDIR /app
RUN npm ci

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Copy table-service source
WORKDIR /app
COPY packages/table-service/src packages/table-service/src
COPY packages/table-service/prisma packages/table-service/prisma

# Generate Prisma client before building
WORKDIR /app/packages/table-service
RUN npx prisma generate

# Build table service
WORKDIR /app/packages/table-service
RUN npm run build

# Production stage
FROM node:18

WORKDIR /app

# Create non-root user
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Copy root package files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist packages/shared/dist

# Copy table-service package files
COPY packages/table-service/package.json packages/table-service/
COPY packages/table-service/tsconfig.json packages/table-service/
COPY packages/table-service/prisma packages/table-service/prisma

# Install production dependencies only
WORKDIR /app
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/packages/table-service/dist packages/table-service/dist

# Generate Prisma client
WORKDIR /app/packages/table-service
RUN npx prisma generate

# Change ownership to non-root user
WORKDIR /app
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/packages/table-service

EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/server.js"]
