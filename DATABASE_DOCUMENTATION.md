# 🗄️ Database Schema & Migrations Documentation

This project uses a **Microservices-based Database Strategy** where each service owns its own schema and data lifecycle. All services use **MySQL 8.0** as the persistence layer and **Prisma** as the ORM.

## 1. User Service Schema
**Location**: `packages/user-service/prisma/schema.prisma`

### Implementation Details:
- Handles authentication and user identity.
- Stores password hashes using Bcrypt.
- Managed sessions for JWT lifecycle.

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique @db.VarChar(255)
  phone           String?  @db.VarChar(20)
  firstName       String   @map("first_name") @db.VarChar(100)
  lastName        String   @map("last_name") @db.VarChar(100)
  passwordHash    String   @map("password_hash") @db.VarChar(255)
  role            Role     @default(CUSTOMER)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")
}

model UserSession {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  tokenHash  String   @map("token_hash") @db.VarChar(255)
  expiresAt  DateTime @map("expires_at")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Role {
  CUSTOMER
  STAFF
  ADMIN
}
```

---

## 2. Reservation Service Schema
**Location**: `packages/reservation-service/prisma/schema.prisma`

### Implementation Details:
- Manages the core booking lifecycle (Pending -> Confirmed -> Seated -> Completed).
- Handles waitlist entries with positional tracking.
- Multi-table reservation support via the `ReservationTable` junction table.

```prisma
model Reservation {
  id                  String   @id @default(uuid())
  reservationNumber   String   @unique @db.VarChar(20)
  userId              String   @map("user_id")
  restaurantId        String   @map("restaurant_id")
  partySize           Int      @map("party_size")
  reservationDate     DateTime @map("reservation_date") @db.Date
  reservationTime     DateTime @map("reservation_time") @db.Time
  status              ReservationStatus @default(CONFIRMED)
  tables              ReservationTable[]
}

model ReservationTable {
  id            String   @id @default(uuid())
  reservationId String   @map("reservation_id")
  tableId       String   @map("table_id")
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
}

model WaitlistEntry {
  id                String        @id @default(uuid())
  restaurantId      String        @map("restaurant_id")
  userId            String        @map("user_id")
  status            WaitlistStatus @default(WAITING)
  position          Int
}
```

---

## 3. Table Service Schema
**Location**: `packages/table-service/prisma/schema.prisma`

### Implementation Details:
- Defines physical restaurant resources.
- Tracks internal table status (Available, Occupied, etc.).
- Stores operational hours and timezones.

```prisma
model Restaurant {
  id            String   @id @default(uuid())
  name          String   @db.VarChar(255)
  timezone      String   @default("America/New_York") @db.VarChar(50)
  openingTime   DateTime @map("opening_time") @db.Time
  closingTime   DateTime @map("closing_time") @db.Time
  tables        Table[]
}

model Table {
  id              String   @id @default(uuid())
  restaurantId    String   @map("restaurant_id")
  tableNumber     String   @map("table_number") @db.VarChar(20)
  capacity        Int
  status          TableStatus @default(AVAILABLE)
}

enum TableStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  MAINTENANCE
}
```

---

## 🚀 Migrations Workflow

Migrations are managed individually within each service package using Prisma Migrate.

### Commands:
- **Apply Migrations (Dev)**: `npm run db:migrate:dev`
- **Apply Migrations (Production/Docker)**: `npm run db:migrate`

### Migration SQL Files:
Migration history is stored in each service's `prisma/migrations` folder:
- `packages/user-service/prisma/migrations/`
- `packages/reservation-service/prisma/migrations/`
- `packages/table-service/prisma/migrations/`

### Important Constraint:
To prevent double-bookings, a unique composite index is enforced in the **Reservation Service**:
`@@unique([tableId, reservationDate, reservationTime])` in the migration history ensures atomicity at the database level.
