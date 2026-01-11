# Functional Test Plan - Restaurant Reservation System

## Test Environment Setup

- **Frontend URL**: http://localhost:5173
- **User Service**: http://localhost:3001
- **Reservation Service**: http://localhost:3002
- **Table Service**: http://localhost:3003
- **Browser**: Chrome/Edge (latest)
- **Test Data**: Pre-seeded with 3 restaurants, 20+ tables, 10+ users

### Setup Verification (DevOps)

| Test ID     | Test Case                                    | Steps                                                                                                          | Expected Result                                   | Priority |
| ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| TC-DEV-001  | Docker Build & Initial Launch                | 1. Run `docker compose up -d` in fresh environment<br>2. Check `docker compose ps`                             | All service containers healthy / running          | High     |
| TC-DEV-002  | Automated Database Migration                 | 1. Run `npm run db:migrate` in containers<br>2. Check tables in MySQL                                          | Tables created matching Prisma schema             | High     |
| TC-DEV-003  | Initial Seeding                              | 1. Run `npm run db:seed` in containers<br>2. Login with `staff@example.com` (pw: `password123`)                | Admin/Staff/Customer users pre-populated          | High     |

---

## 1. Authentication & User Management

### 1.1 User Registration

| Test ID     | Test Case                                    | Steps                                                                                                          | Expected Result                                   | Priority |
| ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| TC-AUTH-001 | Successful registration with all fields      | 1. Navigate to /register<br>2. Fill: email, password, firstName, lastName, phone<br>3. Submit                  | User registered, redirected to home, token stored | High     |
| TC-AUTH-002 | Registration without phone (optional)        | 1. Navigate to /register<br>2. Fill: email, password, firstName, lastName<br>3. Leave phone empty<br>4. Submit | User registered successfully                      | High     |
| TC-AUTH-003 | Registration with invalid email              | 1. Navigate to /register<br>2. Enter invalid email (e.g., "invalid")<br>3. Submit                              | Error: "Invalid email format"                     | High     |
| TC-AUTH-004 | Registration with weak password              | 1. Navigate to /register<br>2. Enter password < 8 chars<br>3. Submit                                           | Error: "Password must be at least 8 characters"   | High     |
| TC-AUTH-005 | Registration with duplicate email            | 1. Register with email: test@example.com<br>2. Try to register again with same email                           | Error: "Email already exists"                     | High     |
| TC-AUTH-006 | Registration with invalid phone format       | 1. Navigate to /register<br>2. Enter phone: "123"<br>3. Submit                                                 | Error: "Invalid phone number format"              | Medium   |
| TC-AUTH-007 | Registration with empty required fields      | 1. Navigate to /register<br>2. Leave email/password/firstName/lastName empty<br>3. Submit                      | Validation errors for each empty field            | High     |
| TC-AUTH-008 | Registration with special characters in name | 1. Navigate to /register<br>2. Enter firstName: "John-O'Brien"<br>3. Submit                                    | User registered successfully                      | Low      |

### 1.2 User Login

| Test ID     | Test Case                            | Steps                                                                        | Expected Result                          | Priority |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------- | -------- |
| TC-AUTH-009 | Successful login                     | 1. Navigate to /login<br>2. Enter valid email and password<br>3. Submit      | User logged in, redirected, token stored | High     |
| TC-AUTH-010 | Login with invalid email             | 1. Navigate to /login<br>2. Enter non-existent email<br>3. Submit            | Error: "Invalid credentials"             | High     |
| TC-AUTH-011 | Login with wrong password            | 1. Navigate to /login<br>2. Enter correct email, wrong password<br>3. Submit | Error: "Invalid credentials"             | High     |
| TC-AUTH-012 | Login with empty fields              | 1. Navigate to /login<br>2. Leave fields empty<br>3. Submit                  | Validation errors displayed              | High     |
| TC-AUTH-013 | Login persistence after page refresh | 1. Login successfully<br>2. Refresh page                                     | User remains logged in, token persisted  | High     |
| TC-AUTH-014 | Login with expired token             | 1. Login<br>2. Wait for token expiry (15m)<br>3. Make API call               | 401 Unauthorized, redirect to login      | Medium   |

### 1.3 User Profile Management

| Test ID     | Test Case                         | Steps                                                                      | Expected Result                      | Priority |
| ----------- | --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ | -------- |
| TC-AUTH-015 | View own profile                  | 1. Login<br>2. Navigate to /profile                                        | Profile displays: email, name, phone | High     |
| TC-AUTH-016 | Update profile information        | 1. Navigate to /profile<br>2. Update firstName, lastName, phone<br>3. Save | Profile updated, changes reflected   | High     |
| TC-AUTH-017 | Update profile with invalid phone | 1. Navigate to /profile<br>2. Enter invalid phone<br>3. Save               | Error: "Invalid phone number format" | Medium   |
| TC-AUTH-018 | Access profile without login      | 1. Logout<br>2. Navigate to /profile                                       | Redirected to /login                 | High     |

### 1.4 Logout

| Test ID     | Test Case                            | Steps                                      | Expected Result                               | Priority |
| ----------- | ------------------------------------ | ------------------------------------------ | --------------------------------------------- | -------- |
| TC-AUTH-019 | Successful logout                    | 1. Login<br>2. Click logout                | Token cleared, redirected to home, logged out | High     |
| TC-AUTH-020 | Access protected routes after logout | 1. Logout<br>2. Try to access /reservation | Redirected to /login                          | High     |

---

## 2. Restaurant Search & Discovery

### 2.1 Restaurant Listing

| Test ID     | Test Case                           | Steps                                                    | Expected Result                                 | Priority |
| ----------- | ----------------------------------- | -------------------------------------------------------- | ----------------------------------------------- | -------- |
| TC-REST-001 | View all restaurants                | 1. Navigate to /search<br>2. View restaurant dropdown    | All 3 restaurants displayed                     | High     |
| TC-REST-002 | View restaurant details             | 1. Navigate to /search<br>2. Select a restaurant         | Restaurant info displayed: name, address, hours | Medium   |
| TC-REST-003 | Filter restaurants by city          | 1. Navigate to /search<br>2. Filter by city              | Only restaurants in that city shown             | Medium   |
| TC-REST-004 | Filter restaurants by state         | 1. Navigate to /search<br>2. Filter by state             | Only restaurants in that state shown            | Medium   |
| TC-REST-005 | Search with no restaurants matching | 1. Navigate to /search<br>2. Filter by non-existent city | "No restaurants found" message                  | Low      |

### 2.2 Table Availability Search

| Test ID      | Test Case                                       | Steps                                                                                                          | Expected Result                                   | Priority |
| ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| TC-AVAIL-001 | Search available tables - valid criteria        | 1. Navigate to /search<br>2. Select restaurant<br>3. Enter: date (future), time, party size<br>4. Click Search | Available tables displayed with details           | High     |
| TC-AVAIL-002 | Search with past date                           | 1. Navigate to /search<br>2. Enter past date<br>3. Search                                                      | Error: "Date must be in the future" or no results | High     |
| TC-AVAIL-003 | Search with invalid date format                 | 1. Navigate to /search<br>2. Enter date: "01/01/2026"<br>3. Search                                             | Error: "Invalid date format (YYYY-MM-DD)"         | High     |
| TC-AVAIL-004 | Search with invalid time format                 | 1. Navigate to /search<br>2. Enter time: "7 PM"<br>3. Search                                                   | Error: "Invalid time format (HH:MM)"              | High     |
| TC-AVAIL-005 | Search with party size 0                        | 1. Navigate to /search<br>2. Enter party size: 0<br>3. Search                                                  | Error: "Party size must be positive"              | High     |
| TC-AVAIL-006 | Search with party size exceeding table capacity | 1. Navigate to /search<br>2. Enter party size: 20<br>3. Search                                                 | No available tables shown                         | Medium   |
| TC-AVAIL-007 | Search outside restaurant hours                 | 1. Navigate to /search<br>2. Enter time: 23:00 (after closing)<br>3. Search                                    | No available tables or error message              | Medium   |
| TC-AVAIL-008 | Search with missing required fields             | 1. Navigate to /search<br>2. Leave restaurant/date/time empty<br>3. Search                                     | Validation errors for missing fields              | High     |
| TC-AVAIL-009 | Search shows only available tables              | 1. Create reservation for a table<br>2. Search same date/time<br>3. View results                               | Reserved table not shown as available             | High     |
| TC-AVAIL-010 | Search with different party sizes               | 1. Search with party size: 2<br>2. Search with party size: 4<br>3. Search with party size: 6                   | Different tables shown based on capacity          | Medium   |

---

## 3. Reservation Management

### 3.1 Create Reservation

| Test ID      | Test Case                                             | Steps                                                                                                                   | Expected Result                                | Priority |
| ------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| TC-RES-001   | Create reservation - all fields                       | 1. Search for available table<br>2. Select table<br>3. Fill: customerName, customerPhone, specialRequests<br>4. Confirm | Reservation created, confirmation shown        | High     |
| TC-RES-002   | Create reservation - minimal fields                   | 1. Search for available table<br>2. Select table<br>3. Leave optional fields empty<br>4. Confirm                        | Reservation created successfully               | High     |
| TC-AVAIL-003 | Create reservation without login                      | 1. Logout<br>2. Try to create reservation                                                                               | Redirected to login                            | High     |
| TC-RES-004   | Create reservation for already reserved table         | 1. Create reservation for table at 19:00<br>2. Try to create another for same table/time                                | Error: "Table not available" or conflict       | High     |
| TC-RES-005   | Create reservation with invalid phone                 | 1. Select table<br>2. Enter invalid phone: "123"<br>3. Confirm                                                          | Error: "Invalid phone number format"           | Medium   |
| TC-RES-006   | Create reservation with special requests > 1000 chars | 1. Select table<br>2. Enter 1001 character special request<br>3. Confirm                                                | Error: "Special requests max 1000 characters"  | Low      |
| TC-RES-007   | Create reservation - verify reservation number        | 1. Create reservation<br>2. View confirmation                                                                           | Unique reservation number displayed            | High     |
| TC-RES-008   | Create reservation - verify status                    | 1. Create reservation<br>2. View reservation details                                                                    | Status: "PENDING"                              | High     |
| TC-RES-009   | Create reservation - concurrent booking               | 1. User A searches table at 19:00<br>2. User B books same table at 19:00<br>3. User A tries to book                     | User A gets error: "Table no longer available" | High     |

### 3.2 View Reservations

| Test ID    | Test Case                                | Steps                                                    | Expected Result                                             | Priority |
| ---------- | ---------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| TC-RES-010 | View own reservations list               | 1. Login<br>2. Navigate to /reservation                  | All user's reservations displayed                           | High     |
| TC-RES-011 | View empty reservations list             | 1. Login with new user<br>2. Navigate to /reservation    | "You have no reservations yet" message                      | High     |
| TC-RES-012 | View reservation details                 | 1. Navigate to /reservation<br>2. Click on a reservation | Full details: number, date, time, table, status             | High     |
| TC-RES-013 | View reservations - verify data accuracy | 1. Create reservation<br>2. View in list                 | All data matches: date, time, party size, table             | High     |
| TC-RES-014 | View reservations - different statuses   | 1. Create multiple reservations<br>2. View list          | Reservations show correct status (PENDING, CONFIRMED, etc.) | Medium   |

### 3.3 Update Reservation

| Test ID    | Test Case                                       | Steps                                                                                           | Expected Result                                   | Priority |
| ---------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| TC-RES-015 | Update reservation date/time                    | 1. Navigate to /reservation<br>2. Click Edit on a reservation<br>3. Change date/time<br>4. Save | Reservation updated, new date/time reflected      | High     |
| TC-RES-016 | Update reservation party size                   | 1. Edit reservation<br>2. Change party size<br>3. Save                                          | Party size updated, table availability checked    | High     |
| TC-RES-017 | Update reservation - change to unavailable time | 1. Edit reservation<br>2. Change to time with no available tables<br>3. Save                    | Error: "No tables available for selected time"    | High     |
| TC-RES-018 | Update cancelled reservation                    | 1. Cancel a reservation<br>2. Try to edit it                                                    | Edit button disabled or error message             | High     |
| TC-RES-019 | Update completed reservation                    | 1. View completed reservation<br>2. Try to edit                                                 | Edit button disabled                              | Medium   |
| TC-RES-020 | Update reservation - optimistic locking         | 1. User A opens edit form<br>2. User B updates same reservation<br>3. User A tries to save      | Error: "Reservation was modified, please refresh" | High     |
| TC-RES-021 | Update reservation - invalid date format        | 1. Edit reservation<br>2. Enter invalid date<br>3. Save                                         | Validation error displayed                        | High     |
| TC-RES-022 | Update reservation - special requests           | 1. Edit reservation<br>2. Update special requests<br>3. Save                                    | Special requests updated                          | Medium   |

### 3.4 Cancel Reservation

| Test ID    | Test Case                                    | Steps                                                                         | Expected Result                            | Priority |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ | -------- |
| TC-RES-023 | Cancel reservation                           | 1. Navigate to /reservation<br>2. Click Cancel on a reservation<br>3. Confirm | Reservation cancelled, status: "CANCELLED" | High     |
| TC-RES-024 | Cancel reservation - confirmation dialog     | 1. Click Cancel<br>2. View confirmation dialog                                | "Are you sure?" dialog appears             | High     |
| TC-RES-025 | Cancel reservation - cancel action           | 1. Click Cancel<br>2. Click "No" in dialog                                    | Reservation not cancelled, dialog closes   | Medium   |
| TC-RES-026 | Cancel already cancelled reservation         | 1. View cancelled reservation<br>2. Try to cancel                             | Cancel button disabled                     | Medium   |
| TC-RES-027 | Cancel completed reservation                 | 1. View completed reservation<br>2. Try to cancel                             | Cancel button disabled                     | Medium   |
| TC-RES-028 | Cancel reservation - table becomes available | 1. Cancel reservation<br>2. Search same date/time<br>3. View results          | Table now shows as available               | High     |

---

## 4. Waitlist Management

### 4.1 Join Waitlist

| Test ID   | Test Case                              | Steps                                                                                             | Expected Result                              | Priority |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------- |
| TC-WL-001 | Join waitlist - all fields             | 1. Navigate to /waitlist<br>2. Select restaurant<br>3. Fill: name, phone, party size<br>4. Submit | Successfully joined waitlist, position shown | High     |
| TC-WL-002 | Join waitlist without login            | 1. Logout<br>2. Try to join waitlist                                                              | Error: "You must be logged in"               | High     |
| TC-WL-003 | Join waitlist - missing restaurant     | 1. Navigate to /waitlist<br>2. Don't select restaurant<br>3. Submit                               | Error: "Please select a restaurant"          | High     |
| TC-WL-004 | Join waitlist - invalid phone          | 1. Select restaurant<br>2. Enter invalid phone<br>3. Submit                                       | Error: "Invalid phone number format"         | Medium   |
| TC-WL-005 | Join waitlist - party size 0           | 1. Select restaurant<br>2. Enter party size: 0<br>3. Submit                                       | Error: "Party size must be positive"         | High     |
| TC-WL-006 | Join waitlist - verify position        | 1. Join waitlist<br>2. Another user joins<br>3. View waitlist                                     | Positions assigned correctly (1, 2, 3...)    | High     |
| TC-WL-007 | Join waitlist - auto-fill from profile | 1. Login<br>2. Navigate to /waitlist                                                              | Name and phone pre-filled from profile       | Medium   |

### 4.2 View Waitlist

| Test ID   | Test Case                      | Steps                                               | Expected Result                                    | Priority |
| --------- | ------------------------------ | --------------------------------------------------- | -------------------------------------------------- | -------- |
| TC-WL-008 | View waitlist for restaurant   | 1. Navigate to /waitlist<br>2. Select restaurant    | All waitlist entries displayed                     | High     |
| TC-WL-009 | View empty waitlist            | 1. Select restaurant with no waitlist<br>2. View    | "No one on the waitlist" message                   | Medium   |
| TC-WL-010 | View waitlist - verify order   | 1. Multiple users join waitlist<br>2. View waitlist | Entries shown in order (by position)               | High     |
| TC-WL-011 | View waitlist - status display | 1. View waitlist                                    | Status shown: WAITING, NOTIFIED, SEATED, CANCELLED | Medium   |
| TC-WL-012 | Waitlist - positional tracking  | 1. Multiple users join waitlist<br>2. Remove user at pos 1<br>3. Verify new pos 1 | Remaining users' positions shift correctly         | High     |
| TC-WL-013 | Waitlist - optional data fields | 1. Join waitlist with/without reservationDate/Time<br>2. Verify successful join | System handles exactOptionalPropertyTypes correctly | Medium   |

---

## 5. Staff Dashboard & Role-Based Access

### 5.1 Staff Login & Dashboard Access

| Test ID      | Test Case                              | Steps                                                     | Expected Result                   | Priority |
| ------------ | -------------------------------------- | --------------------------------------------------------- | --------------------------------- | -------- |
| TC-STAFF-001 | Staff login redirects to dashboard     | 1. Login with staff credentials<br>2. Verify redirect     | Redirected to /staff dashboard    | High     |
| TC-STAFF-002 | Admin login redirects to dashboard     | 1. Login with admin credentials<br>2. Verify redirect     | Redirected to /staff dashboard    | High     |
| TC-STAFF-003 | Customer login does not show dashboard | 1. Login with customer credentials<br>2. Check navigation | No "Staff Dashboard" link visible | High     |
| TC-STAFF-004 | Access dashboard without staff role    | 1. Login as customer<br>2. Navigate to /staff             | Access denied message displayed   | High     |
| TC-STAFF-005 | Dashboard displays user info           | 1. Login as staff<br>2. View dashboard                    | Name, role displayed correctly    | Medium   |

### 5.2 Waitlist Management by Staff

| Test ID      | Test Case                           | Steps                                                                     | Expected Result                                             | Priority |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| TC-STAFF-006 | View waitlist for restaurant        | 1. Login as staff<br>2. Select restaurant<br>3. View waitlist             | All waitlist entries displayed with details                 | High     |
| TC-STAFF-007 | View waitlist statistics            | 1. Select restaurant with waitlist<br>2. View dashboard                   | Statistics show: Waiting, Notified, Seated counts           | High     |
| TC-STAFF-008 | Notify customer from waitlist       | 1. View waitlist<br>2. Click "Notify" on entry<br>3. Verify status change | Status changes to NOTIFIED, entry moves to notified section | High     |
| TC-STAFF-009 | Seat customer from waitlist         | 1. View waitlist<br>2. Click "Seat" on entry<br>3. Verify status change   | Status changes to SEATED, entry moves to seated section     | High     |
| TC-STAFF-010 | Remove customer from waitlist       | 1. View waitlist<br>2. Click "Remove" on entry<br>3. Confirm              | Entry removed from waitlist                                 | High     |
| TC-STAFF-011 | Waitlist entries sorted by position | 1. View waitlist with multiple entries<br>2. Verify order                 | Entries displayed in ascending position order               | High     |
| TC-STAFF-012 | Empty waitlist display              | 1. Select restaurant with no waitlist<br>2. View dashboard                | "No one waiting in the queue" message                       | Medium   |

### 5.3 Reservation Viewing by Staff

| Test ID      | Test Case                     | Steps                                                                     | Expected Result                                    | Priority |
| ------------ | ----------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| TC-STAFF-013 | View today's reservations     | 1. Login as staff<br>2. Select restaurant<br>3. View reservations section | Today's reservations displayed                     | High     |
| TC-STAFF-014 | Reservation details displayed | 1. View reservations<br>2. Check details                                  | Reservation number, time, party size, status shown | High     |
| TC-STAFF-015 | Filter reservations by status | 1. View reservations<br>2. Check status badges                            | Status displayed with color coding                 | Medium   |

### 5.4 Role-Based Access Control

| Test ID      | Test Case                              | Steps                                                                  | Expected Result                | Priority |
| ------------ | -------------------------------------- | ---------------------------------------------------------------------- | ------------------------------ | -------- |
| TC-STAFF-016 | Customer cannot access waitlist API    | 1. Login as customer<br>2. Try to GET /api/v1/waitlist/restaurants/:id | 403 Forbidden error            | High     |
| TC-STAFF-017 | Customer cannot update waitlist status | 1. Login as customer<br>2. Try to PUT /api/v1/waitlist/:id/status      | 403 Forbidden error            | High     |
| TC-STAFF-018 | Staff can access waitlist API          | 1. Login as staff<br>2. GET /api/v1/waitlist/restaurants/:id           | Waitlist data returned         | High     |
| TC-STAFF-019 | Admin can access all staff features    | 1. Login as admin<br>2. Access all staff endpoints                     | All operations successful      | High     |
| TC-STAFF-020 | Staff dashboard link in navigation     | 1. Login as staff/admin<br>2. Check header navigation                  | "Staff Dashboard" link visible | Medium   |
| TC-STAFF-021 | Dashboard - Tabbed Navigation          | 1. Click "Today", "Future", "Past" tabs<br>2. Verify filtering      | Reservations filtered correctly by date comparison | High     |
| TC-STAFF-022 | Dashboard - Clear Table Functionality  | 1. Click "Clear Table" on active reservation<br>2. Verify status change | Status: COMPLETED, Table becomes AVAILABLE      | High     |
| TC-STAFF-023 | Dashboard - Detailed Reservation Cards | 1. View card in dashboard<br>2. Check for Phone/Special Requests    | All relevant customer info visible at a glance    | Medium   |

---

## 6. UI/UX & Responsiveness

### 5.1 Mobile Responsiveness

| Test ID   | Test Case                      | Steps                                                | Expected Result                                      | Priority |
| --------- | ------------------------------ | ---------------------------------------------------- | ---------------------------------------------------- | -------- |
| TC-UI-001 | Mobile view - home page        | 1. Open on mobile (375px width)<br>2. View home page | Layout responsive, text readable, buttons accessible | High     |
| TC-UI-002 | Mobile view - search page      | 1. Open /search on mobile<br>2. View form            | Form fields stack vertically, touch-friendly         | High     |
| TC-UI-003 | Mobile view - reservation list | 1. Open /reservation on mobile<br>2. View list       | Cards stack properly, text readable                  | High     |
| TC-UI-004 | Mobile view - navigation menu  | 1. Open on mobile<br>2. Click hamburger menu         | Menu expands, all links accessible                   | High     |
| TC-UI-005 | Mobile view - forms            | 1. Open any form on mobile<br>2. Fill fields         | Input fields properly sized, keyboard accessible     | High     |
| TC-UI-006 | Mobile view - tables grid      | 1. Search tables on mobile<br>2. View results        | Tables displayed in single column or 2 columns       | Medium   |

### 5.2 Error Handling & Messages

| Test ID   | Test Case                | Steps                                                  | Expected Result                            | Priority |
| --------- | ------------------------ | ------------------------------------------------------ | ------------------------------------------ | -------- |
| TC-UI-007 | Error message display    | 1. Submit invalid form<br>2. View errors               | Clear error messages displayed near fields | High     |
| TC-UI-008 | Success message display  | 1. Create reservation<br>2. View confirmation          | Success message/alert displayed            | High     |
| TC-UI-009 | Loading states           | 1. Submit form<br>2. Wait for response                 | Loading spinner/indicator shown            | High     |
| TC-UI-010 | Network error handling   | 1. Disconnect internet<br>2. Try to create reservation | Error: "Network error, please try again"   | Medium   |
| TC-UI-011 | 401 error handling       | 1. Token expires<br>2. Make API call                   | Redirected to login, error message shown   | High     |
| TC-UI-012 | 404 error handling       | 1. Navigate to non-existent route                      | 404 page or redirect to home               | Low      |
| TC-UI-013 | Validation error details | 1. Submit form with multiple errors<br>2. View errors  | All validation errors displayed            | High     |
| TC-UI-014 | Actionable 429 Error Message | 1. Trigger rate limit<br>2. View error toast           | Message explains why and when to try again    | High     |
| TC-UI-015 | Actionable 401 Error Message | 1. Use expired session<br>2. Attempt action            | Message directs user to log in again          | High     |

### 5.3 Navigation & Routing

| Test ID   | Test Case                 | Steps                                                 | Expected Result                             | Priority |
| --------- | ------------------------- | ----------------------------------------------------- | ------------------------------------------- | -------- |
| TC-UI-014 | Navigation links          | 1. Click each nav link                                | Correct page loads                          | High     |
| TC-UI-015 | Protected route access    | 1. Logout<br>2. Try to access /reservation            | Redirected to /login                        | High     |
| TC-UI-016 | Back button functionality | 1. Navigate through pages<br>2. Click browser back    | Previous page loads correctly               | Medium   |
| TC-UI-017 | Direct URL access         | 1. Type /reservation in address bar<br>2. Press Enter | Page loads if authenticated, else redirects | High     |

---

## 6. Data Validation & Edge Cases

### 6.1 Input Validation

| Test ID    | Test Case                           | Steps                                                               | Expected Result                                | Priority |
| ---------- | ----------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| TC-VAL-001 | Date validation - future dates only | 1. Enter past date in search<br>2. Submit                           | Error or no results                            | High     |
| TC-VAL-002 | Time validation - 24-hour format    | 1. Enter time: "7:00 PM"<br>2. Submit                               | Error: "Invalid time format (HH:MM)"           | High     |
| TC-VAL-003 | UUID validation                     | 1. Try to access reservation with invalid ID<br>2. View             | Error: "Invalid reservation ID"                | Medium   |
| TC-VAL-004 | String length limits                | 1. Enter >255 chars in name field<br>2. Submit                      | Error: "Name must be max 255 characters"       | Medium   |
| TC-VAL-005 | Number validation - negative values | 1. Enter -5 as party size<br>2. Submit                              | Error: "Party size must be positive"           | High     |
| TC-VAL-006 | Empty string handling               | 1. Submit form with empty strings in optional fields                | Empty strings converted to undefined, no error | High     |
| TC-VAL-007 | SQL injection attempt               | 1. Enter: "'; DROP TABLE--" in any field<br>2. Submit               | Input sanitized, no SQL executed               | High     |
| TC-VAL-008 | XSS attempt                         | 1. Enter: "<script>alert('xss')</script>" in any field<br>2. Submit | Input sanitized, script not executed           | High     |

### 6.2 Edge Cases

| Test ID     | Test Case                              | Steps                                                                   | Expected Result                           | Priority |
| ----------- | -------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- | -------- |
| TC-EDGE-001 | Reservation at restaurant opening time | 1. Search for time = opening time<br>2. Create reservation              | Reservation created successfully          | Medium   |
| TC-EDGE-002 | Reservation at restaurant closing time | 1. Search for time = closing time<br>2. Create reservation              | Reservation created or error if too late  | Medium   |
| TC-EDGE-003 | Maximum party size reservation         | 1. Search with party size = max table capacity<br>2. Create reservation | Reservation created successfully          | Medium   |
| TC-EDGE-004 | Minimum party size reservation         | 1. Search with party size = 1<br>2. Create reservation                  | Reservation created if table allows       | Medium   |
| TC-EDGE-005 | Multiple reservations same user        | 1. Create 5 reservations for same user<br>2. View list                  | All reservations displayed correctly      | Medium   |
| TC-EDGE-006 | Reservation spanning midnight          | 1. Create reservation at 23:00 with 2-hour duration<br>2. Verify        | Duration calculated correctly across days | Low      |
| TC-EDGE-007 | Leap year date handling                | 1. Create reservation for Feb 29, 2028<br>2. Verify                     | Date accepted and stored correctly        | Low      |
| TC-EDGE-008 | Timezone handling                      | 1. Create reservation<br>2. Verify time stored                          | Time stored in restaurant's timezone      | Medium   |

---

## 7. Performance & Concurrency

### 7.1 Concurrent Operations

| Test ID     | Test Case                       | Steps                                                                     | Expected Result                              | Priority |
| ----------- | ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- | -------- |
| TC-PERF-001 | Concurrent reservation creation | 1. Two users search same table/time<br>2. Both try to book simultaneously | Only one succeeds, other gets conflict error | High     |
| TC-PERF-002 | Concurrent updates              | 1. User A and B edit same reservation<br>2. Both save                     | Optimistic locking prevents conflict         | High     |
| TC-PERF-003 | Multiple simultaneous searches  | 1. 10 users search simultaneously<br>2. Verify results                    | All searches complete, correct results       | Medium   |
| TC-PERF-004 | Rate limiting                   | 1. Send 101 requests in 15 minutes<br>2. Verify                           | 101st request returns 429 Too Many Requests  | Medium   |

### 7.2 Performance

| Test ID     | Test Case              | Steps                                            | Expected Result                        | Priority |
| ----------- | ---------------------- | ------------------------------------------------ | -------------------------------------- | -------- |
| TC-PERF-005 | Page load time         | 1. Navigate to each page<br>2. Measure load time | Pages load in < 2 seconds              | Medium   |
| TC-PERF-006 | Search response time   | 1. Perform search<br>2. Measure response         | Results appear in < 1 second           | Medium   |
| TC-PERF-007 | Large reservation list | 1. Create 50 reservations<br>2. View list        | List loads and displays in < 2 seconds | Low      |

---

## 8. Integration & Inter-Service Communication

### 8.1 Service Integration

| Test ID    | Test Case                               | Steps                                                                                           | Expected Result                                    | Priority |
| ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| TC-INT-001 | Table service calls reservation service | 1. Search for availability<br>2. Verify reserved tables excluded                                | Reserved tables not shown as available             | High     |
| TC-INT-002 | Reservation service unavailable         | 1. Stop reservation service<br>2. Search for tables                                             | Table service handles gracefully, shows all tables | Medium   |
| TC-INT-003 | User service authentication             | 1. Login<br>2. Create reservation                                                               | Reservation service validates JWT token            | High     |
| TC-INT-004 | Cross-service data consistency          | 1. Create reservation<br>2. Verify in reservation service<br>3. Verify table marked as reserved | Data consistent across services                    | High     |

---

## 9. Security Testing

### 9.1 Authentication & Authorization

| Test ID    | Test Case                            | Steps                                                          | Expected Result                        | Priority |
| ---------- | ------------------------------------ | -------------------------------------------------------------- | -------------------------------------- | -------- |
| TC-SEC-001 | Access protected route without token | 1. Logout<br>2. Direct API call to /api/v1/reservations        | 401 Unauthorized                       | High     |
| TC-SEC-002 | Access with invalid token            | 1. Use invalid JWT token<br>2. Make API call                   | 401 Unauthorized                       | High     |
| TC-SEC-003 | Access with expired token            | 1. Wait for token expiry<br>2. Make API call                   | 401 Unauthorized, redirect to login    | High     |
| TC-SEC-004 | Access other user's reservation      | 1. Login as User A<br>2. Try to access User B's reservation ID | 403 Forbidden or 404 Not Found         | High     |
| TC-SEC-005 | Token refresh                        | 1. Login<br>2. Use refresh token<br>3. Verify new access token | New token issued and works             | Medium   |
| TC-SEC-006 | Password not in response             | 1. Register/Login<br>2. Check API response                     | Password/hash not included in response | High     |

---

## 10. Browser Compatibility

### 10.1 Cross-Browser Testing

| Test ID      | Test Case             | Steps                           | Expected Result             | Priority |
| ------------ | --------------------- | ------------------------------- | --------------------------- | -------- |
| TC-BROWS-001 | Chrome compatibility  | 1. Test all features in Chrome  | All features work correctly | High     |
| TC-BROWS-002 | Edge compatibility    | 1. Test all features in Edge    | All features work correctly | High     |
| TC-BROWS-003 | Firefox compatibility | 1. Test all features in Firefox | All features work correctly | Medium   |
| TC-BROWS-004 | Safari compatibility  | 1. Test all features in Safari  | All features work correctly | Medium   |

---

## Test Execution Checklist

### Pre-Test Setup

- [ ] All services running (user, reservation, table, frontend)
- [ ] Databases seeded with test data
- [ ] Clear browser cache and localStorage
- [ ] Test accounts created
- [ ] Network connection stable

### Test Execution Order

1. **Setup & DevOps Verification** (TC-DEV-001 to TC-DEV-003)
2. **Authentication Tests** (TC-AUTH-001 to TC-AUTH-020)
3. **Restaurant Search Tests** (TC-REST-001 to TC-REST-005)
4. **Availability Search Tests** (TC-AVAIL-001 to TC-AVAIL-010)
5. **Reservation Creation Tests** (TC-RES-001 to TC-RES-009)
6. **Reservation View Tests** (TC-RES-010 to TC-RES-014)
7. **Reservation Update Tests** (TC-RES-015 to TC-RES-022)
8. **Reservation Cancel Tests** (TC-RES-023 to TC-RES-028)
9. **Waitlist Tests** (TC-WL-001 to TC-WL-013)
10. **Staff Dashboard Tests** (TC-STAFF-001 to TC-STAFF-023)
11. **UI/UX Tests** (TC-UI-001 to TC-UI-015)
12. **Validation Tests** (TC-VAL-001 to TC-VAL-008)
12. **Edge Cases** (TC-EDGE-001 to TC-EDGE-008)
13. **Performance Tests** (TC-PERF-001 to TC-PERF-007)
14. **Integration Tests** (TC-INT-001 to TC-INT-004)
15. **Security Tests** (TC-SEC-001 to TC-SEC-006)

### Test Data Requirements

- **Test Users**: 3-5 users with different roles
- **Test Restaurants**: 3 restaurants in different cities
- **Test Tables**: 20+ tables with varying capacities
- **Test Reservations**: 10+ existing reservations across different dates/times

### Defect Reporting Template

```
Test ID: [TC-XXX-XXX]
Severity: [High/Medium/Low]
Status: [Pass/Fail/Blocked]
Steps to Reproduce:
1.
2.
3.
Expected Result:
Actual Result:
Screenshots: [if applicable]
```

### Test Completion Criteria

- [ ] All High priority tests executed
- [ ] All Medium priority tests executed
- [ ] At least 80% of Low priority tests executed
- [ ] All critical defects fixed and retested
- [ ] Test report generated

---

## Notes

- **Priority Levels**:
  - **High**: Critical functionality, must work for system to be usable
  - **Medium**: Important functionality, affects user experience
  - **Low**: Nice-to-have, edge cases, minor improvements

- **Test Environment**: Ensure consistent test environment for reproducible results

- **Data Cleanup**: Reset test data between test runs if needed

- **Automation**: Consider automating repetitive test cases (TC-AUTH-001, TC-RES-001, etc.)
