const axios = require('axios');

/**
 * Trigger webhook with error details
 */
async function triggerWebhook(errorDetails, webhookUrl) {
  try {
    console.log('🚨 Triggering error webhook...');
    
    // Extract the apify error message
    const apifyErrorMessage = errorDetails.apifyErrorMessage || errorDetails.error || 'Unknown error';
    
    // Add query parameter to webhook URL
    const separator = webhookUrl.includes('?') ? '&' : '?';
    const webhookUrlWithParams = `${webhookUrl}${separator}apifyErrorMessage=${encodeURIComponent(apifyErrorMessage)}`;
    
    console.log('📤 Webhook URL with params:', webhookUrlWithParams);
    
    await axios.post(webhookUrlWithParams, {}, {
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
