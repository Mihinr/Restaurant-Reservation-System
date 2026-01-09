# Restaurant Reservation System

A production-ready microservices-based restaurant reservation system built with Node.js, TypeScript, React, and MySQL.

## Architecture

The system consists of three microservices and a frontend application:

1. **User Service** (Port: 3001) - Authentication & user management
2. **Reservation Service** (Port: 3002) - Booking & waitlist management
3. **Table Service** (Port: 3003) - Restaurant & table management
4. **Frontend** (Port: 3000) - React application

## Tech Stack

- **Backend:** Node.js with Express, TypeScript
- **Frontend:** React with TypeScript, Vite, Tailwind CSS
- **Database:** MySQL with Prisma ORM
- **State Management:** Redux Toolkit
- **Testing:** Jest with ts-jest
- **Package Manager:** npm (monorepo with workspaces)

## Prerequisites

- Node.js 18+
- MySQL 8.0
- npm 9+

## Quick Start with Docker (Recommended)

The easiest way to get started is using Docker Compose:

### 1. Prerequisites

- Docker 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ (included with Docker Desktop)

### 2. Clone and Setup

```bash
git clone https://github.com/Mihinr/Restaurant-Reservation-System.git
cd Restaurant-Reservation-System
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and update:
# - MYSQL_ROOT_PASSWORD (use a strong password)
# - JWT_SECRET (minimum 32 characters)
# - REFRESH_TOKEN_SECRET (minimum 32 characters)
```

### 4. Run Setup Script

**Linux/Mac:**
```bash
./docker-setup.sh
```

**Windows (PowerShell):**
```powershell
.\docker-setup.ps1
```

**Or manually:**
```bash
# Build and start services
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec user-service npm run db:migrate
docker-compose exec reservation-service npm run db:migrate
docker-compose exec table-service npm run db:migrate

# Seed databases
docker-compose exec user-service npm run db:seed
docker-compose exec reservation-service npm run db:seed
docker-compose exec table-service npm run db:seed
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **User Service:** http://localhost:3001
- **Reservation Service:** http://localhost:3002
- **Table Service:** http://localhost:3003

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up
```

For detailed Docker documentation, see [DOCKER_SETUP_GUIDE.md](./DOCKER_SETUP_GUIDE.md).

---

## Local Development Setup (Without Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/Mihinr/Restaurant-Reservation-System.git
cd Restaurant-Reservation-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create the databases:

```sql
CREATE DATABASE restaurant_user_service;
CREATE DATABASE restaurant_reservation_service;
CREATE DATABASE restaurant_table_service;
```

### 4. Environment Variables

Create `.env` files for each service:

**packages/user-service/.env:**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="mysql://root:password@localhost:3306/restaurant_user_service"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"
LOG_LEVEL="info"
```

**packages/reservation-service/.env:**
```env
NODE_ENV=development
PORT=3002
DATABASE_URL="mysql://root:password@localhost:3306/restaurant_reservation_service"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
TABLE_SERVICE_URL="http://localhost:3003"
LOG_LEVEL="info"
```

**packages/table-service/.env:**
```env
NODE_ENV=development
PORT=3003
DATABASE_URL="mysql://root:password@localhost:3306/restaurant_table_service"
RESERVATION_SERVICE_URL="http://localhost:3002"
LOG_LEVEL="info"
```

### 5. Run Migrations

```bash
cd packages/user-service && npm run db:migrate
cd ../reservation-service && npm run db:migrate
cd ../table-service && npm run db:migrate
```

### 6. Seed Database

```bash
cd packages/user-service && npm run db:seed
cd ../reservation-service && npm run db:seed
cd ../table-service && npm run db:seed
```

### 7. Start Services

From the root directory:

```bash
npm run dev
```

Or start each service individually:

```bash
cd packages/user-service && npm run dev
cd packages/reservation-service && npm run dev
cd packages/table-service && npm run dev
cd packages/frontend && npm run dev
```

## API Endpoints

### User Service (Port 3001)

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update profile
- `DELETE /api/v1/users/me` - Delete account

### Reservation Service (Port 3002)

- `POST /api/v1/reservations` - Create reservation
- `GET /api/v1/reservations` - List user's reservations
- `GET /api/v1/reservations/:id` - Get reservation details
- `PUT /api/v1/reservations/:id` - Update reservation
- `DELETE /api/v1/reservations/:id` - Cancel reservation
- `POST /api/v1/waitlist` - Join waitlist
- `GET /api/v1/waitlist/restaurants/:restaurantId` - Get waitlist

### Table Service (Port 3003)

- `GET /api/v1/restaurants` - List restaurants
- `GET /api/v1/restaurants/:id` - Get restaurant details
- `POST /api/v1/restaurants` - Create restaurant
- `PUT /api/v1/restaurants/:id` - Update restaurant
- `GET /api/v1/restaurants/:id/tables` - List tables
- `GET /api/v1/restaurants/:id/availability` - Search availability

## Testing

Run tests for all services:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Project Structure

```
restaurant-reservation-system/
├── packages/
│   ├── user-service/          # User authentication service
│   ├── reservation-service/   # Reservation management service
│   ├── table-service/         # Restaurant & table service
│   ├── frontend/              # React frontend (to be implemented)
│   └── shared/                # Shared types and utilities
├── docker-compose.yml         # Docker Compose for production
├── docker-compose.dev.yml     # Docker Compose for development
├── docker-setup.sh            # Setup script (Linux/Mac)
├── docker-setup.ps1           # Setup script (Windows)
├── DOCKER_SETUP_GUIDE.md      # Comprehensive Docker guide
└── DOCKER_QUICK_START.md      # Quick start guide
└── README.md
```

## Development Status

- ✅ Project structure and monorepo setup
- ✅ User Service implementation
- ✅ Reservation Service implementation
- ✅ Table Service implementation
- ✅ Frontend implementation
- ✅ Docker configuration
- ⏳ Testing implementation

## License

MIT

