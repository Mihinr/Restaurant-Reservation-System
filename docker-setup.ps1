# Docker Setup Script for Restaurant Reservation System (PowerShell)
# This script helps set up and initialize the Docker environment on Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Restaurant Reservation System - Docker Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env file and update the following:" -ForegroundColor Yellow
        Write-Host "   - MYSQL_ROOT_PASSWORD"
        Write-Host "   - JWT_SECRET (minimum 32 characters)"
        Write-Host "   - REFRESH_TOKEN_SECRET (minimum 32 characters)"
        Write-Host ""
        Read-Host "Press Enter to continue after updating .env file"
    } else {
        Write-Host "❌ .env.example file not found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📦 Building Docker images..." -ForegroundColor Cyan
Write-Host ""

# Build images
try {
    docker-compose build
    Write-Host "✅ Docker images built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start services
try {
    docker-compose up -d
    Write-Host "✅ Services started successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for MySQL to be ready..." -ForegroundColor Cyan
Write-Host ""

# Wait for MySQL to be healthy
$maxAttempts = 30
$attempt = 0
$mysqlReady = $false

while ($attempt -lt $maxAttempts) {
    try {
        $result = docker-compose exec -T mysql mysqladmin ping -h localhost 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MySQL is ready" -ForegroundColor Green
            $mysqlReady = $true
            break
        }
    } catch {
        # Continue waiting
    }
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts..."
    Start-Sleep -Seconds 2
}

if (-not $mysqlReady) {
    Write-Host "❌ MySQL did not become ready in time" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
Write-Host ""

# Run migrations
$services = @("user-service", "reservation-service", "table-service")
foreach ($service in $services) {
    Write-Host "   Migrating $service..."
    try {
        docker-compose exec -T $service npm run db:migrate
        Write-Host "   ✅ $service migrated" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  $service migration failed (may already be migrated)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🌱 Seeding databases..." -ForegroundColor Cyan
Write-Host ""

# Seed databases
foreach ($service in $services) {
    Write-Host "   Seeding $service..."
    try {
        docker-compose exec -T $service npm run db:seed
        Write-Host "   ✅ $service seeded" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  $service seeding failed (may already be seeded)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   - Frontend:        http://localhost:3000"
Write-Host "   - User Service:   http://localhost:3001"
Write-Host "   - Reservation:    http://localhost:3002"
Write-Host "   - Table Service:  http://localhost:3003"
Write-Host "   - MySQL:          localhost:3306"
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   - View logs:      docker-compose logs -f"
Write-Host "   - Stop services:  docker-compose down"
Write-Host "   - Restart:        docker-compose restart"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
