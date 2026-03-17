import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/user';
import levelRoutes from './routes/levels';
import progressRoutes from './routes/progress';
import leaderboardRoutes from './routes/leaderboard';

dotenv.config();

const app = express();

// Use require for connect-sqlite3 to avoid TypeScript issues
const SQLiteStore = require('connect-sqlite3')(session);

// Allow multiple origins for development and production
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './prisma'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true, // Create session for all visitors
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for anonymous users
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
