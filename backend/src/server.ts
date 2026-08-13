import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import connectDB from './config/db';
import logger from './utils/logger';
import errorHandler from './middlewares/error.middleware';
import { initSocket } from './sockets/socket.handler';

import authRoutes from './routes/auth.routes';
import athleteRoutes from './routes/athlete.routes';
import performanceRoutes from './routes/performance.routes';
import paymentRoutes from './routes/payment.routes';
import userRoutes from './routes/user.routes';
import eventRoutes from './routes/event.routes';

const app = express();
const httpServer = http.createServer(app);

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB().catch((err) => {
  logger.error(`DB connection failed: ${err.message}`);
  process.exit(1);
});

// ─── Init Socket.io ───────────────────────────────────────────────────────────
initSocket(httpServer);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', rateLimit({ windowMs: 10 * 60 * 1000, max: 200 }));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API running', timestamp: new Date() });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000');
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  httpServer.close(() => process.exit(1));
});
