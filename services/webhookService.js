const axios = require('axios');

/**
 * Trigger webhook with error details
 */
async function triggerWebhook(errorDetails, webhookUrl) {
  try {
    console.log('🚨 Triggering error webhook...');
    
    await axios.post(webhookUrl, {
      timestamp: new Date().toISOString(),
      error: errorDetails,
      source: 'linkedin-scraper'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook triggered successfully');
    
  } catch (error) {
    console.error('❌ Error triggering webhook:', error.message);
  }
}

module.exports = {
  triggerWebhook
};
