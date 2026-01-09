# Docker Setup Guide - Restaurant Reservation System

This guide will help you set up and run the Restaurant Reservation System using Docker and Docker Compose.

## Prerequisites

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **Git** (to clone the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Restaurant-Reservation-System
```

### 2. Configure Environment Variables (Required)

**IMPORTANT:** You must create a root-level `.env` file in the project root directory. Docker Compose requires `MYSQL_ROOT_PASSWORD` to be explicitly defined; there are no default values.

Create a `.env` file in the root directory:

```env
MYSQL_ROOT_PASSWORD=your-secure-password-here

```

**Critical Notes:**
- **Root `.env` file is REQUIRED** - Docker Compose will fail if `MYSQL_ROOT_PASSWORD` is not set
- **No default values** - All environment variables must be explicitly defined in the root `.env` file
- **Single source of truth** - The root `.env` file is the only place Docker Compose reads environment variables from
- **Service-level `.env` files are NOT read by Docker** - Service-level `.env` files (e.g., `packages/user-service/.env`) are used only for local development when running services without Docker, and are ignored by Docker Compose
- Use a strong, secure password for `MYSQL_ROOT_PASSWORD`
- Generate secure random strings for JWT secrets (minimum 32 characters)

### 3. Create Database Migrations (First Time Only)

Before starting services, you need to create migration files locally. Connect to the Docker MySQL container:

**Step 3.1: Start MySQL Container Only**

```bash
docker-compose up -d mysql
```

Wait for MySQL to be healthy (check with `docker-compose ps mysql`).

**Step 3.2: Create Temporary .env Files for Local Migration**

Create `.env` files in each service directory to connect to Docker MySQL. **Important:** Use the same password value from your root `.env` file's `MYSQL_ROOT_PASSWORD`:

```bash
# User Service (replace 'your-password' with your actual MYSQL_ROOT_PASSWORD from root .env)
echo 'DATABASE_URL="mysql://root:your-password@localhost:3306/restaurant_user_service"' > packages/user-service/.env

# Reservation Service
echo 'DATABASE_URL="mysql://root:your-password@localhost:3306/restaurant_reservation_service"' > packages/reservation-service/.env

# Table Service
echo 'DATABASE_URL="mysql://root:your-password@localhost:3306/restaurant_table_service"' > packages/table-service/.env
```

**Note:** These service-level `.env` files are temporary and only used for creating migrations locally. Docker Compose does NOT read these files; it only reads the root `.env` file. Replace `your-password` with the exact value from your root `.env` file's `MYSQL_ROOT_PASSWORD`.

**Step 3.3: Create Migrations**

```bash
# User Service
cd packages/user-service
npm run db:migrate:dev
# When prompted, enter: init
cd ../..

# Reservation Service
cd packages/reservation-service
npm run db:migrate:dev
# When prompted, enter: init
cd ../..

# Table Service
cd packages/table-service
npm run db:migrate:dev
# When prompted, enter: init
cd ../..
```

This creates the `prisma/migrations` directory with migration files that will be copied into Docker images.

### 4. Build and Start All Services

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 5. Initialize Databases

After services start, apply migrations and seed databases:

```bash
# Apply migrations (uses prisma migrate deploy - production-safe)
docker-compose exec user-service npm run db:migrate
docker-compose exec reservation-service npm run db:migrate
docker-compose exec table-service npm run db:migrate

# Seed databases with test data
docker-compose exec user-service npm run db:seed
docker-compose exec reservation-service npm run db:seed
docker-compose exec table-service npm run db:seed
```

**Note:** The `db:migrate` script uses `prisma migrate deploy` which applies existing migrations without regenerating the Prisma client (already generated during build). This avoids permission issues in production containers.

### 6. Access the Application

Once all services are running:

- **Frontend:** http://localhost:3000 (production) or http://localhost:5173 (development)
- **User Service:** http://localhost:3001
- **Reservation Service:** http://localhost:3002
- **Table Service:** http://localhost:3003
- **MySQL:** localhost:3306

## Service Details

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000/5173 | React application (Nginx in production, Vite dev server in development) |
| User Service | 3001 | Authentication and user management |
| Reservation Service | 3002 | Reservation and waitlist management |
| Table Service | 3003 | Restaurant and table management |
| MySQL | 3306 | Database server |

### Database Structure

The system uses three separate MySQL databases:
- `restaurant_user_service` - User authentication data
- `restaurant_reservation_service` - Reservations and waitlists
- `restaurant_table_service` - Restaurants and tables

Databases are automatically created on first startup via the initialization script.

## Docker Commands

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f user-service

# Restart a specific service
docker-compose restart user-service

# Rebuild and restart
docker-compose up -d --build
```

### Development Mode

```bash
# Start in development mode
docker-compose -f docker-compose.dev.yml up

# Stop development services
docker-compose -f docker-compose.dev.yml down

# View development logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Database Operations

```bash
# Apply migrations (production-safe, uses prisma migrate deploy)
docker-compose exec user-service npm run db:migrate
docker-compose exec reservation-service npm run db:migrate
docker-compose exec table-service npm run db:migrate

# Seed databases (populates with test data)
docker-compose exec user-service npm run db:seed
docker-compose exec reservation-service npm run db:seed
docker-compose exec table-service npm run db:seed

# Access MySQL CLI (password is taken from root .env file)
docker-compose exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD}

# Backup database
docker-compose exec mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} restaurant_user_service > backup_user.sql
```

**Note:** In these commands, `${MYSQL_ROOT_PASSWORD}` reads from your root `.env` file. If you're running these commands in a shell that doesn't have access to the environment variable, you'll need to export it first or specify the password directly.

**Note:** To create new migrations, do so locally using `npm run db:migrate:dev` in each service directory, then rebuild Docker images.

### Service Management

```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Execute command in service
docker-compose exec user-service sh
```

## Environment Variables

### Root `.env` File (Required)

The root `.env` file is **REQUIRED** and is the **single source of truth** for environment variables when using Docker Compose:

```env
MYSQL_ROOT_PASSWORD=your-secure-password-here

```

**Critical Information:**
- **Root `.env` file is REQUIRED** - Docker Compose will fail if `MYSQL_ROOT_PASSWORD` is not set
- **No default values** - All environment variables must be explicitly defined
- **Single source of truth** - Docker Compose reads ONLY from the root `.env` file
- **Service-level `.env` files are NOT read by Docker** - Files like `packages/user-service/.env` are for local development only (when running without Docker) and are completely ignored by Docker Compose
- The application code inside containers uses `process.env` values provided by Docker Compose from the root `.env` file

## Volumes and Data Persistence

### Named Volumes

- `mysql_data` - MySQL data persistence (production)
- `mysql_data_dev` - MySQL data persistence (development)

Data persists across container restarts. To completely reset:

```bash
# WARNING: This deletes all data
docker-compose down -v
```

### Volume Mounts (Development)

In development mode (`docker-compose.dev.yml`), source code is mounted as volumes for hot reload.

## Network Configuration

All services communicate through Docker bridge network `restaurant-network`. Services can reach each other using service names (e.g., `mysql:3306`, `user-service:3001`).

## Troubleshooting

### Services Won't Start

1. **Check for missing MYSQL_ROOT_PASSWORD:**
   If you see errors about missing environment variables or authentication failures, ensure you have a root `.env` file with `MYSQL_ROOT_PASSWORD` defined:
   ```bash
   # Check if root .env file exists
   ls -la .env
   
   # Verify MYSQL_ROOT_PASSWORD is set
   grep MYSQL_ROOT_PASSWORD .env
   ```
   
   **Solution:** Create a root `.env` file if it doesn't exist, or add `MYSQL_ROOT_PASSWORD=your-password` to it. There are no default values - the variable must be explicitly defined.

2. **Check logs:**
   ```bash
   docker-compose logs
   ```

3. **Verify environment variables:**
   ```bash
   docker-compose config
   ```
   This will show any missing required environment variables and fail if `MYSQL_ROOT_PASSWORD` is not set.

4. **Check port conflicts:**
   ```bash
   # Check if ports are in use
   netstat -an | grep 3001
   netstat -an | grep 3306
   ```

### Database Connection Issues

1. **Wait for MySQL to be healthy:**
   ```bash
   docker-compose ps mysql
   # Should show "healthy" status
   ```

2. **Check MySQL logs:**
   ```bash
   docker-compose logs mysql
   ```

3. **Test connection:**
   ```bash
   docker-compose exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
   ```

### Migration Issues

1. **Ensure services are running:**
   ```bash
   docker-compose ps
   ```

2. **If migrations don't exist:**
   - Migrations must be created locally first using `npm run db:migrate:dev`
   - See Step 4 in Quick Start section for creating migrations

3. **Run migrations in containers:**
   ```bash
   docker-compose exec user-service npm run db:migrate
   docker-compose exec reservation-service npm run db:migrate
   docker-compose exec table-service npm run db:migrate
   ```

4. **If you see "No migration found":**
   - Ensure `prisma/migrations` directory exists with migration files
   - Rebuild Docker images: `docker-compose build`
   - Migration files are copied during build process

### Build Issues

1. **Clean build:**
   ```bash
   docker-compose build --no-cache
   ```

2. **Check Dockerfile syntax:**
   ```bash
   docker-compose config
   ```

3. **Verify shared package:**
   ```bash
   # Ensure shared package is built
   cd packages/shared && npm run build
   ```

### Frontend Not Loading

1. **Check frontend logs:**
   ```bash
   docker-compose logs frontend
   ```

2. **Verify API URL:**
   - Check `VITE_API_URL` in `.env`
   - Ensure backend services are running

3. **Rebuild frontend:**
   ```bash
   docker-compose up -d --build frontend
   ```

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Create root `.env` file with `MYSQL_ROOT_PASSWORD` set to a strong password (REQUIRED, no default values)
- [ ] Generate secure random strings for JWT secrets (minimum 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Update `VITE_API_URL` to your production domain
- [ ] Review and restrict exposed ports
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Enable database backups
- [ ] Review Docker security best practices

### Production Build

```bash
# Build production images
docker-compose build

# Start in production mode
docker-compose up -d

# Verify all services are running
docker-compose ps
```

## Monitoring

### Health Checks

All services include health check endpoints:
- User Service: `http://localhost:3001/health`
- Reservation Service: `http://localhost:3002/health`
- Table Service: `http://localhost:3003/health`

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service

# Last 100 lines
docker-compose logs --tail=100 user-service
```

### Resource Usage

```bash
# View container resource usage
docker stats

# View disk usage
docker system df
```

## Backup and Restore

### Backup Databases

```bash
# Backup all databases (password is read from root .env file)
docker-compose exec mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} restaurant_user_service > backup_user_$(date +%Y%m%d).sql
docker-compose exec mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} restaurant_reservation_service > backup_reservation_$(date +%Y%m%d).sql
docker-compose exec mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} restaurant_table_service > backup_table_$(date +%Y%m%d).sql
```

### Restore Databases

```bash
# Restore database (password is read from root .env file)
docker-compose exec -T mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} restaurant_user_service < backup_user_20240108.sql
```

## Cleanup

### Remove All Containers and Volumes

```bash
# WARNING: This deletes all data
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### Clean Docker System

```bash
# Remove unused containers, networks, images
docker system prune

# Remove everything including volumes
docker system prune -a --volumes
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify environment variables: `docker-compose config`
3. Ensure all prerequisites are installed
4. Check Docker and Docker Compose versions
5. Review the troubleshooting section above

---

**Last Updated:** 2026-01-10
