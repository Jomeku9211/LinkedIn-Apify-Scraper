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

/**
 * Combine profile and company data into Airtable format
 */
function formatDataForAirtable(profileUrl, profileData, companyData, companyUrl) {
  return {
    'Profile URL': profileUrl,
    'Full Name': profileData.fullName || '',
    'Title': profileData.title || '',
    'Location': profileData.location || '',
    'About': profileData.about || '',
    'Company Name': companyData?.name || (profileData.experiences?.[0]?.company || ''),
    'Company URL': companyUrl || '',
    'Company Description': companyData?.description || '',
    'Company Industry': companyData?.industry || '',
    'Company Size': companyData?.employeeCount || '',
    'Scraped At': new Date().toISOString()
  };
}

/**
 * Insert combined profile and company data into Airtable
 */
async function insertCombinedData(profileUrl, profileData, companyData, companyUrl, airtableToken, baseId, tableName) {
  const formattedData = formatDataForAirtable(profileUrl, profileData, companyData, companyUrl);
  return await insertRecord(formattedData, airtableToken, baseId, tableName);
}

module.exports = {
  insertRecord,
  formatDataForAirtable,
  insertCombinedData
};
