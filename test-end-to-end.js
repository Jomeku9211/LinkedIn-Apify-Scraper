require('dotenv').config();

const fs = require('fs');
const profileScraper = require('./src/scrapers/profileScraper');
const airtableService = require('./src/services/airtableService');
const { mapApifyResponseToAirtable, validateAirtableData } = require('./src/utils/apifyDataMapper');

// Configuration
const APIFY_PROFILE_TOKEN = process.env.APIFY_PROFILE_TOKEN;
const APIFY_COOKIES_JSON = JSON.parse(process.env.APIFY_COOKIES_JSON || '[]');
const CONTACT_COMPASS_TOKEN = process.env.CONTACT_COMPASS_TOKEN;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

async function testEndToEndMapping() {
  console.log('🧪 Testing end-to-end Apify mapping with actual scraping...\n');
  
  const profileUrl = 'https://www.linkedin.com/in/dheeraj-khandare/';
  
  try {
    console.log('🔍 Step 1: Scraping LinkedIn profile with Apify...');
    const apifyResponse = await profileScraper.scrapeProfile(
      profileUrl, 
      APIFY_COOKIES_JSON, 
      APIFY_PROFILE_TOKEN,
      CONTACT_COMPASS_TOKEN
    );
    
    console.log('✅ Scraping completed successfully');
    console.log(`📊 Received response type: ${typeof apifyResponse}`);
    console.log(`📊 Is array: ${Array.isArray(apifyResponse)}`);
    console.log(`📊 Response length/size: ${Array.isArray(apifyResponse) ? apifyResponse.length : 'N/A'}`);
    
    // Debug: Log the actual response structure
    console.log('\n🔍 DEBUG: Actual response structure:');
    console.log('Response keys:', Object.keys(apifyResponse || {}));
    if (Array.isArray(apifyResponse) && apifyResponse.length > 0) {
      console.log('First item keys:', Object.keys(apifyResponse[0] || {}));
      console.log('First item sample:', JSON.stringify(apifyResponse[0], null, 2).substring(0, 500) + '...');
    } else {
      console.log('Full response:', JSON.stringify(apifyResponse, null, 2).substring(0, 1000) + '...');
    };
    
    console.log('\n🗺️ Step 2: Mapping data to Airtable format...');
    const mappedData = mapApifyResponseToAirtable(apifyResponse, profileUrl);
    
    console.log('\n🔍 Step 3: Validating mapped data...');
    const isValid = validateAirtableData(mappedData);
    
    if (!isValid) {
      throw new Error('Validation failed - cannot proceed to Airtable insert');
    }
    
    console.log('\n📝 Step 4: Preparing for Airtable insertion...');
    console.log('Key fields to be inserted:');
    const keyFields = ['firstName', 'lastName', 'email', 'companyName', 'Current_Position_Title'];
    keyFields.forEach(field => {
      if (mappedData[field]) {
        console.log(`   ${field}: ${mappedData[field]}`);
      }
    });
    
    console.log(`\nTotal fields to insert: ${Object.keys(mappedData).length}`);
    
    // Test actual insertion to Airtable
    console.log('\n💾 Step 5: Inserting into Airtable...');
    await airtableService.insertRecord(
      mappedData,
      AIRTABLE_TOKEN, 
      AIRTABLE_BASE_ID, 
      AIRTABLE_TABLE_NAME
    );
    
    console.log('✅ Successfully inserted into Airtable!');
    
    console.log('\n🎉 End-to-end test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`✅ Scraping: Success`);
    console.log(`✅ Mapping: Success (${Object.keys(mappedData).length} fields)`);
    console.log(`✅ Validation: Success`);
    console.log(`✅ Airtable Insert: Success`);
    
    return mappedData;
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error.message);
    
    if (error.apifyError) {
      console.error('🔍 Apify Error Details:', error.apifyError);
    }
    
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testEndToEndMapping()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testEndToEndMapping };
