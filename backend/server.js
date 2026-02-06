// JobInt Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const logger = require('./utils/logger');

// Database and Redis
const { pool } = require('../config/database');
const { redisClient } = require('./config/redis');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const interviewRoutes = require('./routes/interviews');
const calendarRoutes = require('./routes/calendar');
const blockchainRoutes = require('./routes/blockchain');
const notificationRoutes = require('./routes/notifications');

// Cron jobs
const dailyJobScrape = require('./jobs/dailyJobScrape');
const interviewReminders = require('./jobs/interviewReminders');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');
    
    // Check Redis
    await redisClient.ping();
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Initialize database connection
async function initializeDatabase() {
  try {
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Initialize Redis
async function initializeRedis() {
  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info('✅ Redis connected');
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
}

// Setup cron jobs
function setupCronJobs() {
  // Daily job scraping at 6:00 AM
  cron.schedule('0 6 * * *', () => {
    logger.info('Running daily job scrape...');
    dailyJobScrape();
  });

  // Interview reminders every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Checking for interview reminders...');
    interviewReminders();
  });

  logger.info('✅ Cron jobs scheduled');
}

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    await initializeRedis();
    setupCronJobs();

    app.listen(PORT, () => {
      logger.info(` Server running on port ${PORT}`);
      logger.info(` Environment: ${process.env.NODE_ENV}`);
      logger.info(` Client URL: ${process.env.CLIENT_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  await pool.end();
  await redisClient.quit();
  
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;