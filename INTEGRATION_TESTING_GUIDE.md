# Integration Testing Guide

## Overview
Integration tests verify that different components of the system work together correctly. Unlike unit tests that test individual functions in isolation, integration tests test the actual API endpoints end-to-end.

## Test Structure

### Location
Integration tests are located in `src/__tests__/integration/` directory in each service package.

### Naming Convention
- File names: `*.integration.test.ts`
- Test suites: Describe the service or feature being tested
- Test cases: Should describe the specific scenario being tested

## Running Integration Tests

### All Tests (Unit + Integration)
```bash
npm test
```

### Only Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Only Unit Tests
```bash
npm test -- --testPathPattern=__tests__ --testPathIgnorePatterns=integration
```

### With Coverage
```bash
npm run test:coverage
```

## Test Database Setup

Integration tests require a test database. You have two options:

### Option 1: Use Separate Test Database
Set the `TEST_DATABASE_URL` environment variable:
```bash
TEST_DATABASE_URL="mysql://user:password@localhost:3306/test_db"
```

### Option 2: Use Main Database (Not Recommended for Production)
If `TEST_DATABASE_URL` is not set, tests will fall back to `DATABASE_URL`.

**Warning**: Integration tests may create and delete data. Always use a separate test database.

## What Integration Tests Cover

### 1. **HTTP Endpoints**
- Request/Response validation
- Status codes
- Response body structure
- Error handling

### 2. **Authentication & Authorization**
- Login/Register flows
- Token validation
- Protected endpoints
- Role-based access control

### 3. **Database Operations**
- CRUD operations
- Data persistence
- Constraint validation
- Transaction handling

### 4. **Business Logic**
- Multi-step workflows
- Service interactions
- State management

### 5. **Validation**
- Input validation
- Schema validation
- Error messages

## Best Practices

### 1. **Test Isolation**
Each test should be independent and not rely on other tests:
```typescript
beforeEach(async () => {
  // Setup test data
});

afterEach(async () => {
  // Cleanup test data
});
```

### 2. **Use Realistic Data**
Use data that represents real-world scenarios:
```typescript
const testUser = {
  email: `test-${Date.now()}@example.com`, // Unique email
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe',
};
```

### 3. **Test Both Success and Failure Cases**
```typescript
it('should create reservation with valid data', async () => {
  // Test success case
});

it('should reject reservation with invalid date', async () => {
  // Test validation failure
});
```

### 4. **Clean Up After Tests**
```typescript
afterAll(async () => {
  // Delete test data
  await prisma.user.deleteMany({
    where: { email: { contains: 'test-' } }
  });
  await prisma.$disconnect();
});
```

### 5. **Use Descriptive Test Names**
```typescript
// Good
it('should return 401 when accessing protected endpoint without token', async () => {});

// Bad
it('should fail', async () => {});
```

## Example Integration Test

```typescript
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from '../../routes/auth.routes';

describe('Authentication Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', createAuthRoutes(prisma));
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('accessToken');
  });
});
```

## Troubleshooting

### Tests Hanging
- Ensure `prisma.$disconnect()` is called in `afterAll`
- Check for unclosed database connections
- Verify async/await usage

### Database Connection Errors
- Verify `DATABASE_URL` or `TEST_DATABASE_URL` is set
- Ensure database is running
- Check network connectivity

### Flaky Tests
- Ensure test isolation (no shared state)
- Use unique identifiers (timestamps, UUIDs)
- Clean up test data properly

## CI/CD Integration

For continuous integration, ensure:
1. Test database is available
2. Environment variables are set
3. Database migrations are run before tests
4. Tests run in isolated environments

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  env:
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  run: npm run test:integration
```
