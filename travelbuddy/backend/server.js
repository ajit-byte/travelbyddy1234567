import './config/env.js'; 
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import passport from './config/passport.js';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import itineraryRoutes from './routes/itineraries.js';
import chatRoutes from './routes/chat.js';
import socialRoutes from './routes/social.js';
import adminRoutes from './routes/admin.js';
import otpRoutes from './routes/otp.js';
import verificationRoutes from './routes/verification.js';
import matchingRoutes from './routes/matching.js';
import reviewRoutes from './routes/reviews.js';
import { startMatchingScheduler } from './services/matchingScheduler.js';

connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Socket.io auth middleware ──────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user.id;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

// Track online users: userId → socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.userId;
  onlineUsers.set(userId, socket.id);

  // Broadcast online status to all
  io.emit('user:online', { userId });

  // Join personal room for direct delivery
  socket.join(userId);

  // ── Thread Rooms ──────────────────────────────────────────────────────
  socket.on('thread:join', ({ threadId }) => {
    socket.join(threadId);
  });

  // ── Typing indicator ──────────────────────────────────────────────────
  socket.on('typing:start', ({ threadId, toUserId }) => {
    if (threadId) {
      socket.to(threadId).emit('typing:start', { threadId, fromUserId: userId });
    } else {
      socket.to(toUserId).emit('typing:start', { threadId, fromUserId: userId });
    }
  });
  socket.on('typing:stop', ({ threadId, toUserId }) => {
    if (threadId) {
      socket.to(threadId).emit('typing:stop', { threadId, fromUserId: userId });
    } else {
      socket.to(toUserId).emit('typing:stop', { threadId, fromUserId: userId });
    }
  });

  // ── Message delivered ack ─────────────────────────────────────────────
  socket.on('message:delivered', ({ messageId, threadId, toUserId }) => {
    socket.to(toUserId).emit('message:delivered', { messageId, threadId });
  });

  // ── Message read ack ──────────────────────────────────────────────────
  socket.on('message:read', ({ messageId, threadId, toUserId }) => {
    socket.to(toUserId).emit('message:read', { messageId, threadId });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    io.emit('user:offline', { userId, lastSeen: new Date() });
  });
});

// Expose io to routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth/', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startMatchingScheduler();
});
