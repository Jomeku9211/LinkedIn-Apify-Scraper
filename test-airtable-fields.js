require('dotenv').config();
const axios = require('axios');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

async function discoverAirtableFields() {
  console.log('🔍 Discovering Airtable field schema...');
  console.log('📋 Base ID:', AIRTABLE_BASE_ID);
  console.log('📋 Table Name:', AIRTABLE_TABLE_NAME);

  try {
    // First, try to get the base schema using the metadata API
    console.log('\n📊 Attempting to get base metadata...');
    
    const metadataResponse = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        }
      }
    );

    console.log('✅ Base metadata retrieved successfully!');
    
    // Find the target table
    const targetTable = metadataResponse.data.tables.find(table => 
      table.id === AIRTABLE_TABLE_NAME || table.name === AIRTABLE_TABLE_NAME
    );

    if (targetTable) {
      console.log(`\n📋 Found table: "${targetTable.name}" (ID: ${targetTable.id})`);
      console.log('\n🏷️  Available fields:');
      targetTable.fields.forEach((field, index) => {
        console.log(`${index + 1}. "${field.name}" (${field.type})`);
      });

      // Create a simple test record with minimal fields
      console.log('\n🧪 Testing with minimal data...');
      const testData = {};
      
      // Find basic text fields to test with
      const textFields = targetTable.fields.filter(field => 
        ['singleLineText', 'multilineText', 'email', 'url', 'phoneNumber'].includes(field.type)
      );

      if (textFields.length > 0) {
        testData[textFields[0].name] = 'Test LinkedIn Profile';
        
        const testResponse = await axios.post(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
          {
            fields: testData
          },
          {
            headers: {
              'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ Test record created successfully!');
        console.log('📝 Record ID:', testResponse.data.id);

        // Delete the test record
        await axios.delete(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${testResponse.data.id}`,
          {
            headers: {
              'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            }
          }
        );
        console.log('🗑️  Test record deleted');
      }

    } else {
      console.log('❌ Target table not found in base');
      console.log('📋 Available tables:');
      metadataResponse.data.tables.forEach((table, index) => {
        console.log(`${index + 1}. "${table.name}" (ID: ${table.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

discoverAirtableFields();
