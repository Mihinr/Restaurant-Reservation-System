#!/bin/bash

# Docker Setup Script for Restaurant Reservation System
# This script helps set up and initialize the Docker environment

set -e

echo "🚀 Restaurant Reservation System - Docker Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file and update the following:${NC}"
        echo "   - MYSQL_ROOT_PASSWORD"
        echo "   - JWT_SECRET (minimum 32 characters)"
        echo "   - REFRESH_TOKEN_SECRET (minimum 32 characters)"
        echo ""
        read -p "Press Enter to continue after updating .env file..."
    else
        echo -e "${RED}❌ .env.example file not found. Please create .env file manually.${NC}"
        exit 1
    fi
fi

echo ""
echo "📦 Building Docker images..."
echo ""

# Build images
if docker-compose build; then
    echo -e "${GREEN}✅ Docker images built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Docker images${NC}"
    exit 1
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start services
if docker-compose up -d; then
    echo -e "${GREEN}✅ Services started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

echo ""
echo "⏳ Waiting for MySQL to be ready..."
echo ""

# Wait for MySQL to be healthy
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo -e "${GREEN}✅ MySQL is ready${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS..."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ MySQL did not become ready in time${NC}"
    exit 1
fi

echo ""
echo "🗄️  Running database migrations..."
echo ""

# Run migrations
SERVICES=("user-service" "reservation-service" "table-service")
for SERVICE in "${SERVICES[@]}"; do
    echo "   Migrating $SERVICE..."
    if docker-compose exec -T $SERVICE npm run db:migrate; then
        echo -e "${GREEN}   ✅ $SERVICE migrated${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $SERVICE migration failed (may already be migrated)${NC}"
    fi
done

echo ""
echo "🌱 Seeding databases..."
echo ""

# Seed databases
for SERVICE in "${SERVICES[@]}"; do
    echo "   Seeding $SERVICE..."
    if docker-compose exec -T $SERVICE npm run db:seed; then
        echo -e "${GREEN}   ✅ $SERVICE seeded${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $SERVICE seeding failed (may already be seeded)${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "📋 Service URLs:"
echo "   - Frontend:        http://localhost:3000"
echo "   - User Service:   http://localhost:3001"
echo "   - Reservation:    http://localhost:3002"
echo "   - Table Service:  http://localhost:3003"
echo "   - MySQL:          localhost:3306"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:      docker-compose logs -f"
echo "   - Stop services:  docker-compose down"
echo "   - Restart:        docker-compose restart"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
