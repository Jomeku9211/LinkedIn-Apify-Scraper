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
      
      // Re-throw with the actual Airtable error message
      throw new Error(error.response.data?.error?.message || error.message);
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timed out - Airtable might be slow');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network error - check internet connection');
    }
    
    throw error;
  }
}

/**
 * Fetch LinkedIn URLs from a specific Airtable view
 */
async function fetchUrlsFromView(airtableToken, baseId, tableName, viewId) {
  try {
    console.log(`📋 Fetching LinkedIn URLs from Airtable view: ${viewId}`);
    
    const response = await axios.get(
      `https://api.airtable.com/v0/${baseId}/${tableName}`,
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          view: viewId,
          fields: ['linkedinUrl'] // Only fetch the LinkedIn URL field
        },
        timeout: 30000
      }
    );

    const records = response.data.records;
    console.log(`📊 Found ${records.length} records in view`);
    
    // Extract LinkedIn URLs and filter out empty ones
    const urls = records
      .map(record => record.fields.linkedinUrl)
      .filter(url => url && url.trim())
      .map(url => url.trim());
    
    console.log(`✅ Extracted ${urls.length} valid LinkedIn URLs`);
    return urls;

  } catch (error) {
    console.error('❌ Error fetching URLs from Airtable view:', error.message);
    
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ Airtable error response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.error('🔍 View not found - check your view ID');
      }
    }
    
    throw error;
  }
}

/**
 * Insert post data into Airtable
 */
async function insertPostData(postData, airtableToken, baseId, tableName) {
  try {
    console.log('📝 Inserting post data into Airtable...');
    console.log(`📊 Post data contains ${Object.keys(postData).length} fields`);
    
    // Log some key fields for debugging
    console.log('📤 Key post data fields:');
    const keyFields = ['postText', 'authorName', 'likesCount', 'commentsCount', 'postUrl'];
    keyFields.forEach(field => {
      if (postData[field] !== undefined) {
        const value = typeof postData[field] === 'string' && postData[field].length > 100 ? 
          postData[field].substring(0, 100) + '...' : postData[field];
        console.log(`   ${field}: ${value}`);
      }
    });

    const response = await axios.post(
      `https://api.airtable.com/v0/${baseId}/${tableName}`,
      {
        fields: postData
      },
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(`✅ Successfully inserted post record with ID: ${response.data.id}`);
    return response.data;

  } catch (error) {
    console.error('❌ Error inserting post data into Airtable:', error.message);
    
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ Airtable error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

/**
 * Fetch records from a specific Airtable view for ChatGPT processing
 */
async function fetchRecordsFromView(airtableToken, baseId, tableName, viewId, fields) {
  try {
    console.log(`📋 Fetching records from Airtable view: ${viewId}`);
    
    const response = await axios.get(
      `https://api.airtable.com/v0/${baseId}/${tableName}`,
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          view: viewId,
          fields: fields // Fetch specified fields
        },
        timeout: 30000
      }
    );

    const records = response.data.records;
    console.log(`📊 Found ${records.length} records in view`);
    
    // Filter out records that already have generated comments or missing required fields
    const validRecords = records.filter(record => {
      const hasRequiredFields = fields.every(field => 
        record.fields[field] && record.fields[field].toString().trim()
      );
      const noGeneratedComment = !record.fields['Generated Comment'] || 
        record.fields['Generated Comment'].toString().trim() === '';
      
      return hasRequiredFields && noGeneratedComment;
    });
    
    console.log(`✅ Found ${validRecords.length} records ready for processing`);
    return validRecords;

  } catch (error) {
    console.error('❌ Error fetching records from Airtable view:', error.message);
    
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ Airtable error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

/**
 * Update a specific record in Airtable
 */
async function updateRecord(recordId, data, airtableToken, baseId, tableName) {
  try {
    console.log(`📝 Updating record ${recordId} in Airtable...`);
    
    const response = await axios.patch(
      `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`,
      {
        fields: data
      },
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(`✅ Successfully updated record ${recordId}`);
    return response.data;

  } catch (error) {
    console.error(`❌ Error updating record ${recordId}:`, error.message);
    
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ Airtable error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

module.exports = {
  insertRecord,
  fetchUrlsFromView,
  insertPostData,
  fetchRecordsFromView,
  updateRecord
};
