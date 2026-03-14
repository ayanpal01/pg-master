# Security Implementation - PG Master

## Overview
This document outlines the comprehensive security measures implemented to protect user data and prevent unauthorized access across the PG Master application.

---

## 🔐 Authentication & Session Management

### **HTTP-Only Cookies**
```typescript
// Backend: backend/src/routes/auth.ts
const COOKIE_OPTS = {
  httpOnly: true,  // ✅ Cannot be accessed via JavaScript (prevents XSS)
  secure: true,    // ✅ Only sent over HTTPS in production
  sameSite: 'lax', // ✅ Protects against CSRF attacks
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};
```

**Security Benefits:**
- ✅ **XSS Protection**: Cookie cannot be accessed by JavaScript
- ✅ **CSRF Protection**: SameSite policy prevents cross-site request forgery
- ✅ **Man-in-the-Middle Protection**: Secure flag ensures HTTPS only in production
- ✅ **Automatic Expiry**: Sessions expire after 24 hours

### **JWT Token Verification**
```typescript
// Backend: backend/src/middleware/auth.ts
- Every API request verifies JWT from cookie
- Invalid/expired tokens are immediately rejected
- Cookie is cleared on authentication failure
- User existence and active status verified
```

---

## 🏠 PG Data Isolation

### **Principle: Users Can Only Access Their Own PG's Data**

Every authenticated endpoint enforces PG isolation:

#### **Expenses**
```typescript
// ✅ Users can only view expenses from their PG
GET /api/expenses?status=PENDING
- Checks: req.user.pgId exists
- Filters: expenses.pgId === req.user.pgId

// ✅ Users cannot add expenses for other PGs
POST /api/expenses
- Checks: Manager role required
- Checks: spentBy user belongs to same PG
- Validation: Cannot assign expense to user from different PG

// ✅ Users cannot modify expenses from other PGs
PATCH /api/expenses
- Checks: Manager role required
- Verification: expense.pgId === req.user.pgId before update
- Rejects: Attempts to modify cross-PG expenses

// ✅ Users cannot delete expenses from other PGs
DELETE /api/expenses/:id
- Checks: Manager role required
- Verification: expense.pgId === req.user.pgId before deletion
```

#### **Payments**
```typescript
// ✅ Users can only view payments from their PG
GET /api/payments
- Filters: payment.pgId === req.user.pgId

// ✅ Cannot record payments for users in other PGs
POST /api/payments
- Checks: Manager role required
- Verification: target user.pgId === req.user.pgId
- Rejects: Recording payment for user from different PG

// ✅ Cannot modify payments from other PGs
PATCH /api/payments/:id
- Verification: payment.pgId === req.user.pgId before update

// ✅ Cannot delete payments from other PGs
DELETE /api/payments/:id
- Verification: payment.pgId === req.user.pgId before deletion
```

#### **Attendance**
```typescript
// ✅ Users can only view attendance from their PG
GET /api/attendance
- Filters: attendance.pgId === req.user.pgId

// ✅ Members can only toggle their own meals
POST /api/attendance (toggle mode)
- User can only modify their own meal status
- Cannot toggle meals for other users

// ✅ Managers can only record attendance for their PG
POST /api/attendance (record mode)
- Manager role required
- Records only for their pgId
```

#### **Statistics**
```typescript
// ✅ Users can only see stats from their PG
GET /api/stats/monthly?month=2026-03
- Filters: ALL queries by req.user.pgId
- Returns: attendance, expenses, payments only from user's PG
```

---

## 👥 Role-Based Access Control (RBAC)

### **Manager-Only Operations**
Only users with `role === 'MANAGER'` can:
- ✅ Add expenses
- ✅ Approve/reject expenses
- ✅ Record payments
- ✅ Update/delete payments
- ✅ Record attendance for all members
- ✅ Add new members
- ✅ Reset member keys
- ✅ Update PG settings
- ✅ Transfer manager rights
- ✅ Finalize monthly billing

### **Member Operations**
Regular members can:
- ✅ View expenses, payments, attendance from their PG
- ✅ Toggle their own meal status
- ✅ View their own profile
- ✅ Reset their own key
- ✅ View PG statistics

---

## 🛡️ Additional Security Measures

### **1. Content Security Policy (CSP)**
```typescript
// Frontend: frontend/src/middleware.ts
Content-Security-Policy:
  - default-src 'self'
  - connect-src 'self' [backend-url]  // Only allows connections to backend
  - script-src 'self' 'unsafe-inline' 'unsafe-eval'
  - frame-ancestors 'none'  // Prevents clickjacking
```

### **2. CORS Protection**
```typescript
// Backend: backend/src/index.ts
cors({
  origin: FRONTEND_URL,  // Only allows requests from frontend
  credentials: true,     // Required for cookie exchange
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
})
```

### **3. Security Headers**
```typescript
// Both frontend and backend enforce:
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
```

### **4. Input Validation**
```typescript
// All endpoints validate:
- Required fields are present
- Data types are correct
- IDs exist before operations
- Cross-PG operations are blocked
```

### **5. Error Message Security**
```typescript
// Generic error messages prevent information leakage:
❌ BAD:  "User with ID 12345 not found in database"
✅ GOOD: "Unauthorized" or "Resource not found"
```

---

## 🔒 What You CANNOT Do

### **❌ Cross-PG Data Access**
- Cannot view expenses from another PG (even if you know the expense ID)
- Cannot view attendance from another PG
- Cannot view payments from another PG
- Cannot view members from another PG
- Cannot modify or delete data belonging to other PGs

### **❌ Privilege Escalation**
- Regular members cannot perform manager operations
- Cannot approve expenses
- Cannot add/remove members
- Cannot modify PG settings
- Cannot finalize monthly billing

### **❌ Session Manipulation**
- Cannot access cookies via JavaScript (httpOnly)
- Cannot forge JWT tokens (cryptographically signed)
- Cannot reuse expired sessions (validated on every request)
- Cannot access another user's session

### **❌ Unauthorized Actions**
- Cannot access API without valid session cookie
- Cannot bypass authentication middleware
- Cannot perform operations on inactive users
- Cannot access data before joining a PG

---

## 🎯 Security Testing Scenarios

### **Test 1: Cross-PG Data Access**
```bash
# User A in PG 1 tries to access User B's expense in PG 2
DELETE /api/expenses/{pg2_expense_id}
# Result: 403 Forbidden - "Cannot delete expense from different PG"
```

### **Test 2: Role Escalation**
```bash
# Regular member tries to approve expense
PATCH /api/expenses
Body: { expenseId: "...", status: "APPROVED" }
# Result: 403 Forbidden - "Only managers can approve/reject expenses"
```

### **Test 3: Session Tampering**
```bash
# Modified JWT token in cookie
GET /api/auth/profile
# Result: 401 Unauthorized - "Session expired or invalid"
```

### **Test 4: Missing Authentication**
```bash
# Request without session cookie
GET /api/expenses
# Result: 401 Unauthorized - "Unauthorized: no session cookie"
```

---

## 📊 Security Audit Checklist

- [x] All API routes require authentication (except /api/setup)
- [x] All database queries filter by user's pgId
- [x] Manager-only operations check role before execution
- [x] Cross-PG data modifications are blocked
- [x] Cookies are httpOnly and secure
- [x] JWT tokens are verified on every request
- [x] Expired sessions are rejected
- [x] CSP prevents unauthorized connections
- [x] CORS restricts requests to frontend domain
- [x] Input validation prevents injection attacks
- [x] Error messages don't leak sensitive information
- [x] User existence checked before operations
- [x] Active status verified for all operations

---

## 🚀 Production Deployment Security

### **Environment Variables (Must Set)**
```bash
# Backend
JWT_SECRET=<generate-64-char-random-string>  # CRITICAL!
FRONTEND_URL=https://your-frontend.vercel.app  # Exact match
NODE_ENV=production  # Enables secure cookies

# Frontend
NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
NODE_ENV=production
```

### **Generate Secure JWT Secret**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Use output for JWT_SECRET
```

### **MongoDB Atlas Security**
1. ✅ Whitelist only Vercel IPs (or 0.0.0.0/0 for simplicity)
2. ✅ Use strong database password (20+ characters)
3. ✅ Create database user with only read/write permissions
4. ✅ Enable MongoDB Atlas encryption at rest

### **Vercel Settings**
1. ✅ Set environment variables for each deployment
2. ✅ Enable automatic HTTPS
3. ✅ Use custom domain with HTTPS
4. ✅ Redeploy after changing environment variables

---

## 🔍 Security Monitoring

### **What to Monitor**
- Failed login attempts (401 responses to /api/auth/login)
- 403 Forbidden responses (potential unauthorized access attempts)
- Unusual patterns (same user hitting multiple 403s)
- Session expiry rates
- Database query errors

### **Logging Best Practices**
```typescript
// Log security events without exposing sensitive data
✅ GOOD: "Failed login attempt from IP: xxx.xxx.xxx.xxx"
❌ BAD:  "Failed login with key: PG-1234-ABCD"
```

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

## ⚠️ Important Security Notes

1. **NEVER** commit `.env` files to Git
2. **ALWAYS** use strong JWT secrets (64+ characters)
3. **ROTATE** JWT secrets periodically (every 90 days)
4. **MONITOR** failed authentication attempts
5. **UPDATE** dependencies regularly for security patches
6. **BACKUP** database regularly
7. **TEST** security measures before production deployment

---

**Last Updated**: March 6, 2026
**Version**: 1.0
**Status**: ✅ Production Ready
