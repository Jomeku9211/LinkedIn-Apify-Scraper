const axios = require('axios');

/**
 * Trigger webhook with error details
 * Ensures Make.com variable {{1.apifyErrorMessage}} is always populated via query param "apifyErrorMessage".
 */
async function triggerWebhook(errorDetails, webhookUrl) {
  try {
    console.log('🚨 Triggering error webhook...');

    // Extract the primary message consistently for Make.com
    const apifyErrorMessage = (
      errorDetails.apifyErrorMessage ||
      errorDetails.error ||
      errorDetails.message ||
      (errorDetails.apifyError && (errorDetails.apifyError.message || errorDetails.apifyError.type)) ||
      'Unknown error'
    ).toString();

    // Optionally append context for visibility (phase/runId) in the same param (short)
    const contextBits = [];
    if (errorDetails.phase) contextBits.push(`phase:${errorDetails.phase}`);
    if (errorDetails.runId) contextBits.push(`run:${errorDetails.runId}`);
    if (errorDetails.recordId) contextBits.push(`rec:${errorDetails.recordId}`);
    const contextSuffix = contextBits.length ? ` [${contextBits.join(' ')}]` : '';
    const finalMessage = (apifyErrorMessage + contextSuffix).slice(0, 900);

    // Add query parameter to webhook URL
    const separator = webhookUrl.includes('?') ? '&' : '?';
    const webhookUrlWithParams = `${webhookUrl}${separator}apifyErrorMessage=${encodeURIComponent(finalMessage)}`;
    
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
