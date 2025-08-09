require('dotenv').config();
const axios = require('axios');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

async function findLeadSourceField() {
  console.log('🔍 Looking for Lead Source field...');

  try {
    const metadataResponse = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        }
      }
    );

    const targetTable = metadataResponse.data.tables.find(table => 
      table.id === AIRTABLE_TABLE_NAME || table.name === AIRTABLE_TABLE_NAME
    );

    if (targetTable) {
      console.log(`\n📋 Table: "${targetTable.name}"`);
      
      // Find Lead Source field
      const leadSourceField = targetTable.fields.find(field => 
        field.name.toLowerCase().includes('lead') && field.name.toLowerCase().includes('source')
      );

      if (leadSourceField) {
        console.log(`\n🎯 Found field: "${leadSourceField.name}" (${leadSourceField.type})`);
        if (leadSourceField.options && leadSourceField.options.choices) {
          console.log('   Available options:');
          leadSourceField.options.choices.forEach((choice, choiceIndex) => {
            console.log(`   - "${choice.name}"`);
          });
        }
      } else {
        console.log('❌ Lead Source field not found');
        
        // Show all fields that contain "source" or "lead"
        const relatedFields = targetTable.fields.filter(field => 
          field.name.toLowerCase().includes('lead') || 
          field.name.toLowerCase().includes('source')
        );
        
        if (relatedFields.length > 0) {
          console.log('\n🔍 Related fields found:');
          relatedFields.forEach(field => {
            console.log(`- "${field.name}" (${field.type})`);
            if (field.options && field.options.choices) {
              console.log('  Options:');
              field.options.choices.forEach(choice => {
                console.log(`    - "${choice.name}"`);
              });
            }
          });
        }
      }

    } else {
      console.log('❌ Target table not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

findLeadSourceField();
