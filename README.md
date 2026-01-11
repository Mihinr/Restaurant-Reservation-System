#  Restaurant Reservation System

A high-performance, production-ready microservices system for managing restaurant bookings and waitlists.

---

##  System Overview & Architecture

The system follows a **Microservices Architecture** designed for scalability and fault tolerance. Each service communicates via REST APIs and shares typed data structures through a common package.

### Architecture Diagram

![System Architecture](./assets/architecture_diagram.png)

---

##  Technology Stack

| Category | Technology | Version Requirement |
|----------|------------|---------------------|
| **Runtime** | Node.js | v18.x or v20.x |
| **Language** | TypeScript | v5.x |
| **Framework**| Express.js | v4.x |
| **Frontend** | React | v18.x (Vite) |
| **ORM** | Prisma | v5.x |
| **Database** | MySQL | v8.0 |
| **Container**| Docker | 20.10+ |
| **Orchestration**| Docker Compose | 2.0+ |

---

##  Complete Setup Instructions

The recommended setup method is using **Docker Compose**.

### 1. Preparation
Clone the repository and create the required root environment file:
```bash
git clone <repository-url>
cd Restaurant-Reservation-System
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
MYSQL_ROOT_PASSWORD=your-secure-password

```

### 3. Build & Launch
```bash
# Build images and start services in background
docker compose up -d --build

# Wait for healthy status (check with docker compose ps)
```

### 4. Database Setup (Crucial)
You must apply the schemas and seed the test data for the application to function:
```bash
# Apply migrations and seed each service
docker compose exec user-service npm run db:migrate 
docker compose exec user-service npm run db:seed
docker compose exec reservation-service npm run db:migrate 
docker compose exec reservation-service npm run db:seed
docker compose exec table-service npm run db:migrate 
docker compose exec table-service npm run db:migrate 
docker compose exec table-service npm run db:seed
```

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **User Service:** http://localhost:3001
- **Reservation Service:** http://localhost:3002
- **Table Service:** http://localhost:3003

## 🔑 Default Credentials

After seeding the database, you can use these accounts to test the application:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@restaurant.com` | `admin123` | Full control over restaurants/tables |
| **Staff** | `staff@restaurant.com` | `staff123` | Manage daily reservations & waitlists |
| **Customer**| `customer1@example.com`| `customer123`| Book tables & join waitlists |

---

##  How to Run Tests

The system includes unit and integration tests using **Jest**.

### Running Locally
1. Install dependencies: `npm install`
2. Run all tests: `npm test`
3. Targeted coverage: `npm run test:coverage`

### Running inside Docker
```bash
docker compose exec reservation-service npm test
```

---

##  API Documentation

Each microservice serves its own **Swagger UI** documentation locally:

| Service | Documentation URL | Spec File |
|---------|-------------------|-----------|
| **User Service** | [http://localhost:3001/api-docs](http://localhost:3001/api-docs) | `/api-docs.json` |
| **Reservation Service** | [http://localhost:3002/api-docs](http://localhost:3002/api-docs) | `/api-docs.json` |
| **Table Service** | [http://localhost:3003/api-docs](http://localhost:3003/api-docs) | `/api-docs.json` |

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | The root password for the MySQL database | **REQUIRED** |
| `DATABASE_URL` | Prisma link (calculated automatically in Docker) | - |
| `JWT_SECRET` | Secret key for signing authentication tokens | `your-secret` |
| `VITE_API_URL` | Frontend link to the Backend Gateway | `http://localhost:3001` |
| `LOG_LEVEL` | Verbosity of server logs (debug, info, error) | `info` |

---

## Troubleshooting Common Issues

### "Column 'X' does not exist" or "Table not found"
**Cause:** Your database schema is not synced with the Prisma code.
**Fix:** Run `docker compose exec <service-name> npx prisma db push` to force sync the tables.

### "No migration found in prisma/migrations"
**Cause:** Attempting to run `migrate deploy` without SQL history files.
**Fix:** Ensure you are running the `Init` migrations first as described in the Setup section.

### Backend connection refused from Frontend
**Cause:** `VITE_API_URL` in `.env` is incorrect or the services (Port 3001-3003) are down.
**Fix:** Check `docker compose ps` to ensure containers are healthy and verify the `.env` value.

### Port conflicts
**Cause:** Ports 3000, 3001, 3002, 3003, or 3306 are already in use by local services.
**Fix:** Stop existing MySQL or Node instances running on the host machine.

---

