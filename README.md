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
- **Package Manager:** pnpm (monorepo)

## Prerequisites

- Node.js 18+
- MySQL 8.0
- pnpm 8+

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Mihinr/Restaurant-Reservation-System.git
cd Restaurant-Reservation-System
```

### 2. Install Dependencies

```bash
pnpm install
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
LOG_LEVEL="info"
```

**packages/table-service/.env:**
```env
NODE_ENV=development
PORT=3003
DATABASE_URL="mysql://root:password@localhost:3306/restaurant_table_service"
LOG_LEVEL="info"
```

### 5. Run Migrations

```bash
cd packages/user-service && pnpm db:migrate
cd ../reservation-service && pnpm db:migrate
cd ../table-service && pnpm db:migrate
```

### 6. Seed Database

```bash
cd packages/user-service && pnpm db:seed
cd ../reservation-service && pnpm db:seed
cd ../table-service && pnpm db:seed
```

### 7. Start Services

From the root directory:

```bash
pnpm dev
```

Or start each service individually:

```bash
cd packages/user-service && pnpm dev
cd packages/reservation-service && pnpm dev
cd packages/table-service && pnpm dev
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
pnpm test
```

Run tests with coverage:

```bash
pnpm test:coverage
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
├── docker-compose.yml         # Docker configuration (to be added)
└── README.md
```

## Development Status

- ✅ Project structure and monorepo setup
- ✅ User Service implementation
- ✅ Reservation Service implementation
- ✅ Table Service implementation
- ⏳ Frontend implementation (in progress)
- ⏳ Testing implementation
- ⏳ Docker configuration

## License

MIT

