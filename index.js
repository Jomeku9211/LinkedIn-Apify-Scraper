require('dotenv').config();

const profileScraper = require('./scrapers/profileScraper');
const airtableService = require('./services/airtableService');
const webhookService = require('./services/webhookService');
const googleSheetsService = require('./services/googleSheetsService');

// Configuration Constants
const GOOGLE_SPREADSHEET_URL = process.env.GOOGLE_SPREADSHEET_URL || 'https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/export?format=csv';
const APIFY_PROFILE_TOKEN = process.env.APIFY_PROFILE_TOKEN;
const APIFY_COOKIES_JSON = JSON.parse(process.env.APIFY_COOKIES_JSON || '[]');
const CONTACT_COMPASS_TOKEN = process.env.CONTACT_COMPASS_TOKEN;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://hook.us2.make.com/qqvwiwch83ekvgtzmu3zyco5py2mdyjn';

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
    // Scrape LinkedIn profile
    const profileData = await profileScraper.scrapeProfile(
      profileUrl, 
      APIFY_COOKIES_JSON, 
      APIFY_PROFILE_TOKEN,
      CONTACT_COMPASS_TOKEN
    );
    
    // Insert profile data into Airtable
    await airtableService.insertRecord(
      profileData,
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
    if (!CONTACT_COMPASS_TOKEN || CONTACT_COMPASS_TOKEN === 'your_contact_compass_token_here') {
      throw new Error('Please configure CONTACT_COMPASS_TOKEN');
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
