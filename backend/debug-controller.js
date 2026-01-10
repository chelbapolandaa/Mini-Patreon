// Buat file debug di backend/
const controller = require('./src/controllers/subscriptionController');

console.log('=== DEBUG SUBSCRIPTION CONTROLLER ===\n');

console.log('1. Type of controller:', typeof controller);
console.log('2. Is object?', typeof controller === 'object');
console.log('3. Keys available:', Object.keys(controller));

console.log('\n4. Checking each function:');
const functionsToCheck = [
  'getAllCreators',
  'getCreatorProfile',
  'getCreatorPlans', 
  'initializeSubscription',
  'checkPaymentStatus',
  'subscribeToCreator',
  'getMySubscriptions',
  'cancelSubscription'
];

functionsToCheck.forEach(funcName => {
  const func = controller[funcName];
  console.log(`  ${funcName}:`, {
    exists: func !== undefined,
    type: typeof func,
    isFunction: typeof func === 'function'
  });
});

// Cek require path
console.log('\n5. Controller file path:');
console.log(require.resolve('./src/controllers/subscriptionController'));