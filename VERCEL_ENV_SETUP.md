## Quick Start - Environment Variables Setup

### 🎯 Frontend Environment Variables (Vercel Dashboard)

Navigate to: **Frontend Project → Settings → Environment Variables**

Add these variables:

```bash
# Required
NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
NODE_ENV=production

# Note: MONGODB_URI and SESSION_SECRET are NO LONGER needed in frontend
# The backend handles all database and session management
```

---

### 🎯 Backend Environment Variables (Vercel Dashboard)

Navigate to: **Backend Project → Settings → Environment Variables**

Add these variables:

```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pg-meal-tracker
JWT_SECRET=paste_64_char_secret_here
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

---

### 🔐 Generate Secrets

Run this command to generate secure secret for backend JWT:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use the output for `JWT_SECRET` (backend only).

---

### 📋 Deployment Order

1. **Deploy Backend First** → Get the backend URL
2. **Deploy Frontend** → Use backend URL in `NEXT_PUBLIC_BACKEND_URL`
3. **Update Backend** → Set `FRONTEND_URL` to your frontend URL
4. **Redeploy Both** if you changed environment variables

---

### 🔗 After Both Are Deployed

Make sure to:
- [ ] Copy backend URL and add to frontend's `NEXT_PUBLIC_BACKEND_URL`
- [ ] Copy frontend URL and add to backend's `FRONTEND_URL`
- [ ] Redeploy both applications after updating environment variables

---

For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)
