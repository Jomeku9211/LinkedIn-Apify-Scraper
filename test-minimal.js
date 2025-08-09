require('dotenv').config();
const axios = require('axios');

async function testMinimalApify() {
  const APIFY_PROFILE_TOKEN = process.env.APIFY_PROFILE_TOKEN;
  const PROFILE_SCRAPER_ACTOR = 'curious_coder~linkedin-post-search-scraper';
  
  console.log('🔍 Testing minimal Apify call...');
  
  // Test with the EXACT format from API reference
  const minimalInput = {
    "urls": ["https://www.linkedin.com/in/dheeraj-khandare/"]
  };
  
  try {
    console.log('📤 Sending minimal input:', JSON.stringify(minimalInput, null, 2));
    
    const response = await axios.post(
      `https://api.apify.com/v2/acts/${PROFILE_SCRAPER_ACTOR}/run-sync-get-dataset-items`,
      minimalInput,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${APIFY_PROFILE_TOKEN}`
        },
        timeout: 60000 // 1 minute timeout
      }
    );
    
    console.log('✅ Success! Response:', response.status);
    console.log('Data length:', response.data.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status text:', error.response.statusText);
      console.error('Response data:', error.response.data);
    }
  }
}

testMinimalApify();
