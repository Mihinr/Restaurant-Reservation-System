# Multi-stage build for Reservation Service
FROM node:18 AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src

# Copy reservation-service package files
COPY packages/reservation-service/package.json packages/reservation-service/
COPY packages/reservation-service/tsconfig.json packages/reservation-service/

# Install dependencies
WORKDIR /app
RUN npm ci

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Copy reservation-service source
WORKDIR /app
COPY packages/reservation-service/src packages/reservation-service/src
COPY packages/reservation-service/prisma packages/reservation-service/prisma

# Generate Prisma client before building
WORKDIR /app/packages/reservation-service
RUN npx prisma generate

# Build reservation service
WORKDIR /app/packages/reservation-service
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

# Copy reservation-service package files
COPY packages/reservation-service/package.json packages/reservation-service/
COPY packages/reservation-service/tsconfig.json packages/reservation-service/
COPY packages/reservation-service/prisma packages/reservation-service/prisma

# Install production dependencies only
WORKDIR /app
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/packages/reservation-service/dist packages/reservation-service/dist

# Generate Prisma client
WORKDIR /app/packages/reservation-service
RUN npx prisma generate

# Change ownership to non-root user
WORKDIR /app
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/packages/reservation-service

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/server.js"]
