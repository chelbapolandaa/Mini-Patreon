const cron = require('node-cron');
const { Subscription } = require('../models');

const expireSubscriptions = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🔄 Running subscription expiration check...');
    
    const now = new Date();
    const expiredSubscriptions = await Subscription.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          endDate: { [Op.lt]: now }
        }
      }
    );
    
    if (expiredSubscriptions[0] > 0) {
      console.log(`✅ Expired ${expiredSubscriptions[0]} subscriptions`);
    }
  } catch (error) {
    console.error('❌ Error expiring subscriptions:', error);
  }
});

module.exports = {
  start: () => {
    expireSubscriptions.start();
    console.log('✅ Cron jobs started');
  },
  stop: () => {
    expireSubscriptions.stop();
    console.log('🛑 Cron jobs stopped');
  }
};