/*
  Profile Scraper Unit Tests (offline)
  - Mocks axios.post to avoid real Apify calls
  - Verifies input shape, headers, params, url, and returned data
  - Tests extractCompanyUrl helper
*/

const assert = require('assert');

// Mock axios BEFORE requiring the module under test
const axios = require('axios');
let lastRequest = null;
let mockResponseData = [{
  id: 'fake-profile-1',
  fullName: 'Jane Doe',
  experiences: [
    { title: 'CEO', company: 'Acme Corp', companyUrl: 'https://www.linkedin.com/company/acme-corp' }
  ]
}];

axios.post = async (url, data, config) => {
  lastRequest = { url, data, config };
  return {
    status: 200,
    data: mockResponseData
  };
};

// Require after mock is in place
const profileScraper = require('../scrapers/profileScraper');
console.log('Exported keys from profileScraper:', Object.keys(profileScraper));

(async function runTests() {
  console.log('\n=== PROFILE SCRAPER TESTS (offline) ===');

  // Test 1: extractCompanyUrl returns direct companyUrl
  {
    const url = profileScraper.extractCompanyUrl({
      experiences: [ { companyUrl: 'https://www.linkedin.com/company/example-co' } ]
    });
    assert.strictEqual(url, 'https://www.linkedin.com/company/example-co');
    console.log('✅ extractCompanyUrl: returns provided companyUrl');
  }

  // Test 2: extractCompanyUrl builds slug fallback when only company name present
  {
    const url = profileScraper.extractCompanyUrl({
      experiences: [ { company: 'Foo & Bar, Inc.' } ]
    });
    assert.strictEqual(url, 'https://www.linkedin.com/company/foo-bar-inc');
    console.log('✅ extractCompanyUrl: builds slug when companyUrl missing');
  }

  // Test 3: scrapeProfile constructs proper request and returns first item
  {
    const profileUrl = 'https://www.linkedin.com/in/jane-doe/';
    const linkedinCookies = [ { name: 'li_at', value: 'cookie', domain: '.linkedin.com' } ];
    const apifyToken = 'TEST_TOKEN';
    const contactCompassToken = 'CC_TOKEN';

    const result = await profileScraper.scrapeProfile(profileUrl, linkedinCookies, apifyToken, contactCompassToken);

    // Validate returned data is the first item
    assert.ok(result && result.id === 'fake-profile-1');

    // Validate axios.post was called with expected URL
    assert.ok(lastRequest && typeof lastRequest.url === 'string');
    assert.ok(lastRequest.url.includes('curious_coder~linkedin-profile-scraper'));
    assert.ok(lastRequest.url.includes('/run-sync-get-dataset-items'));

    // Validate headers and params
    assert.strictEqual(lastRequest.config.headers['Content-Type'], 'application/json');
    assert.strictEqual(lastRequest.config.headers['Authorization'], 'Bearer TEST_TOKEN');
    assert.strictEqual(lastRequest.config.params.token, 'TEST_TOKEN');

    // Validate input payload basics
    assert.deepStrictEqual(lastRequest.data.urls, [profileUrl]);
    assert.strictEqual(lastRequest.data.findContacts, true);
    assert.strictEqual(lastRequest.data.scrapeCompany, true);
    assert.ok(Array.isArray(lastRequest.data.cookie));

    console.log('✅ scrapeProfile: builds request and returns first dataset item');
  }

  // Optional: Happy path for runProfileScraper directly
  {
    lastRequest = null;
    mockResponseData = [{ id: 'X' }];
    const result = await profileScraper.runProfileScraper({ urls: ['u'] }, 'TEST_TOKEN');
    assert.deepStrictEqual(result, { id: 'X' });
    assert.ok(lastRequest && lastRequest.url.includes('run-sync-get-dataset-items'));
    console.log('✅ runProfileScraper: returns first dataset item on success');
  }

  console.log('\n🎉 All profile scraper tests passed!\n');
})().catch(err => {
  console.error('❌ Test failure:', err && err.stack || err);
  process.exit(1);
});
