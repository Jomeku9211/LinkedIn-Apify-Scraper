const axios = require('axios');

// Configuration
const COMPANY_SCRAPER_ACTOR = 'curious_coder~linkedin-company-scraper';
const MAX_RETRIES = 2;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Run Apify LinkedIn company scraper with direct dataset items return
 */
async function runCompanyScraper(input, apiToken, retryCount = 0) {
  try {
    console.log(`🔄 Running company scraper (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
    
    const response = await axios.post(
      `https://api.apify.com/v2/acts/${COMPANY_SCRAPER_ACTOR}/run-sync-get-dataset-items`,
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
      throw new Error('No data returned from company scraper');
    }
    
    console.log(`✅ Company scraper completed. Retrieved ${response.data.length} items`);
    return response.data[0]; // Return first item directly
    
  } catch (error) {
    console.error(`❌ Error running company scraper:`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return runCompanyScraper(input, apiToken, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Scrape LinkedIn company data
 */
async function scrapeCompany(companyUrl, cookies, apiToken) {
  const input = {
    urls: [companyUrl],
    cookies: cookies
  };
  
  return await runCompanyScraper(input, apiToken);
}

module.exports = {
  runCompanyScraper,
  scrapeCompany
};
