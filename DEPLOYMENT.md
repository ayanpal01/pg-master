# Vercel Deployment Guide - PG Master

This guide will help you deploy both the frontend (Next.js) and backend (Express.js) on Vercel as separate applications.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A MongoDB database (MongoDB Atlas recommended)
3. Vercel CLI installed (optional): `npm install -g vercel`

---

## Part 1: Deploy Backend (Express.js API)

### Step 1: Prepare Backend

The backend is already configured with `vercel.json`. Ensure you have:
- ✅ `backend/vercel.json` - already created
- ✅ `backend/.env.example` - already created

### Step 2: Deploy Backend to Vercel

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository (or deploy directly)
4. **Root Directory**: Set to `backend`
5. **Framework Preset**: Other
6. Click **"Deploy"**

**Option B: Using Vercel CLI**

```bash
cd backend
vercel
# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? pgmaster-backend (or your choice)
# - Directory? ./
```

### Step 3: Configure Backend Environment Variables

After deployment, add environment variables in Vercel Dashboard:

1. Go to your backend project in Vercel
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pg-meal-tracker
JWT_SECRET=<generate-a-64-char-secret>
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

**Important**: 
- Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `FRONTEND_URL` will be set after deploying the frontend (come back to this)

4. **Redeploy** the backend after adding environment variables

### Step 4: Note Your Backend URL

After deployment, copy your backend URL (e.g., `https://pgmaster-backend.vercel.app`)
You'll need this for the frontend configuration.

---

## Part 2: Deploy Frontend (Next.js)

### Step 1: Prepare Frontend

Frontend is already configured with `.env.example` file.

### Step 2: Deploy Frontend to Vercel

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository (or deploy directly)
4. **Root Directory**: Set to `frontend`
5. **Framework Preset**: Next.js (auto-detected)
6. Click **"Deploy"**

**Option B: Using Vercel CLI**

```bash
cd frontend
vercel
# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? pgmaster-frontend (or your choice)
# - Directory? ./
```

### Step 3: Configure Frontend Environment Variables

Add environment variables in Vercel Dashboard:

1. Go to your frontend project in Vercel
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_BACKEND_URL=https://pgmaster-backend.vercel.app
NODE_ENV=production
```

**Note**: `MONGODB_URI` and `SESSION_SECRET` are no longer needed in frontend as the backend handles database and session management.

**Optional Firebase Variables** (if using Firebase):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

**Important**: 
- Generate SESSION_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Use the backend URL from Step 4 of Part 1
- **Redeploy** the frontend after adding environment variables

### Step 4: Note Your Frontend URL

After deployment, copy your frontend URL (e.g., `https://pgmaster-frontend.vercel.app`)

---

## Part 3: Connect Frontend and Backend

### Step 1: Update Backend CORS Setting

Go back to your **backend project** in Vercel:

1. Navigate to **Settings → Environment Variables**
2. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   FRONTEND_URL=https://pgmaster-frontend.vercel.app
   ```
3. **Redeploy** the backend

### Step 2: Verify CORS Headers

The backend is configured to accept requests from `FRONTEND_URL`. Make sure:
- No trailing slash in `FRONTEND_URL`
- The URL matches exactly (including https://)

---

## Part 4: Testing Your Deployment

### Test Backend

```bash
curl https://pgmaster-backend.vercel.app/health
# Should return: {"status":"ok","time":"..."}
```

### Test Frontend

1. Open your frontend URL in a browser
2. Try logging in with a user's unique key
3. Check browser console for any CORS errors

### Common Issues

**CORS Errors**:
- Make sure `FRONTEND_URL` in backend matches frontend URL exactly
- Redeploy backend after changing environment variables

**MongoDB Connection Errors**:
- Verify `MONGODB_URI` is correct
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or Vercel's IP ranges
- Check database user has read/write permissions

**Environment Variable Not Loading**:
- Vercel requires redeployment after adding/changing environment variables
- Go to Deployments tab → Click "..." → Redeploy

---

## Architecture Notes

Your application uses a **clean separation** between frontend and backend:

1. **Frontend (Next.js)** (`frontend/src/*`): 
   - Pure React UI components
   - No database access
   - Calls Express backend API
   
2. **Backend (Express)** (`backend/src/*`):
   - REST API endpoints
   - MongoDB database connection
   - Authentication & business logic

**Current Setup**: Frontend makes HTTP requests to the Express backend. All API logic is in the backend. The old Next.js API routes (`frontend/src/app/api/*`) are no longer used and can be deleted if desired.

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Continuous Deployment

Once deployed, Vercel will automatically redeploy when you push to your connected Git repository:

- **main/master branch** → Production deployment
- **Other branches** → Preview deployments

Configure this in: **Settings → Git**

---

## Security Checklist

- [ ] Generate strong `JWT_SECRET` and `SESSION_SECRET`
- [ ] Update MongoDB URI with production credentials
- [ ] Whitelist Vercel IPs in MongoDB Atlas
- [ ] Set `NODE_ENV=production` in both projects
- [ ] Never commit `.env` or `.env.local` files to Git
- [ ] Add `.env*` to `.gitignore` (already done)

---

## Useful Commands

```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# View deployment logs (Vercel CLI)
vercel logs <deployment-url>

# Promote deployment to production
vercel --prod
```

---

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)

---

## Quick Reference

### Backend URLs
- Local: `http://localhost:4000`
- Production: `https://your-backend-name.vercel.app`

### Frontend URLs
- Local: `http://localhost:3000`
- Production: `https://your-frontend-name.vercel.app`

### Required Environment Variables

**Backend:**
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`
- `NODE_ENV`

**Frontend:**
- `MONGODB_URI`
- `SESSION_SECRET`
- `NEXT_PUBLIC_BACKEND_URL` (optional)
- `NODE_ENV`
