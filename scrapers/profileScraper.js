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
async function scrapeProfile(profileUrl, cookies, apiToken) {
  const input = {
    urls: [profileUrl],
    cookies: cookies
  };
  
  return await runProfileScraper(input, apiToken);
}

module.exports = {
  runProfileScraper,
  extractCompanyUrl,
  scrapeProfile
};
