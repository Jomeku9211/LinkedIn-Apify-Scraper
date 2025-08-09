require('dotenv').config();

const profileScraper = require('./scrapers/profileScraper');
const airtableService = require('./services/airtableService');
const webhookService = require('./services/webhookService');
const googleSheetsService = require('./services/googleSheetsService');
const { mapApifyResponseToAirtable, validateAirtableData } = require('./utils/apifyDataMapper');

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
    
    // Use detailed mapping function to map profile data to Airtable fields
    console.log('🗺️ Mapping Apify LinkedIn response to Airtable format...');
    let airtableData;
    try {
      airtableData = mapApifyResponseToAirtable(profileData, profileUrl);
      console.log('✅ Mapping completed successfully');
    } catch (mappingError) {
      console.error('❌ Error during mapping:', mappingError.message);
      throw mappingError;
    }
    
    // Validate the mapped data before sending to Airtable
    const isValid = validateAirtableData(airtableData, ['firstName', 'lastName', 'linkedinUrl']);
    
    if (!isValid) {
      throw new Error('Profile data validation failed - missing required fields');
    }

    console.log('📝 Sample mapped data (first 5 fields):');
    const sampleData = Object.entries(airtableData).slice(0, 5);
    sampleData.forEach(([key, value]) => {
      console.log(`   ${key}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
    });

    // Insert profile data into Airtable
    try {
      console.log('📤 Sending data to Airtable...');
      await airtableService.insertRecord(
        airtableData,
        AIRTABLE_TOKEN, 
        AIRTABLE_BASE_ID, 
        AIRTABLE_TABLE_NAME
      );
      console.log('✅ Successfully inserted into Airtable');
    } catch (airtableError) {
      console.error('❌ Error during Airtable insertion:', airtableError.message);
      throw airtableError;
    }
    
    console.log(`✅ Successfully processed profile ${index + 1}/${total}`);
    return true; // Return success status
    
  } catch (error) {
    console.error(`❌ Error processing profile ${index + 1}/${total}:`, error.message);
    
    // Prepare enhanced error details for webhook
    const errorDetails = {
      type: 'profile_processing_error',
      profileUrl,
      index: index + 1,
      total,
      error: error.message,
      apifyErrorType: error.apifyError?.type || null,
      apifyErrorMessage: error.apifyError?.message || null,
      httpStatus: error.status || null,
      errorDetails: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        scraper: 'profile',
        actor: 'curious_coder~linkedin-post-search-scraper',
        apifyError: error.apifyError || null
      }
    };
    
    await webhookService.triggerWebhook(errorDetails, WEBHOOK_URL);
    return false; // Return failure status
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
    
    // Find status column for filtering and updating
    const statusColumn = googleSheetsService.findStatusColumn(spreadsheetData);
    
    console.log(`📋 Found LinkedIn column: "${linkedinColumn}"`);
    if (statusColumn) {
      console.log(`📊 Found status column: "${statusColumn}"`);
    }
    
    // Filter to only process "To Do" items
    const todoItems = googleSheetsService.filterToDoItems(spreadsheetData, statusColumn);
    
    if (todoItems.length === 0) {
      console.log('📝 No "To Do" items found to process');
      return;
    }
    
    console.log(`🎯 Processing ${todoItems.length} profiles...`);
    
    // Process each "To Do" profile
    for (let i = 0; i < todoItems.length; i++) {
      const row = todoItems[i];
      const profileUrl = row[linkedinColumn];
      
      if (!profileUrl || !profileUrl.includes('linkedin.com')) {
        console.log(`⏭️ Skipping row ${i + 1}: Invalid LinkedIn URL`);
        continue;
      }
      
      const success = await processProfile(profileUrl, i, todoItems.length);
      
      // Update status to "Done" if processing was successful and status column exists
      if (success && statusColumn) {
        const originalIndex = spreadsheetData.findIndex(originalRow => 
          originalRow[linkedinColumn] === profileUrl
        );
        await googleSheetsService.updateRowStatus(
          GOOGLE_SPREADSHEET_URL, 
          originalIndex, 
          statusColumn, 
          'Done'
        );
      }
      
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
