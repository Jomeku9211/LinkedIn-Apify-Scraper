require('dotenv').config();
const axios = require('axios');

async function debugApifyAPI() {
  const APIFY_PROFILE_TOKEN = process.env.APIFY_PROFILE_TOKEN;
  const PROFILE_SCRAPER_ACTOR = 'curious_coder~linkedin-post-search-scraper';
  
  console.log('🔍 Debugging Apify API...');
  console.log('Token:', APIFY_PROFILE_TOKEN ? 'provided' : 'missing');
  console.log('Actor:', PROFILE_SCRAPER_ACTOR);
  
  try {
    // Test 1: Check if actor exists
    console.log('\n📋 Step 1: Testing actor info...');
    const actorInfoResponse = await axios.get(
      `https://api.apify.com/v2/acts/${PROFILE_SCRAPER_ACTOR}`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_PROFILE_TOKEN}`
        }
      }
    );
    console.log('✅ Actor exists and accessible');
    console.log('Actor name:', actorInfoResponse.data.data.name);
    
    // Test 2: Check actor input schema
    console.log('\n📋 Step 2: Testing actor input schema...');
    const inputSchemaResponse = await axios.get(
      `https://api.apify.com/v2/acts/${PROFILE_SCRAPER_ACTOR}/input-schema`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_PROFILE_TOKEN}`
        }
      }
    );
    console.log('✅ Input schema accessible');
    
    // Test 3: Try a minimal run
    console.log('\n📋 Step 3: Testing minimal actor run...');
    const minimalInput = {
      "urls": ["https://www.linkedin.com/in/dheeraj-khandare/"]
    };
    
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${PROFILE_SCRAPER_ACTOR}/run-sync-get-dataset-items`,
      minimalInput,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_PROFILE_TOKEN}`
        },
        timeout: 60000 // 1 minute timeout for testing
      }
    );
    
    console.log('✅ Minimal run successful');
    console.log('Response data length:', runResponse.data.length);
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugApifyAPI();
