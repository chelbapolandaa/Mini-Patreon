// check-models.js
const db = require('./src/models');

console.log('=== CHECKING MODELS ===\n');

console.log('Available models:');
Object.keys(db).forEach(key => {
  if (key !== 'sequelize' && key !== 'Sequelize') {
    console.log(`  - ${key}`);
  }
});

console.log('\n=== CHECKING ASSOCIATIONS ===\n');

// Cek associations User
if (db.User && db.User.associate) {
  console.log('✅ User model has associate function');
} else {
  console.log('❌ User model missing associate function');
}

// Cek associations Subscription
if (db.Subscription && db.Subscription.associate) {
  console.log('✅ Subscription model has associate function');
} else {
  console.log('❌ Subscription model missing associate function');
}

// Test query
(async () => {
  try {
    console.log('\n=== TESTING DATABASE QUERY ===\n');
    
    const user = await db.User.findOne({
      attributes: ['id', 'name', 'email', 'role']
    });
    
    if (user) {
      console.log('✅ Database query successful');
      console.log('Sample user:', user.toJSON());
    } else {
      console.log('ℹ️ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Database query failed:', error.message);
  }
})();