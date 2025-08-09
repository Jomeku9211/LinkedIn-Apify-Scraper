const axios = require('axios');

/**
 * Insert data into Airtable with enhanced error handling and validation
 */
async function insertRecord(data, airtableToken, baseId, tableName) {
  try {
    console.log('📝 Inserting data into Airtable...');
    console.log(`📊 Record contains ${Object.keys(data).length} fields`);
    console.log('🔍 Field types breakdown:');
    
    // Analyze data types for debugging
    const fieldTypes = {};
    Object.entries(data).forEach(([key, value]) => {
      const type = typeof value;
      if (!fieldTypes[type]) fieldTypes[type] = [];
      fieldTypes[type].push(key);
    });
    
    Object.entries(fieldTypes).forEach(([type, fields]) => {
      console.log(`   ${type}: ${fields.length} fields (${fields.slice(0, 3).join(', ')}${fields.length > 3 ? '...' : ''})`);
    });

    // Show a sample of the data being sent
    console.log('📤 Sample data being sent to Airtable:');
    const sampleFields = Object.entries(data).slice(0, 5);
    sampleFields.forEach(([key, value]) => {
      const displayValue = typeof value === 'string' && value.length > 100 ? 
        value.substring(0, 100) + '...' : value;
      console.log(`   ${key}: ${displayValue}`);
    });

    const response = await axios.post(
      `https://api.airtable.com/v0/${baseId}/${tableName}`,
      {
        fields: data
      },
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log(`✅ Successfully inserted record with ID: ${response.data.id}`);
    console.log(`📊 Record URL: https://airtable.com/${baseId}/${tableName}/${response.data.id}`);
    return response.data;

  } catch (error) {
    console.error('❌ Error inserting into Airtable:', error.message);
    
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ Airtable error response:', JSON.stringify(error.response.data, null, 2));
      
      // Provide specific guidance based on error type
      if (error.response.status === 422) {
        const errorDetails = error.response.data?.error;
        if (errorDetails?.type === 'UNKNOWN_FIELD_NAME') {
          console.error(`🔍 Field name issue: ${errorDetails.message}`);
          console.error('💡 Suggestion: Check if the field name exists in your Airtable base');
        } else if (errorDetails?.type === 'INVALID_VALUE_FOR_COLUMN') {
          console.error(`🔍 Invalid value issue: ${errorDetails.message}`);
          console.error('💡 Suggestion: Check data type or select field options');
        }
      } else if (error.response.status === 401) {
        console.error('🔑 Authentication failed - check your Airtable token');
      } else if (error.response.status === 404) {
        console.error('🔍 Base or table not found - check your base ID and table name');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timed out - Airtable might be slow');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network error - check internet connection');
    }
    
    throw error;
  }
}

module.exports = {
  insertRecord
};
