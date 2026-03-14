# Quick Start Guide - PG Master

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Two terminal windows

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd pgmaster

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

#### Backend Configuration
Create `backend/.env`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/pg-meal-tracker
JWT_SECRET=run_node_command_to_generate_64_char_secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
PORT=4000
NODE_ENV=development
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Frontend Configuration
Create `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NODE_ENV=development
```

### Step 3: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:4000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:3000

### Step 4: Test the Application

1. Open http://localhost:3000 in your browser
2. Click "Set up a new PG"
3. Fill in the form to create your first PG
4. You'll get a unique key - save it!
5. Login with the key and start using the app

---

## 🌐 Production Deployment (Vercel)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Deploy backend and frontend as **separate projects**.

### Option 2: Manual Deploy

See detailed guide: [DEPLOYMENT.md](DEPLOYMENT.md)

**Quick Summary:**

1. **Deploy Backend:**
   - Root Directory: `backend`
   - Add environment variables (MONGODB_URI, JWT_SECRET, etc.)
   - Copy deployed backend URL

2. **Deploy Frontend:**
   - Root Directory: `frontend`
   - Add `NEXT_PUBLIC_BACKEND_URL` with backend URL
   - Copy deployed frontend URL

3. **Update Backend CORS:**
   - Set `FRONTEND_URL` to frontend URL
   - Redeploy backend

---

## 📂 Project Structure

```
pgmaster/
├── backend/              # Express.js REST API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── models/      # MongoDB schemas
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth middleware
│   │   └── lib/         # DB, JWT utilities
│   ├── .env             # Backend config (create this)
│   └── package.json
│
├── frontend/             # Next.js React App
│   ├── src/
│   │   ├── app/         # Pages & routing
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks (auth)
│   │   └── lib/         # API client, utilities
│   ├── .env.local       # Frontend config (create this)
│   └── package.json
│
├── ARCHITECTURE.md       # Architecture overview
├── DEPLOYMENT.md         # Vercel deployment guide
└── README.md            # This file
```

---

## 🔧 Available Scripts

### Backend
```bash
npm run dev      # Start development server with auto-reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production build
```

### Frontend
```bash
npm run dev      # Start Next.js development server
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run ESLint
```

---

## 🏗️ Architecture

```
┌──────────────┐        HTTP/HTTPS         ┌──────────────┐
│   Frontend   │ ───────────────────────▶  │   Backend    │
│  (Next.js)   │  API Requests w/ Cookies  │  (Express)   │
│              │ ◀───────────────────────  │              │
│   Port 3000  │        JSON Response      │   Port 4000  │
└──────────────┘                           └──────┬───────┘
                                                   │
                                                   │
                                                   ▼
                                           ┌──────────────┐
                                           │   MongoDB    │
                                           │    Atlas     │
                                           └──────────────┘
```

**Key Points:**
- Frontend is **pure UI** - no database access
- Backend handles **all data operations**
- Communication via **HTTP REST API**
- Authentication uses **httpOnly cookies**
- CORS configured for **security**

---

## 🔑 Environment Variables Reference

### Required for Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens (64+ chars) | Generate with node command |
| `JWT_EXPIRES_IN` | Token expiration time | `24h`, `7d`, `30d` |
| `FRONTEND_URL` | Frontend origin (exact match) | `http://localhost:3000` |
| `PORT` | Backend server port | `4000` |
| `NODE_ENV` | Node environment | `development` or `production` |

### Required for Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:4000` |
| `NODE_ENV` | Node environment | `development` or `production` |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 4000 is already in use
lsof -i :4000

# Kill process using port 4000 (if needed)
kill -9 <PID>
```

### Frontend can't connect to backend
1. ✅ Backend is running on port 4000
2. ✅ `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000` in `.env.local`
3. ✅ No typos in environment variable name
4. ✅ Restart frontend after changing `.env.local`

### CORS errors in browser
1. ✅ `FRONTEND_URL=http://localhost:3000` in backend `.env`
2. ✅ No trailing slash in URL
3. ✅ Restart backend after changing `.env`

### MongoDB connection failed
1. ✅ Check `MONGODB_URI` is correct
2. ✅ MongoDB Atlas: Allow access from anywhere (0.0.0.0/0)
3. ✅ Database user has read/write permissions
4. ✅ Check network connectivity

### Environment variables not loading
- **Frontend**: Must start with `NEXT_PUBLIC_` to be accessible
- **Backend**: Don't need prefix
- **Both**: Restart server after changing `.env` files

---

## 📚 Additional Resources

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture explanation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Vercel deployment guide
- [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) - Quick env reference for Vercel

---

## 🆘 Need Help?

1. Check if both servers are running
2. Check environment variables are set correctly
3. Check browser console for errors
4. Check backend terminal for error logs
5. Review architecture documentation

---

**Ready to start?** Run the servers and open http://localhost:3000 🎉
