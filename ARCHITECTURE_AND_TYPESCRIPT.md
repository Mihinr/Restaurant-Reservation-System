# Architecture & TypeScript Documentation

This document provides a detailed overview of the system architecture, security implementation, and TypeScript patterns used in the Restaurant Reservation System.

---

## 1. Architecture Documentation

### 1.1 Service Interaction Diagrams

The system follows a microservices architecture where services communicate via REST APIs and real-time WebSockets.

#### Reservation Creation Flow
1. **Frontend** → `POST /api/v1/reservations` → **Reservation Service**
2. **Reservation Service** → `GET /api/v1/restaurants/:id/availability` → **Table Service** (Verifies table status)
3. **Reservation Service** → `POST /api/v1/tables/:id/status` → **Table Service** (Updates status to RESERVED)
4. **Reservation Service** → `Socket.io Emit` → **Frontend** (Real-time confirmation across all connected clients)

#### Waitlist Flow
1. **Frontend** → `POST /api/v1/waitlist` → **Reservation Service**
2. **Reservation Service** → `Socket.io Emit` → **Staff Dashboard** (Instant notification of new entry)

### 1.2 Database Schema Overview

We use **MySQL** with **Prisma ORM**. Each service manages its own dedicated database to ensure loose coupling.

*   **User Service DB**: Manages Users and Sessions.
*   **Table Service DB**: Manages Restaurants and Tables.
*   **Reservation Service DB**: Manages Reservations and Waitlist entries.

#### Key Relationships:
*   **Table ↔ Restaurant**: Many-to-one (A restaurant has many tables).
*   **Reservation ↔ Table**: Many-to-many (A reservation can reserve multiple tables for large parties).
*   **Waitlist ↔ User**: One-to-many (A user can have multiple historical waitlist entries).

### 1.3 Deployment Architecture

The system is containerized using **Docker** and orchestrated with **Docker Compose**.

*   **Reverse Proxy**: Nginx (serves the React frontend and routes `/api` requests to backend services).
*   **Containers**:
    *   `frontend`: React production build served by Nginx.
    *   `user-service`: Node.js Express API.
    *   `reservation-service`: Node.js Express API + Socket.io server.
    *   `table-service`: Node.js Express API.
    *   `mysql`: Centralized database engine hosting 3 logical databases.
*   **Networking**: A private bridge network (`restaurant-network`) ensures services can communicate by container name (e.g., `http://table-service:3003`) while only the frontend and API gateway are exposed to the host.

### 1.4 Security Considerations

*   **Authentication**: Stateless JWT-based authentication. Access tokens have short TTLs (15m), and Refresh tokens (7d) are stored securely.
*   **Authorization**: Role-Based Access Control (RBAC). Endpoints are protected via `authMiddleware` that checks for `CUSTOMER`, `STAFF`, or `ADMIN` roles.
*   **Data Protection**:
    *   Passwords hashed using `bcrypt` (10 salt rounds).
    *   Input Sanitization: All incoming request bodies are validated against `Zod` schemas.
    *   Rate Limiting: Each service implements `express-rate-limit` to prevent brute-force and DoS attacks.
*   **In-Transit**: Inter-service communication happens within the Docker network; production deployment would use TLS/SSL for external traffic.

---

## 2. TypeScript Documentation

### 2.1 Key Type Definitions

We use a layered type strategy to ensure end-to-end type safety.

#### Isomorphic Types (`@restaurant-reservation/shared`)
These types are shared between the Backend and Frontend to ensure contracts are never broken:
*   **Entity Types**: `User`, `Reservation`, `Table`, `Restaurant`.
*   **DTOs**: `CreateReservationDto`, `LoginCredentials`, `UpdateUserDto`.
*   **Enums**: `ReservationStatus` (PENDING, CONFIRMED, CANCELLED), `UserRole`.

#### Backend-Only Types
*   **Repository Types**: Prisma-generated types for complex joins (e.g., `Prisma.UserGetPayload`).
*   **Request Context**: `RequestContext` for storing `correlationId` and `userId` in `AsyncLocalStorage`.

### 2.2 Type Safety Patterns

#### 1. Zero-Leak Shared Library
The `@restaurant-reservation/shared` package uses subpath exports to separate browser-safe types from Node.js infrastructure.
*   `@restaurant-reservation/shared`: Clean types and constants (Frontend + Backend).
*   `@restaurant-reservation/shared/server`: Utils using `async_hooks` or `axios-retry` (Backend only).

#### 2. Strict Validation with Zod
We treat external data as `unknown` until it passes a Zod schema. 
```typescript
// Example: Type safely derived from schema
const CreateReservationSchema = z.object({ ... });
type CreateReservationDto = z.infer<typeof CreateReservationSchema>;
```

#### 3. Error Handling
We use a centralized `AppError` class. TypeScript ensures that catch blocks handle errors and provide consistent JSON responses across all services.

#### 4. Safe Context Propagation
Using `AsyncLocalStorage`, we propagate a `correlationId` through the entire request lifecycle without passing it manually through every function. This is strictly typed to prevent "magic string" bugs in logging.
