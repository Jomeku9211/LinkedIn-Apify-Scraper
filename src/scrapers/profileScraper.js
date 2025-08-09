const axios = require('axios');

// Configuration
const PROFILE_SCRAPER_ACTOR = 'curious_coder~linkedin-profile-scraper';
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
    
    // Log detailed error information
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return runProfileScraper(input, apiToken, retryCount + 1);
    }
    
    // Create enhanced error object with Apify response details
    const enhancedError = {
      message: error.message,
      status: error.response?.status,
      apifyError: error.response?.data?.error || null
    };
    
    throw enhancedError;
  }
}

/**
 * Extract company URL from LinkedIn profile data
 */
function extractCompanyUrl(profileData) {
  // Look for company URL in various possible fields
  if (profileData.experiences && profileData.experiences.length > 0) {
    const currentJob = profileData.experiences[0];
    if (currentJob.companyUrl) {
      return currentJob.companyUrl;
    }
    if (currentJob.company) {
      // Try to construct LinkedIn company URL from company name
      const companySlug = currentJob.company.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return `https://www.linkedin.com/company/${companySlug}`;
    }
  }
  
  return null;
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
    "scrapeCompany": true,
    "urls": [profileUrl]  // Use simple URL array format as required by actor
  };
  
  console.log('🔧 Profile scraper input constructed with:');
  console.log('- URLs:', input.urls);
  console.log('- LinkedIn cookies:', input.cookie.length, 'cookies provided');
  console.log('- Find contacts:', input.findContacts);
  console.log('- Contact compass token:', contactCompassToken ? 'provided' : 'missing');
  console.log('- Scrape company:', input.scrapeCompany);
  console.log('- Proxy config:', input.proxy);
  
  // Log the full input for debugging
  console.log('🔍 Full input payload:', JSON.stringify(input, null, 2));
  
  return await runProfileScraper(input, apifyToken);
}

module.exports = {
  runProfileScraper,
  extractCompanyUrl,
  scrapeProfile
};
