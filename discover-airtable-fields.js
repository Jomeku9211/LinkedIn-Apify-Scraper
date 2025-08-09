require('dotenv').config();
const axios = require('axios');

/**
 * Quick test to discover Airtable field schema
 */
async function discoverAirtableFields() {
  console.log('🔍 Discovering Airtable field schema...');
  
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

  try {
    // Try to get existing records to see field structure
    const response = await axios.get(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?maxRecords=1`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.records && response.data.records.length > 0) {
      const firstRecord = response.data.records[0];
      const availableFields = Object.keys(firstRecord.fields);
      
      console.log('✅ Available fields in Airtable:');
      availableFields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field}`);
      });
      
      console.log(`\n📊 Total fields found: ${availableFields.length}`);
      return availableFields;
    } else {
      console.log('⚠️ No records found in table. Trying with test data...');
      
      // Try inserting minimal test data to see what fails
      const testData = {
        'firstName': 'Test',
        'lastName': 'User',
        'linkedinUrl': 'https://linkedin.com/in/test'
      };
      
      await axios.post(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
        { fields: testData },
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Test record created successfully');
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Airtable API Error:');
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data?.error?.type === 'UNKNOWN_FIELD_NAME') {
        const message = error.response.data.error.message;
        console.log('\n💡 Field discovery from error message:', message);
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the discovery
discoverAirtableFields();
