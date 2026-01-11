# 🧪 Project Test Suite

## Overview
This project uses a layered testing strategy to ensure reliability across all microservices and the frontend.

| Test Level | Tooling | Focus |
|:--- |:--- |:--- |
| **Unit Tests** | Jest | Isolated business logic, service methods, and utilities. |
| **Integration Tests** | Supertest + Jest | API endpoints, database interactions, and inter-service coordination. |
| **Shared Contract Tests** | TypeScript | Ensuring DTO consistency between Frontend and Backend. |
| **Frontend Tests** | Vitest + React Testing Library | UI component behavior and Redux state transitions. |

## 🚀 Running the Suite

### 1. Global (Monorepo Root)
```bash
# Run all tests in the project
npm test

# Run all tests with coverage
npm run test:coverage
```

### 2. Service Specific
```bash
# User Service
cd packages/user-service && npm test

# Reservation Service
cd packages/reservation-service && npm test

# Table Service
cd packages/table-service && npm test

# Shared Package
cd packages/shared && npm test
```

## 📂 Test Structure
Tests are located within each package's `src/__tests__` directory, categorized as:
- `unit/`: Lower-level logic tests.
- `integration/`: API and database flow tests.

## 🛠️ Sample Test Implementation
Each service follows this pattern for integration testing:

```typescript
import request from 'supertest';
import { app } from '../../app';

describe('Global Test Suite Sample', () => {
  it('should verify health check is operational', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```
