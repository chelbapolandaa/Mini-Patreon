// Buat test file: backend/test-midtrans.js
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const parameter = {
  transaction_details: {
    order_id: "TEST-" + Date.now(),
    gross_amount: 10000,
  },
};

snap.createTransaction(parameter)
  .then(transaction => {
    console.log('✅ Success:', transaction);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  });