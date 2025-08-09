require('dotenv').config();

const airtableService = require('./services/airtableService');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

async function testBasicFieldMapping() {
  try {
    console.log('🚀 Testing Basic Field Mapping');
    console.log('===============================');
    
    // Start with just the basic fields that we know should work
    const basicMappedData = {
      "firstName": "Dheeraj",
      "lastName": "Khandare", 
      "email": "dheeraj@coderfarm.in",
      "linkedinUrl": "https://www.linkedin.com/in/dheeraj-khandare/",
      "companyName": "CoderFarm",
      // Test volunteer and competitor fields
      "volunteering": "Volunteer Developer at Code for Good Initiative (Education Technology) - Developed educational apps for underserved communities [2022 - Present]",
      "Competitor description": "Leading technology consulting firm specializing in enterprise software solutions and digital transformation services",
      "Company competitor Name": "tech-solutions-inc", 
      "Company Competitor location": "San Francisco"
    };
    
    console.log('📊 Testing with basic fields:');
    Object.entries(basicMappedData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Test inserting into Airtable
    console.log('\n🔄 Attempting to insert into Airtable...');
    const result = await airtableService.insertRecord(basicMappedData, AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME);
    
    console.log('✅ Successfully inserted basic record!');
    console.log(`   Record ID: ${result.id}`);
    console.log(`   Record URL: https://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${result.id}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response && error.response.status === 422) {
      const errorDetails = error.response.data?.error;
      if (errorDetails?.type === 'UNKNOWN_FIELD_NAME') {
        console.error(`🔍 Unknown field: ${errorDetails.message}`);
        console.error('💡 This tells us which field names are not valid in the Airtable');
      }
    }
  }
}

// Run the test
testBasicFieldMapping();
