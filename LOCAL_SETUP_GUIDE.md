# Local Development Setup Guide

This guide will help you set up the Restaurant Reservation System on your local machine **without Docker**.

**Important:** If you're using Docker, see the [Docker Setup Guide](DOCKER_SETUP_GUIDE.md) instead. Docker requires a **root-level `.env` file** with `MYSQL_ROOT_PASSWORD` and does not read service-level `.env` files. This guide is for running services directly on your machine.

## Prerequisites

### 1. Node.js and npm

**Required Versions:**
- **Node.js:** 18.0.0 or higher
- **npm:** 9.0.0 or higher
```
### 2. MySQL Database

**Required Version:**
- **MySQL:** 8.0 or higher

**Verify Installation:**
```bash
mysql --version  # Should show 8.0.x or higher
```

## Installation Steps

### Step 1: Clone the Repository (if not already done)

```bash
git clone <repository-url>
cd Restaurant-Reservation-System
```

### Step 2: Install Node.js Dependencies

From the root directory, run:

```bash
npm install
```

This will install all dependencies for:
- Root workspace
- User Service
- Reservation Service
- Table Service
- Frontend
- Shared package

**Note:** This may take a few minutes as it installs all packages for all services.

### Step 3: Set Up MySQL Databases

Connect to MySQL:

```bash
# Windows (if MySQL is in PATH)
mysql -u root -p

# Mac/Linux
sudo mysql -u root -p
```

Create the three databases:

```sql
CREATE DATABASE restaurant_user_service;
CREATE DATABASE restaurant_reservation_service;
CREATE DATABASE restaurant_table_service;

-- Verify databases were created
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### Step 4: Configure Environment Variables

**Important:** This step is for **local development without Docker**. When using Docker, you need a **root-level `.env` file** (see Docker Setup Guide). Service-level `.env` files are used only when running services directly on your machine.

Create `.env` files in each service directory:

**packages/user-service/.env:**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="mysql://root:your-mysql-password@localhost:3306/restaurant_user_service"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-minimum-32-characters"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-minimum-32-characters"
REFRESH_TOKEN_EXPIRES_IN="7d"
LOG_LEVEL="info"
```

**packages/reservation-service/.env:**
```env
NODE_ENV=development
PORT=3002
DATABASE_URL="mysql://root:your-mysql-password@localhost:3306/restaurant_reservation_service"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-minimum-32-characters"
TABLE_SERVICE_URL="http://localhost:3003"
LOG_LEVEL="info"
```

**packages/table-service/.env:**
```env
NODE_ENV=development
PORT=3003
DATABASE_URL="mysql://root:your-mysql-password@localhost:3306/restaurant_table_service"
RESERVATION_SERVICE_URL="http://localhost:3002"
LOG_LEVEL="info"
```

**packages/frontend/.env** (optional, for Vite):
```env
VITE_API_URL=http://localhost:3001
VITE_TABLE_SERVICE_URL=http://localhost:3003
```

**Important Notes:**
- Replace `your-mysql-password` with your actual MySQL root password
- These service-level `.env` files are **NOT read by Docker** - Docker Compose uses only the root `.env` file
- For Docker usage, create a root-level `.env` file with `MYSQL_ROOT_PASSWORD` (see Docker Setup Guide)
- Ensure JWT secrets are at least 32 characters long
- Use the same `JWT_SECRET` in user-service and reservation-service

### Step 5: Generate Prisma Clients

Each service needs its Prisma client generated:

```bash
# User Service
cd packages/user-service
npx prisma generate
cd ../..

# Reservation Service
cd packages/reservation-service
npx prisma generate
cd ../..

# Table Service
cd packages/table-service
npx prisma generate
cd ../..
```


### Step 6: Run Database Migrations

Create migrations for each service (this creates migration files):

```bash
# User Service
cd packages/user-service
npm run db:migrate:dev
# When prompted, enter migration name (e.g., "init")
cd ../..

# Reservation Service
cd packages/reservation-service
npm run db:migrate:dev
# When prompted, enter migration name (e.g., "init")
cd ../..

# Table Service
cd packages/table-service
npm run db:migrate:dev
# When prompted, enter migration name (e.g., "init")
cd ../..
```

**Note:** Use `db:migrate:dev` for local development. This allows creating new migrations. The `db:migrate` script uses `prisma migrate deploy` which only applies existing migrations.

### Step 7: Build Services Before Seeding

Seed scripts use compiled JavaScript, so build the services first:

```bash
# Build all services from root
npm run build
```

Or build individually:
```bash
cd packages/user-service && npm run build && cd ../..
cd packages/reservation-service && npm run build && cd ../..
cd packages/table-service && npm run build && cd ../..
```

### Step 8: Seed Databases (Optional but Recommended)

This populates the databases with test data:

```bash
# User Service
cd packages/user-service
npm run db:seed
cd ../..

# Reservation Service
cd packages/reservation-service
npm run db:seed
cd ../..

# Table Service
cd packages/table-service
npm run db:seed
cd ../..
```

**Note:** Seed scripts use `node dist/prisma/seed.js` which requires the TypeScript seed files to be compiled first. Make sure you run `npm run build` before seeding.

### Step 9: Build Shared Package

The shared package needs to be built before running services:

```bash
cd packages/shared
npm run build
cd ../..
```

### Step 10: Start All Services

**Option 1: Start all services from root (Recommended)**

```bash
npm run dev
```

This will start all services in parallel.

**Option 2: Start services individually**

Open multiple terminal windows/tabs:

**Terminal 1 - User Service:**
```bash
cd packages/user-service
npm run dev
```

**Terminal 2 - Reservation Service:**
```bash
cd packages/reservation-service
npm run dev
```

**Terminal 3 - Table Service:**
```bash
cd packages/table-service
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd packages/frontend
npm run dev
```

### Step 10: Verify Services Are Running

Check that all services are accessible:

- **Frontend:** http://localhost:5173 (Vite dev server)
- **User Service:** http://localhost:3001
- **Reservation Service:** http://localhost:3002
- **Table Service:** http://localhost:3003

Test health endpoints:
- http://localhost:3001/health
- http://localhost:3002/health
- http://localhost:3003/health

## Troubleshooting

### Issue: `npm install` fails

**Solution:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json` in root and all packages
- Run `npm install` again
- If using Windows, try running terminal as Administrator

### Issue: Prisma client not found

**Solution:**
```bash
cd packages/user-service
npx prisma generate
# Repeat for other services
```

### Issue: Database connection error

**Solutions:**
1. Verify MySQL is running:
   ```bash
   # Windows
   # Check Services app for MySQL
   
   # Mac/Linux
   sudo systemctl status mysql
   # or
   brew services list
   ```

2. Verify database credentials in `.env` files
3. Test connection:
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```

4. Check if databases exist:
   ```sql
   SHOW DATABASES;
   ```

### Issue: Port already in use

**Solution:**
- Find process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3001
  # Kill process (replace PID)
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -i :3001
  # Kill process
  kill -9 <PID>
  ```

- Or change the port in the service's `.env` file

### Issue: Module not found errors

**Solution:**
1. Ensure you ran `npm install` from root directory
2. Rebuild shared package:
   ```bash
   cd packages/shared
   npm run build
   ```
3. Regenerate Prisma clients for all services

### Issue: TypeScript errors

**Solution:**
- Ensure TypeScript is installed: `npm install -g typescript`
- Rebuild shared package
- Check `tsconfig.json` files are present

## Development Workflow

### Making Changes

1. **Backend Services:** Changes are automatically reloaded with `tsx watch`
2. **Frontend:** Vite provides hot module replacement (HMR)
3. **Shared Package:** After changes, rebuild:
   ```bash
   cd packages/shared
   npm run build
   ```

### Running Tests

```bash
# All services
npm test

# Specific service
cd packages/user-service
npm test
```

### Building for Production

```bash
# Build all services
npm run build

# Build specific service
cd packages/user-service
npm run build
```

## Quick Reference

### Essential Commands

```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Create migrations (first time only)
cd packages/user-service && npm run db:migrate:dev && cd ../..
cd packages/reservation-service && npm run db:migrate:dev && cd ../..
cd packages/table-service && npm run db:migrate:dev && cd ../..

# Build all services (required before seeding)
npm run build

# Seed databases
cd packages/user-service && npm run db:seed && cd ../..
cd packages/reservation-service && npm run db:seed && cd ../..
cd packages/table-service && npm run db:seed && cd ../..

# Build shared package
cd packages/shared && npm run build

# Generate Prisma clients
cd packages/user-service && npx prisma generate
```

### Service URLs

- Frontend: http://localhost:5173
- User Service: http://localhost:3001
- Reservation Service: http://localhost:3002
- Table Service: http://localhost:3003
- MySQL: localhost:3306

## Next Steps

Once everything is running:

1. Access the frontend at http://localhost:5173
2. Register a new user account
3. Explore the reservation system
4. Check the API endpoints documentation

## Need Help?

- Check the main [README.md](./README.md)
- Review service-specific documentation
- Check logs in terminal output
- Verify all environment variables are set correctly

---

**Last Updated:** 2026-01-10
