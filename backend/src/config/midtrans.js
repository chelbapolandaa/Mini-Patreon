// backend/config/midtrans.js
const midtransClient = require('midtrans-client');

console.log('=== Midtrans Configuration ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Server Key exists:', !!process.env.MIDTRANS_SERVER_KEY);
console.log('Client Key exists:', !!process.env.MIDTRANS_CLIENT_KEY);

let snap;

if (process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY) {
  try {
    snap = new midtransClient.Snap({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
    
    console.log('✅ Midtrans initialized in', process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX', 'mode');
  } catch (error) {
    console.error('❌ Failed to initialize Midtrans:', error.message);
    snap = createMockSnap();
  }
} else {
  console.warn('⚠️ Midtrans credentials missing. Using mock mode.');
  snap = createMockSnap();
}

// Mock implementation
function createMockSnap() {
  return {
    createTransaction: (parameter) => {
      console.log('🔧 Mock Midtrans - Creating transaction for:', parameter.transaction_details.order_id);
      console.log('Amount:', parameter.transaction_details.gross_amount);
      
      return Promise.resolve({
        token: `mock-token-${Date.now()}`,
        redirect_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/mock?order_id=${parameter.transaction_details.order_id}&amount=${parameter.transaction_details.gross_amount}`,
      });
    },
    
    transaction: {
      status: (orderId) => {
        console.log('🔧 Mock Midtrans - Checking status for', orderId);
        return Promise.resolve({
          transaction_status: 'settlement',
          order_id: orderId,
          gross_amount: '50000',
        });
      }
    }
  };
}

module.exports = snap;