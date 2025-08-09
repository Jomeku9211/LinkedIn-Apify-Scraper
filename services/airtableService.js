const axios = require('axios');

/**
 * Insert data into Airtable
 */
async function insertRecord(data, airtableToken, baseId, tableName) {
  try {
    console.log('📝 Inserting data into Airtable...');
    
    const response = await axios.post(
      `https://api.airtable.com/v0/${baseId}/${tableName}`,
      {
        fields: data
      },
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Successfully inserted record with ID: ${response.data.id}`);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error inserting into Airtable:', error.message);
    throw error;
  }
}

module.exports = {
  insertRecord
};
