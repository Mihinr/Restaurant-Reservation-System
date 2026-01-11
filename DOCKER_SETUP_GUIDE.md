# 🍴 Docker Setup Guide - Restaurant Reservation System

Welcome! This guide will walk you through setting up the **Restaurant Reservation System** for the first time using Docker. By the end of this guide, you will have a fully functional monorepo with 3 microservices, a frontend, and a MySQL database running on your machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Docker Desktop** (includes Docker Compose) ([Install Guide](https://docs.docker.com/get-docker/))
- **Git**

---

## 🚀 Quick Start (First-Time Setup)

Follow these steps exactly in order to get the system running.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Restaurant-Reservation-System
```

### 2. Configure Environment Variables (Required)
The system **will not start** without a root `.env` file. Docker Compose requires `MYSQL_ROOT_PASSWORD` to be explicitly defined.

Create a file named `.env` in the project root and add the following:
```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your-secure-password-here

# Integration Configuration
# For Linux/Docker users, this ensures the frontend can reach the backend services
VITE_API_URL=http://localhost:3001
```

### 3. Build and Launch
Launch all containers. The first build will take a few minutes as it compiles all packages.
```bash
# Build and start in background
docker compose up -d --build

# Open logs to watch the services start up
docker compose logs -f
```
*Wait until you see messages like `Restaurant service listening on port 3002` in the logs.*

### 4. Initialize the Database (One-time)
Once the containers are running, you need to apply the schemas and load test data.
```bash
# Apply migrations and seed data for all 3 services
docker compose exec user-service npm run db:migrate && docker compose exec user-service npm run db:seed
docker compose exec reservation-service npm run db:migrate && docker compose exec reservation-service npm run db:seed
docker compose exec table-service npm run db:migrate && docker compose exec table-service npm run db:seed
```

---

## 🔑 Default Credentials

After seeding the database, you can use these accounts to test the application:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@restaurant.com` | `admin123` | Full control over restaurants/tables |
| **Staff** | `staff@restaurant.com` | `staff123` | Manage daily reservations & waitlists |
| **Customer**| `customer1@example.com`| `customer123`| Book tables & join waitlists |

---

## 🌐 Accessing the Services

| Component | URL | Description |
|-----------|-----|-------------|
| **Frontend UI** | [http://localhost:3000](http://localhost:3000) | Main Customer & Staff Portal |
| **User API** | [http://localhost:3001](http://localhost:3001) | Auth & User Management |
| **Reservation API** | [http://localhost:3002](http://localhost:3002) | Booking Engine |
| **Table API** | [http://localhost:3003](http://localhost:3003) | Site & Table Management |

---

## 🛠️ Common Operations & Troubleshooting

### 🔍 Viewing Logs
Logs are your best friend for debugging connection issues.
```bash
docker compose logs -f [service-name] 
# Example: docker compose logs -f reservation-service
```

### 🔄 Database Schema Syncing
If you see errors like `Column 'X' does not exist`, your database might be out of sync with your Prisma schema. Run this command to force sync:
```bash
docker compose exec [service-name] npx prisma db push
```

### 🧹 Complete Reset
If you want to start from scratch and delete all your data:
```bash
# WARNING: This deletes all databases and uploaded images
docker compose down -v
```

### 🛑 Service Status
Check which containers are running and their health:
```bash
docker compose ps
```

---

## 🐳 Service Details (Internal Ports)

The system uses a dedicated Docker network (`restaurant-network`). Services communicate internally using their service names:
- `mysql:3306`
- `user-service:3001`
- `reservation-service:3002`
- `table-service:3003`

---

## 📝 Developer Notes
- **Local Dev vs Docker**: If running services locally (without Docker), use the `.env` files inside each `packages/*` directory. 
- **Migration Files**: To create new migrations, do it locally using `npm run db:migrate:dev` before rebuilding your Docker images.

---
**Last Updated:** 2026-01-11
