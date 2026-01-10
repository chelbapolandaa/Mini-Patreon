const app = require('./src/app');
const http = require('http');

// Hanya require database config untuk test connection
const { sequelize } = require('./src/config/database');

require('dotenv').config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    
    // Load models untuk setup associations (jika belum)
    const db = require('./src/models');
    
    // Sync database
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false }
      : { alter: true };
    
    return sequelize.sync(syncOptions);
  })
  .then(() => {
    console.log('✅ Database tables synced');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`💳 Midtrans: ${process.env.MIDTRANS_SERVER_KEY ? 'Configured' : 'Not Configured'}`);
    });
  })
  .catch(err => {
    console.error('❌ Server startup failed:', err.message);
    console.error('Error stack:', err.stack);
    process.exit(1);
  });