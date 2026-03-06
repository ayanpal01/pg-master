import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/db';

// Routes
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import expenseRoutes from './routes/expenses';
import paymentRoutes from './routes/payments';
import pgRoutes from './routes/pg';
import statsRoutes from './routes/stats';
import setupRoutes from './routes/setup';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

// ─── CORS — must match the frontend origin exactly ─────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,                   // Required for httpOnly cookie exchange
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pg', pgRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/setup', setupRoutes);   // public — no auth required

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 PG Master API running on http://localhost:${PORT}`);
      console.log(`   CORS allowed for: ${FRONTEND_URL}`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();
