const axios = require('axios');
const Papa = require('papaparse');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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
  // If Google service account credentials are not configured, log and skip
  // Load credentials from env vars or a key file
  let clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL;
  let privateKeyRaw = process.env.GOOGLE_SA_PRIVATE_KEY;
  const keyFile = process.env.GOOGLE_SA_KEY_FILE;
  try {
    if ((!clientEmail || !privateKeyRaw) && keyFile) {
      const absPath = path.isAbsolute(keyFile) ? keyFile : path.join(process.cwd(), keyFile);
      const json = JSON.parse(fs.readFileSync(absPath, 'utf8'));
      clientEmail = clientEmail || json.client_email;
      privateKeyRaw = privateKeyRaw || json.private_key;
    }
  } catch (e) {
    console.warn('⚠️ Failed to read GOOGLE_SA_KEY_FILE:', e.message);
  }
  if (!clientEmail || !privateKeyRaw) {
    console.warn('⚠️ Google Sheets credentials not configured (GOOGLE_SA_CLIENT_EMAIL/GOOGLE_SA_PRIVATE_KEY or GOOGLE_SA_KEY_FILE). Skipping status update.');
    return false;
  }

  // Helper: parse spreadsheetId and gid from URL
  function parseSpreadsheetUrl(url) {
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/[?&]gid=(\d+)/);
    return { spreadsheetId: idMatch ? idMatch[1] : null, gid: gidMatch ? Number(gidMatch[1]) : null };
  }

  // Helper: convert 0-based column index to A1 column letter(s)
  function columnIndexToLetter(index) {
    let temp = index + 1; // 1-based
    let letter = '';
    while (temp > 0) {
      const rem = (temp - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  }

  try {
    const { spreadsheetId, gid } = parseSpreadsheetUrl(spreadsheetUrl);
    if (!spreadsheetId) throw new Error('Unable to parse spreadsheetId from URL');

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get spreadsheet metadata to resolve sheet title
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsMeta = meta.data.sheets || [];
    if (!sheetsMeta.length) throw new Error('No sheets found in spreadsheet');

    let sheetProps = sheetsMeta[0].properties;
    if (gid != null) {
      const found = sheetsMeta.find(s => s.properties && s.properties.sheetId === gid);
      if (found) sheetProps = found.properties;
    }
    const sheetTitle = sheetProps.title;

    // Fetch header row to locate status column index
    const headerResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`
    });
    const headers = headerResp.data.values && headerResp.data.values[0] ? headerResp.data.values[0] : [];
    if (!headers.length) throw new Error('Unable to read header row from sheet');

    // Match column name case-insensitively
    const norm = s => (s || '').toString().trim().toLowerCase();
    let colIndex = headers.findIndex(h => norm(h) === norm(statusColumn));
    if (colIndex === -1) {
      // Try common synonyms if provided column not found
      const synonyms = ['scrapped', 'status', 'done'];
      colIndex = headers.findIndex(h => synonyms.includes(norm(h)));
    }
    if (colIndex === -1) {
      throw new Error(`Status column "${statusColumn}" not found in sheet headers`);
    }

    // Compute A1 range; data starts at row 2 (rowIndex is 0-based for data)
    const targetRow = rowIndex + 2;
    const targetColLetter = columnIndexToLetter(colIndex);
    const range = `${sheetTitle}!${targetColLetter}${targetRow}`;

    // Perform update
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newStatus]] }
    });

    console.log(`✅ Updated Google Sheet cell ${range} to "${newStatus}"`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating row status:`, error.response?.data || error.message);
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
