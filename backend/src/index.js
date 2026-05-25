import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import { initializeDatabase } from './db/init.js';
import { seedDatabase } from './db/seed.js';

// Import routes
import authRoutes from './api/routes/auth.js';
import userRoutes from './api/routes/users.js';
import eventRoutes from './api/routes/events.js';
import applicationRoutes from './api/routes/applications.js';
import messageRoutes from './api/routes/messages.js';
import nearbyRoutes from './api/routes/nearby.js';
import safetyRoutes from './api/routes/safety.js';
import notificationRoutes from './api/routes/notifications.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/nearby', nearbyRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    console.log('📚 Initializing database...');
    await initializeDatabase();
    
    if (process.env.MOCK_DATA === 'true') {
      console.log('🌱 Seeding database with mock data...');
      await seedDatabase();
    }
    
    app.listen(PORT, () => {
      console.log(`
✅ Junto Backend Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 http://localhost:${PORT}
📚 API: http://localhost:${PORT}/api
❤️  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
