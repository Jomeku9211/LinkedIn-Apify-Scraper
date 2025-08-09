require('dotenv').config();

const airtableService = require('./services/airtableService');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

async function testFieldNames() {
  console.log('🔍 Testing Field Names in Airtable');
  console.log('==================================');
  
  // Test different possible field names for the summary/about field
  const fieldsToTest = [
    { name: 'about', value: 'Test about field' },
    { name: 'summary', value: 'Test summary field' },
    { name: 'description', value: 'Test description field' },
    { name: 'bio', value: 'Test bio field' },
    { name: 'About', value: 'Test About field' },
    { name: 'Summary', value: 'Test Summary field' },
    { name: 'volunteering', value: 'Test volunteering field' },
    { name: 'Competitor description', value: 'Test competitor description' },
    { name: 'Company competitor Name', value: 'Test competitor name' },
    { name: 'Company Competitor location', value: 'Test competitor location' }
  ];
  
  for (const field of fieldsToTest) {
    try {
      console.log(`\n🧪 Testing field: "${field.name}"`);
      
      const testData = {
        "firstName": "Test",
        "lastName": "User",
        [field.name]: field.value
      };
      
      const result = await airtableService.insertRecord(testData, AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME);
      console.log(`✅ SUCCESS: Field "${field.name}" exists and works!`);
      console.log(`   Record ID: ${result.id}`);
      
    } catch (error) {
      if (error.response && error.response.status === 422) {
        const errorDetails = error.response.data?.error;
        if (errorDetails?.type === 'UNKNOWN_FIELD_NAME') {
          console.log(`❌ FAILED: Field "${field.name}" does not exist in Airtable`);
        } else {
          console.log(`⚠️  OTHER ERROR for "${field.name}": ${errorDetails?.message || error.message}`);
        }
      } else {
        console.log(`⚠️  NETWORK ERROR for "${field.name}": ${error.message}`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testFieldNames();
