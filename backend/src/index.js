import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initializeDatabase } from './db/init.js';
import { seedDatabase } from './db/seed.js';
import { initWebSocket } from './websocket.js';
import { startExpiryCleanupScheduler } from './utils/expiryCleanup.js';
import { initializeReminderScheduler } from './services/eventReminderScheduler.js';
import { initializeFollowupScheduler } from './services/followupScheduler.js';
import { initializeEmailTransporter, testEmailConnection } from './services/otpService.js';
import db from './db/connection.js';

// Import routes
import authRoutes from './api/routes/auth.js';
import userRoutes from './api/routes/users.js';
import eventRoutes from './api/routes/events.js';
import applicationRoutes from './api/routes/applications.js';
import messageRoutes from './api/routes/messages.js';
import nearbyRoutes from './api/routes/nearby.js';
import safetyRoutes from './api/routes/safety.js';
import notificationRoutes from './api/routes/notifications.js';
import subscriptionRoutes from './api/routes/subscriptions.js';
import searchRoutes from './api/routes/search.js';
import reportRoutes from './api/routes/reports.js';
import ratingRoutes from './api/routes/ratings.js';
import inviteRoutes from './api/routes/invites.js';
import verificationRoutes from './api/routes/verification.js';
import squadsRoutes from './api/routes/squads.js';
import checkInsRoutes from './api/routes/checkIns.js';
import notificationPreferencesRoutes from './api/routes/notificationPreferences.js';
import fraudDetectionRoutes from './api/routes/fraudDetection.js';
import followupRoutes from './api/routes/followup.js';
import otpRoutes from './api/routes/otp.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Middleware - MUST be first
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Attach the shared database connection to every request so controllers can
// read/write OTPs and other records without importing the singleton directly.
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', otpRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/nearby', nearbyRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/squads', squadsRoutes);
app.use('/api/check-ins', checkInsRoutes);
app.use('/api/notification-preferences', notificationPreferencesRoutes);
app.use('/api/fraud', fraudDetectionRoutes);
app.use('/api/followups', followupRoutes);

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
    global.db = db; // Assign db to global for scheduler access
    
    // Initialize email transporter for OTP
    console.log('📧 Initializing email transporter...');
    const emailTransporter = initializeEmailTransporter();
    if (emailTransporter) {
      const emailStatus = await testEmailConnection();
      if (!emailStatus.success) {
        console.warn('⚠️  OTP email delivery is not ready:', emailStatus.error);
        console.warn('   Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and GMAIL_SENDER_EMAIL on Railway.');
      }
    } else {
      console.warn('⚠️  OTP email transport is disabled until Gmail API or SMTP env vars are configured.');
    }
    
    if (process.env.MOCK_DATA === 'true') {
      console.log('🌱 Seeding database with mock data...');
      await seedDatabase();
    }
    
    // Start event expiry cleanup scheduler
    startExpiryCleanupScheduler();
    
    // Start event reminder scheduler
    setTimeout(() => {
      global.db.run('SELECT 1', (err) => {
        if (!err) {
          initializeReminderScheduler(global.db);
          initializeFollowupScheduler(global.db);
        }
      });
    }, 2000);
    
    // Create HTTP server for both Express and WebSocket
    const server = http.createServer(app);
    
    // Initialize WebSocket
    initWebSocket(server);
    
    server.listen(PORT, () => {
      console.log(`
✅ Junto Backend Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 http://localhost:${PORT}
📚 API: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}
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
