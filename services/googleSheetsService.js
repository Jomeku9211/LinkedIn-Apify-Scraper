const axios = require('axios');
const Papa = require('papaparse');

/**
 * Fetch data from Google Spreadsheet CSV
 */
async function fetchSpreadsheetData(spreadsheetUrl) {
  try {
    console.log('📊 Fetching data from Google Spreadsheet...');
    
    const response = await axios.get(spreadsheetUrl);
    const csvData = response.data.trim();
    
    // Check if the data is just URLs without headers
    if (csvData.includes('linkedin.com') && !csvData.includes(',')) {
      console.log('📝 Detected simple URL list format, converting to CSV...');
      const urls = csvData.split('\n').filter(url => url.trim().includes('linkedin.com'));
      return urls.map(url => ({ 'LinkedIn Profile URL': url.trim() }));
    }
    
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });
    
    if (parsed.errors.length > 0) {
      console.warn('⚠️ CSV parsing warnings:', parsed.errors);
      // Don't throw error for delimiter warnings, just continue
    }
    
    console.log(`✅ Successfully fetched ${parsed.data.length} records`);
    return parsed.data;
    
  } catch (error) {
    console.error('❌ Error fetching spreadsheet data:', error.message);
    throw error;
  }
}

/**
 * Find LinkedIn URL column in spreadsheet data
 */
function findLinkedInColumn(data) {
  if (!data || data.length === 0) {
    throw new Error('No data provided to find LinkedIn column');
  }
  
  const sampleRow = data[0];
  const linkedinColumn = Object.keys(sampleRow).find(key => 
    key.toLowerCase().includes('linkedin') || 
    key.toLowerCase().includes('profile') ||
    key.toLowerCase().includes('url')
  );
  
  if (!linkedinColumn) {
    throw new Error('Could not find LinkedIn URL column in spreadsheet');
  }
  
  return linkedinColumn;
}

/**
 * Find status column in spreadsheet data
 */
function findStatusColumn(data) {
  if (!data || data.length === 0) {
    return null;
  }
  
  const sampleRow = data[0];
  const statusColumn = Object.keys(sampleRow).find(key => 
    key.toLowerCase().includes('scrapped') || 
    key.toLowerCase().includes('status') ||
    key.toLowerCase().includes('done')
  );
  
  return statusColumn;
}

/**
 * Filter spreadsheet data to only include "To Do" items
 */
function filterToDoItems(data, statusColumn) {
  if (!statusColumn) {
    console.log('📝 No status column found, processing all rows');
    return data;
  }
  
  const todoItems = data.filter(row => {
    const status = row[statusColumn];
    return status && status.toLowerCase().trim() === 'to do';
  });
  
  console.log(`🎯 Found ${todoItems.length} "To Do" items out of ${data.length} total rows`);
  return todoItems;
}

/**
 * Update row status in Google Sheets (placeholder - requires Google Sheets API)
 * For now, just log the update
 */
async function updateRowStatus(spreadsheetUrl, rowIndex, statusColumn, newStatus) {
  try {
    console.log(`📝 Updating row ${rowIndex + 1} status from "To Do" to "${newStatus}"`);
    // TODO: Implement actual Google Sheets API update
    // This would require Google Sheets API credentials and proper authentication
    console.log(`✅ Status update logged (API implementation needed for actual update)`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating row status:`, error.message);
    return false;
  }
}

module.exports = {
  fetchSpreadsheetData,
  findLinkedInColumn,
  findStatusColumn,
  filterToDoItems,
  updateRowStatus
};
