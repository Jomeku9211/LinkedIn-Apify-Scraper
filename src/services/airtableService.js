const axios = require('axios');

// Basic retry with exponential backoff (max 2 retries as per project rules)
async function withRetries(fn, { maxRetries = 2, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  // jittered exponential backoff
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      const shouldRetry = (status === 429 || (status && status >= 500 && status < 600) || err.code === 'ECONNABORTED');
      if (attempt >= maxRetries || !shouldRetry) throw err;
      const retryAfter = parseInt(err.response?.headers?.['retry-after'] || '0', 10);
      const delay = retryAfter > 0 ? retryAfter * 1000 : Math.min(5000, baseDelayMs * Math.pow(2, attempt));
      await new Promise(r => setTimeout(r, delay + Math.floor(Math.random() * 150)));
      attempt++;
    }
  }
}

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

  const response = await withRetries(() => axios.post(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
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
  ));

    console.log(`✅ Successfully inserted record with ID: ${response.data.id}`);
  console.log(`📊 Record URL: https://airtable.com/${baseId}/${encodeURIComponent(tableName)}/${response.data.id}`);
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
    
  const response = await withRetries(() => axios.get(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          view: viewId
        },
        timeout: 30000
      }
  ));

    const records = response.data.records;
    console.log(`📊 Found ${records.length} records in view`);
    
    // Extract LinkedIn URLs and filter out empty ones
    const FIELD_CANDIDATES = [
      'linkedinUrl',
      'LinkedIn URL',
      'Linkedin URL',
      'LinkedIn',
      'Profile URL',
      'LinkedIn Profile',
      'LinkedIn Profile URL',
      'URL'
    ];

    const urls = records
      .map(record => {
        const f = record.fields || {};
        for (const key of FIELD_CANDIDATES) {
          if (f[key] && typeof f[key] === 'string' && f[key].trim()) return f[key].trim();
        }
        // Also support arrays of URLs if present
        for (const key of FIELD_CANDIDATES) {
          if (Array.isArray(f[key]) && f[key].length > 0 && typeof f[key][0] === 'string') {
            const v = f[key][0].trim();
            if (v) return v;
          }
        }
        return null;
      })
      .filter(Boolean);
    
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
 * Fetch records with their IDs and resolved LinkedIn URL from a view.
 * Returns array of { id, fields, url }.
 */
async function fetchUrlRecordsFromView(airtableToken, baseId, tableName, viewId) {
  try {
    console.log(`📋 Fetching records (id + URL) from Airtable view: ${viewId}`);
  const response = await withRetries(() => axios.get(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
      {
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        params: { view: viewId },
        timeout: 30000
      }
  ));
    const FIELD_CANDIDATES = [
      'linkedinUrl', 'LinkedIn URL', 'Linkedin URL', 'LinkedIn', 'Profile URL', 'LinkedIn Profile', 'LinkedIn Profile URL', 'URL'
    ];
    const records = response.data.records || [];
    const result = records.map(r => {
      const f = r.fields || {};
      let url = null;
      for (const key of FIELD_CANDIDATES) {
        if (f[key] && typeof f[key] === 'string' && f[key].trim()) { url = f[key].trim(); break; }
        if (Array.isArray(f[key]) && f[key].length > 0 && typeof f[key][0] === 'string' && f[key][0].trim()) { url = f[key][0].trim(); break; }
      }
      return { id: r.id, fields: f, url };
    }).filter(x => !!x.url);
    console.log(`✅ Found ${result.length} records with URL`);
    return result;
  } catch (err) {
    console.error('❌ Error fetching id+URL records:', err.response?.status, JSON.stringify(err.response?.data));
    throw err;
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

  const response = await withRetries(() => axios.post(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
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
  ));

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
    
  const response = await withRetries(() => axios.get(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
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
  ));

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
    
  const response = await withRetries(() => axios.patch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`,
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
  ));

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
  fetchUrlRecordsFromView,
  updateRecord
};

/**
 * Find a record by URL via filterByFormula; compares lowercase values.
 */
async function findRecordByUrl(airtableToken, baseId, tableName, urlField, urlValue) {
  try {
    const formula = `LOWER({${urlField}}) = '${(urlValue || '').toLowerCase().replace(/'/g, "\\'")}'`;
    const response = await withRetries(() => axios.get(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
      {
        headers: { 'Authorization': `Bearer ${airtableToken}` },
        params: { filterByFormula: formula, maxRecords: 1, pageSize: 1 },
        timeout: 30000
      }
    ));
    const rec = (response.data?.records || [])[0];
    return rec || null;
  } catch (err) {
    console.error('❌ Error finding record by URL:', err.response?.status, JSON.stringify(err.response?.data));
    throw err;
  }
}

/**
 * Update existing record by URL or insert a new one if not found.
 * Returns { action: 'updated'|'inserted', record }
 */
async function updateOrInsertByUrl({ airtableToken, baseId, tableName, urlField, urlValue, fields }) {
  const existing = await findRecordByUrl(airtableToken, baseId, tableName, urlField, urlValue);
  if (existing) {
    const updated = await updateRecord(existing.id, fields, airtableToken, baseId, tableName);
    return { action: 'updated', record: updated };
  }
  // ensure urlField present on insert
  const insertFields = { ...fields, [urlField]: urlValue };
  const inserted = await insertRecord(insertFields, airtableToken, baseId, tableName);
  return { action: 'inserted', record: inserted };
}

module.exports.findRecordByUrl = findRecordByUrl;
module.exports.updateOrInsertByUrl = updateOrInsertByUrl;
