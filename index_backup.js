const profileScraper = require('./scrapers/profileScraper');
const companyScraper = require('./scrapers/companyScraper');
const airtableService = require('./services/airtableService');
const webhookService = require('./services/webhookService');
const googleSheetsService = require('./services/googleSheetsService');

// Load environment variables
require('dotenv').config();

// Configuration Constants
const GOOGLE_SPREADSHEET_URL = process.env.GOOGLE_SPREADSHEET_URL || 'https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/export?format=csv';
const APIFY_PROFILE_TOKEN = process.env.APIFY_PROFILE_TOKEN;
const APIFY_COMPANY_TOKEN = process.env.APIFY_COMPANY_TOKEN;
const APIFY_COOKIES_JSON = JSON.parse(process.env.APIFY_COOKIES_JSON || '{}');
  "lms_analytics": "AQGFxhEwXGAFkwAAAZh-xpxoCwyDf0PdPA6BtNwJoRLiO3sIXU30iQuB7nSXx1XzYxI_uf16SLhm4JTFDbUSNz_WcA8jiGtF",
  "fptctx2": "taBcrIH61PuCVH7eNCyH0J9Fjk1kZEyRnBbpUW3FKs9C8G2sl6MvRy%252fDs%252bGoQktmLsORiyDh4aZdUlgREKiNv59L%252f3kCJPN4PWEuiC%252f8WA7Z%252bqHyS%252fnNXRoCgeHPs22DfZL0eKvfzkDb%252bepBP6UBhoPTQarM6SliNsJOpkahaBNfOgDUTTbxpEsFr7h3JNNU9gB3gPk459zbrL7zXQDSaSNuhT4vjlF6GPB7RGNwJlQVmZSBjjfEiGf6ev3sVFdlkSoMsFn0t8Yo7hnEdWjIGtF7%252bW878Wst3R9UvwUMMWDLK25Lr3y%252b9gcZty7MH3BqL%252fiXDNL3ZWljFpqaeqLVnGmgLszdlruCJVpIzTMAze6kzLj%252fPMaAQdH4sR0%252ffN4IVPuDXC8JqdUoJm5XMKsVJA%253d%253d",
  "li_at": "AQEDAV1lDzsB_WJbAAABmI4dByAAAAGYsimLIE0AkX3AcU2iz0OS_y4oSNsK0O-JvRYs3E5CueAZtKj-mw8rHi360Qovd_hfrk5VMpNILtHxyYRY88VfhudnhdcUfr4duHgVwhG-3oe3usRaTjJ4eSDR",
  "lang": "v=2&lang=en-us",
  "lidc": "\"b=VB23:s=V:r=V:a=V:p=V:g=5510:u=10:x=1:i=1754730934:t=1754762346:v=2:sig=AQE_Vj88-7gXgf4GFdGZAsMkImRdsPNk\"",
  "AnalyticsSyncHistory": "AQILXelUrK_9hgAAAZh-xprxpl6NkfQMfrstQH_pm6dOAEgfhDsP4tK7Clclbs5pFejtrWC1nGNj4dWwceWPqQ",
  "bscookie": "\"v=1&20250806065325b9c088dd-1007-4620-8b83-db45ac55c38cAQFoEUGvmaeVHURh9Xx19k5TX44Xq8e2\"",
  "dfpfpt": "446017407e284e21b948c382ec6c01aa",
  "JSESSIONID": "\"ajax:1167310339012363629\"",
  "li_sugr": "dec8e1d3-c69f-448f-9c49-6740cc9a5cad",
  "li_theme": "light",
  "li_theme_set": "app",
  "liap": "true",
  "timezone": "Asia/Calcutta",
  "UserMatchHistory": "AQLqukJptDEfMgAAAZiOHSO7aM2bebW36VNHh6PiCzrROePvMXhj1J_S3gf_Gw6-vAXPQU_54BR1d13F4zHKQZ7mAnuLILMrDtHZkeVgq7BiMOaRVZh7i6ACchh4MLr1wLbxOYWyFv8fnCbnDFH7_eX81LvGr_0O7uxGuVx5prbb_UxGNMkXMpvLzH5gF8eOxzQcpf-RePBJ_J0OU4ApPihFL0d6rfaaK1Ltasy_t4KkjPIeEMoIqLGx2UslCc3c75IS4aYDD1ZQPHR_cMaxNTdd_Vwqpno4jCm_PDJz0C8hbJ5_8k7zbRut5Zqmu7YDxwxfHUvBBUI8QDIfWZVGxuh2IPOxu3vaeNo47J5st9XHu0pxyg"
};
const AIRTABLE_TOKEN = 'patFClficxpGIUnJF.be5a51a7e3fabe7337cd2cb13dc3f10234fc52d8a1f60e012eb68be7b2fcc982';
const AIRTABLE_BASE_ID = 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = 'tblyhMPmCt87ORo3t';
const WEBHOOK_URL = 'https://hook.us2.make.com/qqvwiwch83ekvgtzmu3zyco5py2mdyjn';

// Apify Actor IDs (moved to respective scraper files)
// const PROFILE_SCRAPER_ACTOR = 'curious_coder~linkedin-post-search-scraper';
// const COMPANY_SCRAPER_ACTOR = 'curious_coder~linkedin-company-scraper';

// Retry configuration (moved to respective scraper files)
// const MAX_RETRIES = 2;
// const RETRY_DELAY = 5000; // 5 seconds

/**
 * Process a single LinkedIn profile
 */
async function processProfile(profileUrl, index, total) {
  console.log(`\n🔍 Processing profile ${index + 1}/${total}: ${profileUrl}`);
  
  try {
    // Step 1: Scrape LinkedIn profile
    const profileData = await profileScraper.scrapeProfile(profileUrl, APIFY_COOKIES_JSON, APIFY_PROFILE_TOKEN);
    
    // Step 2: Extract company URL and scrape company
    const companyUrl = profileScraper.extractCompanyUrl(profileData);
    let companyData = null;
    
    if (companyUrl) {
      console.log(`🏢 Found company URL: ${companyUrl}`);
      
      try {
        companyData = await companyScraper.scrapeCompany(companyUrl, APIFY_COOKIES_JSON, APIFY_COMPANY_TOKEN);
        
      } catch (companyError) {
        console.error('❌ Error scraping company:', companyError.message);
        await webhookService.triggerWebhook({
          type: 'company_scraping_error',
          profileUrl,
          companyUrl,
          error: companyError.message,
          errorDetails: {
            message: companyError.message,
            stack: companyError.stack,
            timestamp: new Date().toISOString(),
            scraper: 'company',
            actor: 'curious_coder~linkedin-company-scraper'
          }
        }, WEBHOOK_URL);
      }
    } else {
      console.log('⚠️ No company URL found in profile');
    }
    
    // Step 3: Insert combined data into Airtable
    await airtableService.insertCombinedData(
      profileUrl, 
      profileData, 
      companyData, 
      companyUrl, 
      AIRTABLE_TOKEN, 
      AIRTABLE_BASE_ID, 
      AIRTABLE_TABLE_NAME
    );
    
    console.log(`✅ Successfully processed profile ${index + 1}/${total}`);
    
  } catch (error) {
    console.error(`❌ Error processing profile ${index + 1}/${total}:`, error.message);
    
    await webhookService.triggerWebhook({
      type: 'profile_processing_error',
      profileUrl,
      index: index + 1,
      total,
      error: error.message,
      errorDetails: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        scraper: 'profile',
        actor: 'curious_coder~linkedin-post-search-scraper'
      }
    }, WEBHOOK_URL);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting LinkedIn scraping process...');
  
  try {
    // Validate configuration
    if (!GOOGLE_SPREADSHEET_URL || GOOGLE_SPREADSHEET_URL === 'YOUR_GOOGLE_SPREADSHEET_CSV_URL') {
      throw new Error('Please configure GOOGLE_SPREADSHEET_URL');
    }
    if (!APIFY_PROFILE_TOKEN || APIFY_PROFILE_TOKEN === 'YOUR_APIFY_PROFILE_TOKEN') {
      throw new Error('Please configure APIFY_PROFILE_TOKEN');
    }
    if (!AIRTABLE_TOKEN || AIRTABLE_TOKEN === 'YOUR_AIRTABLE_TOKEN') {
      throw new Error('Please configure AIRTABLE_TOKEN');
    }
    
    // Fetch spreadsheet data
    const spreadsheetData = await googleSheetsService.fetchSpreadsheetData(GOOGLE_SPREADSHEET_URL);
    
    if (!spreadsheetData || spreadsheetData.length === 0) {
      throw new Error('No data found in spreadsheet');
    }
    
    // Find LinkedIn URL column (case insensitive)
    const linkedinColumn = googleSheetsService.findLinkedInColumn(spreadsheetData);
    
    console.log(`📋 Found LinkedIn column: "${linkedinColumn}"`);
    console.log(`🎯 Processing ${spreadsheetData.length} profiles...`);
    
    // Process each profile
    for (let i = 0; i < spreadsheetData.length; i++) {
      const row = spreadsheetData[i];
      const profileUrl = row[linkedinColumn];
      
      if (!profileUrl || !profileUrl.includes('linkedin.com')) {
        console.log(`⏭️ Skipping row ${i + 1}: Invalid LinkedIn URL`);
        continue;
      }
      
      await processProfile(profileUrl, i, spreadsheetData.length);
      
      // Add delay between requests to avoid rate limiting
      if (i < spreadsheetData.length - 1) {
        console.log('⏳ Waiting 10 seconds before next profile...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('\n🎉 LinkedIn scraping process completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    
    await webhookService.triggerWebhook({
      type: 'fatal_error',
      error: error.message,
      timestamp: new Date().toISOString(),
      errorDetails: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        source: 'main_execution'
      }
    }, WEBHOOK_URL);
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  processProfile,
  main
};
