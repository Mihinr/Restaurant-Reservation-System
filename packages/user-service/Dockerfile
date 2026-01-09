# Multi-stage build for User Service
FROM node:18 AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src

# Copy user-service package files
COPY packages/user-service/package.json packages/user-service/
COPY packages/user-service/tsconfig.json packages/user-service/

# Install dependencies
WORKDIR /app
RUN npm ci

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Copy user-service source
WORKDIR /app
COPY packages/user-service/src packages/user-service/src
COPY packages/user-service/prisma packages/user-service/prisma

# Generate Prisma client before building
WORKDIR /app/packages/user-service
RUN npx prisma generate

# Build user service
WORKDIR /app/packages/user-service
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

# Copy user-service package files
COPY packages/user-service/package.json packages/user-service/
COPY packages/user-service/tsconfig.json packages/user-service/
COPY packages/user-service/prisma packages/user-service/prisma

# Install production dependencies only
WORKDIR /app
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/packages/user-service/dist packages/user-service/dist

# Generate Prisma client
WORKDIR /app/packages/user-service
RUN npx prisma generate

# Change ownership to non-root user
WORKDIR /app
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/packages/user-service

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/server.js"]
