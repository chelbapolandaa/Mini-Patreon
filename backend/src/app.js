'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const creatorRoutes = require('./routes/creatorRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const midtransRoutes = require('./routes/midtransRoutes');
const searchRoutes = require('./routes/searchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const videoRoutes = require('./routes/videoRoutes');
const creatorPublicRoutes = require('./routes/creatorPublicRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// CORS Configuration untuk API
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (untuk images, PDF, dll)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Video streaming melalui API route (dengan CORS yang benar)
app.use('/api/videos', videoRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Creator Platform API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/creators', creatorPublicRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/midtrans', midtransRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;