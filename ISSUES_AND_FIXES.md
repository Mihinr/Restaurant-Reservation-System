# Issues and Fixes Log

**Last Updated:** January 10, 2025 (Updated with seed script and server path fixes)  
**Status:** Active - Update only when explicitly requested

---

## 1. TypeScript Compilation Errors

**Error:** Multiple TypeScript compilation errors during Docker build process across all backend services, including unused variables, optional property type mismatches, missing Prisma types, validator type issues, and service logic type errors.

**Impact:** Docker builds failed, preventing container creation and deployment.

**Root cause:** Codebase not fully compliant with strict TypeScript compiler settings (`exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`, `noImplicitAny`). Prisma client not generated before TypeScript compilation.

**Fix(solution/action):** Prefixed unused variables with underscore. Updated DTOs and services to explicitly handle undefined values using nullish coalescing and conditional object spreading. Added explicit type casting for request bodies. Added null/undefined checks before type conversions. Regenerated Prisma client in Dockerfiles before TypeScript compilation by adding `RUN npx prisma generate` in builder stage.

---

## 2. Docker Environment Variable Loading Issue

**Error:** Services failed to start in Docker containers with error: `Could not find .env file at: /app/packages/<service>/.env`

**Impact:** All services crashed on startup in Docker environment despite environment variables being correctly configured in docker-compose.yml.

**Root cause:** Application code explicitly required `.env` files to exist at runtime and threw error before attempting to use `process.env`, which Docker Compose populated correctly. Dockerfiles do not copy `.env` files into containers by design.

**Fix(solution/action):** Made `.env` file loading optional. Changed code to load `.env` file only if it exists, otherwise rely on `process.env`. Updated `env.ts` files in all three services to use conditional loading: `if (existsSync(packageEnvPath)) { dotenv.config({ path: packageEnvPath, override: true }); }`

---

## 3. Prisma OpenSSL Library Missing

**Error:** Prisma query engine failed with error: `Error loading shared library libssl.so.1.1: No such file or directory (needed by libquery_engine-linux-musl.so.node)`

**Impact:** Services crashed immediately after startup when attempting to connect to database. Prisma client initialization failed.

**Root cause:** Dockerfiles used `node:18-alpine` base image. Alpine Linux uses musl libc and different OpenSSL library structure. Prisma's query engine for Alpine requires `libssl.so.1.1`, but Alpine Linux 3.17+ uses OpenSSL 3.x which provides `libssl.so.3`. The specific OpenSSL version Prisma needs wasn't available.

**Fix(solution/action):** Switched all Dockerfiles from Alpine-based to Debian-based images. Changed `FROM node:18-alpine` to `FROM node:18` in both builder and production stages. Updated user creation commands from Alpine's `addgroup`/`adduser` to Debian's `groupadd`/`useradd`. Debian-based images include OpenSSL libraries that Prisma needs out-of-the-box.

---

## 4. Docker Health Check Endpoint Issue

**Error:** Docker health checks failing for all backend services. Health check commands checking `http://localhost:<port>/health` were not receiving successful responses.

**Impact:** Docker containers not showing as healthy, preventing proper service orchestration and monitoring.

**Root cause:** Health route was incorrectly configured. Router defined route as `/health` and was mounted at `/health` in app.ts, making the actual endpoint `/health/health` instead of `/health`. Health check was also returning complex JSON response instead of simple `{ status: 'ok' }` format.

**Fix(solution/action):** Changed health route from `router.get('/health', ...)` to `router.get('/', ...)` in all three services' health.routes.ts files. Since router is mounted at `/health` in app.ts, the endpoint is now correctly accessible at `/health`. Updated response to return simple `res.status(200).json({ status: 'ok' })` format matching Docker health check expectations.

---

## 5. Frontend Nginx Health Check Issue

**Error:** Frontend container showing as unhealthy in Docker. Health check was failing to verify Nginx service status.

**Impact:** Frontend container marked as unhealthy, preventing proper service monitoring and orchestration. Health check was using `wget` which may not be reliable in Alpine Nginx container.

**Root cause:** Frontend Dockerfile health check was using `wget` command which may not be available or working correctly in the Nginx Alpine container. Health check parameters were also not optimal for frontend service startup time.

**Fix(solution/action):** Installed `curl` in Nginx Alpine container using `RUN apk add --no-cache curl`. Updated health check to use `curl -f http://localhost/ || exit 1` with improved timing parameters: `--interval=30s --timeout=5s --start-period=20s --retries=3`. This ensures Nginx is properly serving the frontend before marking container as healthy.

---

## 6. Prisma Migration Permission Error in Docker Containers

**Error:** Running `npm run db:migrate` in Docker containers failed with error: `Command failed with exit code 1: npm i @prisma/client@5.22.0 --silent`. Migration applied successfully but Prisma client regeneration failed.

**Impact:** Migrations could not be run in production Docker containers. The `prisma migrate dev` command tried to regenerate Prisma client which requires write permissions to node_modules, but containers run as non-root user without write access.

**Root cause:** The `db:migrate` script was using `prisma migrate dev` which automatically regenerates the Prisma client after applying migrations. This requires npm to install/update packages in node_modules, but the non-root user (`nodejs`) in production containers doesn't have write permissions. Prisma client is already generated during Docker build, so regeneration is unnecessary in production.

**Fix(solution/action):** Changed `db:migrate` script in all three services' package.json files to use `prisma migrate deploy` instead of `prisma migrate dev`. Created separate `db:migrate:dev` script for local development that uses `prisma migrate dev`. The `prisma migrate deploy` command applies migrations without regenerating the client, avoiding permission issues since the client is already generated during Docker build.

---

## 7. Seed Script Execution Failure in Docker Containers

**Error:** Running `npm run db:seed` in Docker containers failed with error: `sh: 1: tsx: not found`. Seed script attempted to use `tsx` which is not available in production containers.

**Impact:** Database seeding failed in Docker containers. Seed scripts could not populate test data.

**Root cause:** Seed scripts used `tsx prisma/seed.ts` which requires `tsx` (TypeScript execution tool) available as devDependency. Production Docker containers only install production dependencies (`npm ci --only=production`), so `tsx` is not available. Additionally, `prisma/seed.ts` files were not being compiled during build process.

**Fix(solution/action):** Updated `tsconfig.json` in all three services to include `prisma/**/*` files and changed `rootDir` from `"./src"` to `"./"` to compile both source and seed files. Changed `db:seed` script from `tsx prisma/seed.ts` to `node dist/prisma/seed.js` in all package.json files. Fixed TypeScript errors in seed files by adding nullish coalescing operators for undefined values. Seed files are now compiled during build and executed as JavaScript in production containers.

---

## 8. Docker Container Server Entry Point Error

**Error:** Services failed to start with error: `Cannot find module '/app/packages/user-service/dist/server.js'`. Containers could not locate the server entry point.

**Impact:** All backend services crashed on startup in Docker containers. Application could not start.

**Root cause:** Changed `tsconfig.json` `rootDir` from `"./src"` to `"./"` to compile seed files. This changed the output structure from `src/server.ts` → `dist/server.js` to `src/server.ts` → `dist/src/server.js`. Dockerfile CMD still referenced old path `dist/server.js` instead of `dist/src/server.js`.

**Fix(solution/action):** Updated Dockerfile CMD in all three services from `CMD ["node", "dist/server.js"]` to `CMD ["node", "dist/src/server.js"]`. This matches the new output structure where source files compile to `dist/src/` directory.

---

## 9. Integration Tests Wiping Development Database

**Error:** Running integration tests (`npm run test:integration`) deleted all data (restaurants, tables, users) from the development database.

**Impact:** Development data was lost, requiring manual re-seeding to continue work. Frontend and APIs showed no data after tests were run.

**Root cause:** Integration tests for `reservation-service` and `table-service` used `prisma.model.deleteMany()` in `beforeAll` and `afterAll` hooks to ensure a clean test environment. Both the development environment and the tests were using the same `DATABASE_URL` from the `.env` file because a separate `TEST_DATABASE_URL` was not configured or forced in the test setup.

**Fix(solution/action):** Restored missing data by running the seed script: `npx tsx prisma/seed.ts` (or `npm run db:seed`). To prevent future occurrences, it is recommended to define a `TEST_DATABASE_URL` in the environment that points to a dedicated test database, or use a separate `.env.test` file for integration testing.

---
