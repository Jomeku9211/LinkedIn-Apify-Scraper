const axios = require('axios');

// Configuration
const PROFILE_SCRAPER_ACTOR = 'curious_coder~linkedin-post-search-scraper';
const MAX_RETRIES = 2;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Run Apify LinkedIn profile scraper with direct dataset items return
 */
async function runProfileScraper(input, apiToken, retryCount = 0) {
  try {
    console.log(`🔄 Running profile scraper (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
    
    const response = await axios.post(
      `https://api.apify.com/v2/acts/${PROFILE_SCRAPER_ACTOR}/run-sync-get-dataset-items`,
      input,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        params: {
          token: apiToken
        },
        timeout: 300000 // 5 minutes timeout
      }
    );
    
    if (!response.data || response.data.length === 0) {
      throw new Error('No data returned from profile scraper');
    }
    
    console.log(`✅ Profile scraper completed. Retrieved ${response.data.length} items`);
    return response.data[0]; // Return first item directly
    
  } catch (error) {
    console.error(`❌ Error running profile scraper:`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return runProfileScraper(input, apiToken, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Scrape LinkedIn profile data
 */
async function scrapeProfile(profileUrl, linkedinCookies, apifyToken, contactCompassToken) {
  // Construct input exactly as the actor expects it
  const input = {
    "cookie": linkedinCookies, // Array of detailed cookie objects
    "findContacts": true,
    "findContacts.contactCompassToken": contactCompassToken,
    "maxDelay": 60,
    "minDelay": 15,
    "proxy": {
      "useApifyProxy": true,
      "apifyProxyCountry": "US"
    },
    "scrapeCompany": false, // Only scrape profile, not company
    "urls": [profileUrl]
  };
  
  console.log('🔧 Profile scraper input constructed with:');
  console.log('- URLs:', input.urls);
  console.log('- LinkedIn cookies:', input.cookie.length, 'cookies provided');
  console.log('- Find contacts:', input.findContacts);
  console.log('- Contact compass token:', contactCompassToken ? 'provided' : 'missing');
  console.log('- Scrape company:', input.scrapeCompany);
  console.log('- Proxy config:', input.proxy);
  
  return await runProfileScraper(input, apifyToken);
}

module.exports = {
  runProfileScraper,
  scrapeProfile
};
