require('dotenv').config();
const axios = require('axios');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

async function checkSelectFieldOptions() {
  console.log('🔍 Checking single select field options...');

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
      
      // Find single select fields
      const selectFields = targetTable.fields.filter(field => 
        field.type === 'singleSelect' || field.type === 'multipleSelects'
      );

      console.log('\n🎯 Single/Multiple Select Fields:');
      selectFields.forEach((field, index) => {
        console.log(`\n${index + 1}. "${field.name}" (${field.type})`);
        if (field.options && field.options.choices) {
          console.log('   Options:');
          field.options.choices.forEach((choice, choiceIndex) => {
            console.log(`   - "${choice.name}"`);
          });
        }
      });

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

checkSelectFieldOptions();
