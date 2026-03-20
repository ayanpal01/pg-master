# PG Master API Testing Guide (Postman)

This guide provides instructions on how to test all the endpoints of the PG Master Backend API using Postman.

## 1. Setup Postman Environment
First, create an Environment in Postman (e.g., `PG Master Local` or `PG Master Prod`) with the following variables:
- `base_url`: `http://localhost:4000` (for local) or `https://pg-master-backend.onrender.com` (for production).

## 2. Authentication (Important)
The backend uses **HTTP-Only Cookies** for authentication via the `session` cookie.
To make this work in Postman:
1. In Postman, go to the **Settings** (gear icon) -> **General**.
2. Make sure **"Cookie jar"** is enabled or just rely on Postman automatically saving cookies for the domain.
3. Whenever you hit `/api/setup` or `/api/auth/login`, Postman will automatically save the `session` cookie and attach it to subsequent requests.

---

## 3. API Endpoints

### A. Setup & Authentication
These endpoints are either public or handle authentication.

#### 1. Setup New PG (Public)
Creates a new PG, assigns a manager, and logs them in (sets the `session` cookie).
* **Method & URL:** `POST {{base_url}}/api/setup`
* **Body (JSON):**
  ```json
  {
    "name": "My Awesome PG",
    "managerName": "John Doe",
    "phoneNumber": "9876543210",
    "mealTypes": ["breakfast", "lunch", "dinner"]
  }
  ```
_Note: Save the `managerKey` returned in the response for future logins._

#### 2. Login (Public)
Logs in a user or manager using their unique key.
* **Method & URL:** `POST {{base_url}}/api/auth/login`
* **Body (JSON):**
  ```json
  {
    "uniqueKey": "YOUR_UNIQUE_KEY_HERE"
  }
  ```

#### 3. Get Profile (Auth Required)
Retrieves the logged-in user's profile and populated PG context.
* **Method & URL:** `GET {{base_url}}/api/auth/profile`

#### 4. Reset Own Key (Auth Required)
Changes the manager's current passkey and re-issues a new session.
* **Method & URL:** `POST {{base_url}}/api/auth/reset-key`

#### 5. Logout (Auth Required)
Clears the session cookie.
* **Method & URL:** `POST {{base_url}}/api/auth/logout`

---

### B. PG & Member Management (Manager Only)

#### 1. Get PG Details & Members
* **Method & URL:** `GET {{base_url}}/api/pg`

#### 2. Add New Member
* **Method & URL:** `POST {{base_url}}/api/pg/members`
* **Body (JSON):**
  ```json
  {
    "name": "Jane Smith",
    "phoneNumber": "1234567890"
  }
  ```

#### 3. Reset Member Key
* **Method & URL:** `PATCH {{base_url}}/api/pg/members`
* **Body (JSON):**
  ```json
  {
    "userId": "65ac123b45c..."
  }
  ```

#### 4. Update PG Settings
Updates custom settings like individual cooking charges.
* **Method & URL:** `PATCH {{base_url}}/api/pg`
* **Body (JSON):**
  ```json
  {
    "cookingChargePerUser": {
      "65ac123b45c...": 500
    }
  }
  ```

---

### C. Attendance

#### 1. Get Attendance
* **Method & URL:** `GET {{base_url}}/api/attendance?month=2026-03` (For whole month)
* **Method & URL:** `GET {{base_url}}/api/attendance?date=2026-03-15` (For specific date)

#### 2. Member: Toggle Own Meal
A member proposing or rejecting a specific meal.
* **Method & URL:** `POST {{base_url}}/api/attendance`
* **Body (JSON):**
  ```json
  {
    "toggle": true,
    "mealType": "dinner",
    "status": false
  }
  ```

#### 3. Manager: Record Daily Attendance
Manager saving the finalized attendance sheet for the day.
* **Method & URL:** `POST {{base_url}}/api/attendance`
* **Body (JSON):**
  ```json
  {
    "date": "2026-03-15",
    "records": [
      {
        "userId": "65ac123b45c...",
        "mealType": "breakfast",
        "status": true
      }
    ]
  }
  ```

---

### D. Expenses

#### 1. Get Expenses
* **Method & URL:** `GET {{base_url}}/api/expenses`
* **Filters:** Use `?status=PENDING` or `?status=APPROVED` or `?status=REJECTED`

#### 2. Add Expense (Manager only)
* **Method & URL:** `POST {{base_url}}/api/expenses`
* **Body (JSON):**
  ```json
  {
    "amount": 250,
    "description": "Vegetables",
    "date": "2026-03-15T10:00:00.000Z",
    "spentBy": "65ac123b45c..." 
  }
  ```
_(Note: `spentBy` is optional. If omitted, it assigns to the logged-in manager)._

#### 3. Approve or Reject Expense (Manager only)
* **Method & URL:** `PATCH {{base_url}}/api/expenses`
* **Body (JSON):**
  ```json
  {
    "expenseId": "65ac999b...",
    "status": "APPROVED" 
  }
  ```
_(Status can be `"APPROVED"` or `"REJECTED"`)_

#### 4. Edit Expense Fields (Manager only)
* **Method & URL:** `PATCH {{base_url}}/api/expenses/:id`
* **Body (JSON):**
  ```json
  {
    "amount": 300,
    "description": "More Vegetables"
  }
  ```

#### 5. Delete Expense (Manager only)
* **Method & URL:** `DELETE {{base_url}}/api/expenses/:id`

---

### E. Payments

#### 1. Get Payments
* **Method & URL:** `GET {{base_url}}/api/payments`
* **Filter:** Use `?userId=65ac123b45c...` to filter by user.

#### 2. Add Payment (Manager only)
* **Method & URL:** `POST {{base_url}}/api/payments`
* **Body (JSON):**
  ```json
  {
    "userId": "65ac123b45c...",
    "amount": 1500,
    "note": "March rent",
    "date": "2026-03-15T12:00:00.000Z"
  }
  ```

#### 3. Edit Payment (Manager only)
* **Method & URL:** `PATCH {{base_url}}/api/payments/:id`
* **Body (JSON):**
  ```json
  {
    "amount": 2000,
    "note": "March rent + due"
  }
  ```

#### 4. Delete Payment (Manager only)
* **Method & URL:** `DELETE {{base_url}}/api/payments/:id`

---

### F. Statistics & Settlement

#### 1. Get Monthly Stats
Gets calculated meals, expenses, and balances per user.
* **Method & URL:** `GET {{base_url}}/api/stats?month=2026-03`

#### 2. Lock/Settle Month (Manager only)
Closes the month and locks the balances.
* **Method & URL:** `POST {{base_url}}/api/stats/lock`
* **Body (JSON):**
  ```json
  {
    "month": "2026-03",
    "mealCharge": 50
  }
  ```
