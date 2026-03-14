# Architecture Update: Separated Frontend & Backend

Your PG Master application has been successfully refactored to separate the frontend and backend completely.

## What Changed?

### Before:
- Frontend had Next.js API routes (`frontend/src/app/api/*`)
- Backend had Express API routes (`backend/src/routes/*`)
- Frontend components called Next.js API routes
- **Hybrid architecture** - both layers had database access

### After:
- **Frontend**: Pure React/Next.js UI - no API routes needed
- **Backend**: Express REST API - handles all data operations
- Frontend calls Express backend via HTTP
- **Clean separation** - single source of truth for API logic

## New Architecture

```
┌─────────────────────────────────────┐
│         Frontend (Next.js)          │
│  - React Components                 │
│  - UI/UX Layer                      │
│  - Calls Backend API                │
└──────────────┬──────────────────────┘
               │
               │ HTTP Requests
               │ (axios with credentials)
               ▼
┌─────────────────────────────────────┐
│       Backend (Express.js)          │
│  - REST API Endpoints               │
│  - Business Logic                   │
│  - MongoDB Connection               │
│  - Authentication                   │
└─────────────────────────────────────┘
```

## Files Created/Modified

### New Files:
1. **`frontend/src/lib/api-client.ts`**: 
   - Axios instance configured for backend API
   - Handles credentials (cookies)
   - Base URL from `NEXT_PUBLIC_BACKEND_URL`

### Modified Files:
All frontend components now use `apiClient` instead of calling local `/api/*` routes:
- `frontend/src/hooks/use-auth.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/setup-pg/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/attendance/page.tsx`
- `frontend/src/app/expenses/page.tsx`
- `frontend/src/app/history/page.tsx`
- `frontend/src/app/profile/page.tsx`

## Running Locally

### 1. Start Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:4000
```

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. Environment Setup

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
PORT=4000
NODE_ENV=development
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NODE_ENV=development
```

## Deployment on Vercel

### Step 1: Deploy Backend
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create new project
3. Set **Root Directory**: `backend`
4. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<generate-64-char-secret>
   JWT_EXPIRES_IN=24h
   FRONTEND_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
5. Deploy and copy backend URL (e.g., `https://pgmaster-backend.vercel.app`)

### Step 2: Deploy Frontend
1. Create another new project
2. Set **Root Directory**: `frontend`
3. Add environment variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://pgmaster-backend.vercel.app
   NODE_ENV=production
   ```
4. Deploy and copy frontend URL

### Step 3: Update Backend CORS
1. Go back to **backend project** in Vercel
2. Update `FRONTEND_URL` environment variable with your actual frontend URL
3. Redeploy backend

## API Client Usage

The new API client is located at `frontend/src/lib/api-client.ts`:

```typescript
import apiClient from '@/lib/api-client';

// GET request
const response = await apiClient.get('/api/auth/profile');

// POST request
await apiClient.post('/api/auth/login', { uniqueKey: 'PG-XXX' });

// PATCH request
await apiClient.patch('/api/expenses', { expenseId, status: 'APPROVED' });

// DELETE request
await apiClient.delete(`/api/expenses/${id}`);
```

### Key Features:
- **Base URL**: Automatically uses `NEXT_PUBLIC_BACKEND_URL`
- **Credentials**: Sends cookies with every request (`withCredentials: true`)
- **CORS**: Backend configured to accept requests from frontend URL
- **Error Handling**: Global error interceptor for authentication issues

## What About Next.js API Routes?

The Next.js API routes in `frontend/src/app/api/*` are **no longer used** by the frontend. You have two options:

### Option 1: Keep Them (Recommended for now)
- Keep the files as backup
- They won't interfere with the frontend
- Useful if you want to migrate back or use them for something else

### Option 2: Delete Them
If you're sure you want to use only the Express backend:

```bash
cd frontend
rm -rf src/app/api
rm -rf src/lib/mongoose.ts
rm -rf src/lib/models
rm -rf src/lib/services
rm -rf src/lib/session.ts
```

Also remove from `.env.local` (no longer needed):
```
MONGODB_URI=...
SESSION_SECRET=...
```

## Testing the Setup

### 1. Check Backend is Running
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","time":"..."}
```

### 2. Test Frontend Connection
1. Open http://localhost:3000
2. Open browser DevTools → Network tab
3. Try logging in
4. You should see requests going to `http://localhost:4000/api/*`

### 3. Verify CORS
If you see CORS errors:
- Check `FRONTEND_URL` in backend `.env` matches your frontend URL exactly
- Restart backend after changing environment variables
- Check browser console for specific error message

## Troubleshooting

### "Cannot connect to backend"
- ✅ Backend is running on port 4000
- ✅ `NEXT_PUBLIC_BACKEND_URL` is set correctly in frontend `.env.local`
- ✅ No typos in the URL (check for trailing slashes)

### "CORS Error"
- ✅ `FRONTEND_URL` in backend matches frontend URL exactly
- ✅ Restart backend after changing `.env`
- ✅ Both frontend and backend use same protocol (http or https)

### "Authentication Failed"
- ✅ Backend `JWT_SECRET` is set
- ✅ Cookies are being sent (`withCredentials: true` in api-client)
- ✅ Check backend logs for errors

### Environment Variables Not Loading (Vercel)
- ✅ Go to Project Settings → Environment Variables
- ✅ Add/update the variables
- ✅ **Redeploy** after changing environment variables (CRITICAL!)

## Benefits of This Architecture

1. **Clear Separation**: Frontend is purely UI, backend handles all logic
2. **Easier Debugging**: API errors are in backend logs, UI issues in frontend
3. **Better Scalability**: Can scale frontend and backend independently
4. **Vercel Deployment**: Each service deployed separately, easier to manage
5. **Reusable API**: Backend can be used by mobile apps, other frontends, etc.
6. **Type Safety**: Can generate TypeScript types from backend API schema
7. **Testing**: Can test backend API independently from frontend

## Next Steps

1. ✅ Start both backend and frontend locally
2. ✅ Test login and all features work
3. ✅ Deploy backend to Vercel
4. ✅ Deploy frontend to Vercel
5. ✅ Update CORS settings
6. ⏳ (Optional) Delete unused Next.js API routes
7. ⏳ (Optional) Add API documentation (Swagger/OpenAPI)
8. ⏳ (Optional) Add request logging/monitoring

---

**Need Help?** Check the deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)
