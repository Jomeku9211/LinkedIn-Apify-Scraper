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

module.exports = {
  fetchSpreadsheetData,
  findLinkedInColumn
};
