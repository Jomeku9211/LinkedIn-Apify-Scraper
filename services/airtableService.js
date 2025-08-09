const axios = require('axios');

/**
 * Insert data into Airtable
 */
async function insertRecord(data, airtableToken, baseId, tableName) {
  try {
    console.log('📝 Inserting data into Airtable...');
    console.log('➡️ Payload to Airtable:', JSON.stringify({ fields: data }, null, 2));

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
    if (error.response) {
      console.error('❌ Airtable error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

module.exports = {
  insertRecord
};
