const axios = require('axios');

// Configuration
const PROFILE_SCRAPER_ACTOR = 'curious_coder~linkedin-profile-scraper';
const MAX_RETRIES = 2;
const RETRY_DELAY = 5000; // 5 seconds

function extractRunIdFromError(error) {
  try {
    const msg = error?.response?.data?.error?.message || error.message || '';
    const m = msg.match(/run ID:\s*([A-Za-z0-9]+)/i);
    return m && m[1] ? m[1] : null;
  } catch {
    return null;
  }
}

async function fetchRunLogTail(runId, apiToken, tailLines = 120) {
  const logRes = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}/log`, {
    params: { token: apiToken, stream: 0 },
    responseType: 'text',
    transformResponse: [d => d]
  });
  const logText = typeof logRes.data === 'string' ? logRes.data : String(logRes.data || '');
  const lines = logText.split('\n');
  return lines.slice(-tailLines).join('\n');
}

function detectApifyWarning(logText) {
  if (!logText) return null;
  const patterns = [
    /redirected\s+10\s+times\b/i,
    /\bWARN\b.*redirected/i,
  /too many redirects/i,
  /not\s+logged\s+in/i,
  /login\s+required/i,
  /unauthorized/i,
  /forbidden/i,
  /\b401\b/i,
  /\b403\b/i,
  /cookie/i,
  /li_at/i,
  /session\s+expired/i
  ];
  for (const re of patterns) {
    const m = logText.match(re);
    if (m) return m[0];
  }
  return null;
}

async function pollForDatasetId(runId, apiToken, maxAttempts = 3, delayMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const runRes = await axios.get(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}`, {
      params: { token: apiToken },
      timeout: 120000
    });
    const dsId = runRes.data?.data?.defaultDatasetId;
    const status = runRes.data?.data?.status;
    if (dsId) return dsId;
    if (status === 'SUCCEEDED' && !dsId) break;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED_OUT') break;
    await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

/**
 * Run Apify LinkedIn profile scraper with direct dataset items return
 */
async function runProfileScraper(input, apiToken, retryCount = 0) {
  try {
    console.log(`🔄 Running profile scraper (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);

    // First, run the actor to get runId and datasetId
    const runSyncUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(PROFILE_SCRAPER_ACTOR)}/run-sync`;
    const runResp = await axios.post(runSyncUrl, input, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      params: { token: apiToken },
      timeout: 600000
    });

    const runId = runResp.data?.data?.id || runResp.data?.id;
    const datasetId = runResp.data?.data?.defaultDatasetId || runResp.data?.defaultDatasetId;
    console.log('ℹ️ Profile run started. runId:', runId, 'datasetId:', datasetId);

    // Fetch run logs and detect warnings
    if (runId) {
      try {
        const tail = await fetchRunLogTail(runId, apiToken, 160);
        const warn = detectApifyWarning(tail);
        if (warn) {
          const warnErr = new Error(`Apify warning detected: ${warn}`);
          warnErr.warningDetected = true;
          warnErr.apifyRun = { runId, logTail: tail };
          throw warnErr;
        }
      } catch (e) {
        if (!e.warningDetected) console.warn('⚠️ Could not fetch or parse Apify run log for warnings:', e.message);
        else throw e;
      }
    }

    let finalDatasetId = datasetId;
    if (!finalDatasetId && runId) {
      try {
        finalDatasetId = await pollForDatasetId(runId, apiToken, 3, 2000);
        console.log('ℹ️ Polled run for datasetId. Result:', finalDatasetId || 'none');
      } catch (e) {
        console.warn('⚠️ Poll for datasetId failed:', e.message);
      }
    }
    // Fallback: directly get dataset items via run-sync-get-dataset-items
    if (!finalDatasetId) {
      try {
        const fbUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(PROFILE_SCRAPER_ACTOR)}/run-sync-get-dataset-items`;
        const fbResp = await axios.post(fbUrl, input, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToken}` },
          params: { token: apiToken },
          timeout: 600000
        });
        const items = Array.isArray(fbResp.data) ? fbResp.data : [];
        console.log(`ℹ️ Fallback used (run-sync-get-dataset-items). Items: ${items.length}`);
        if (items.length > 0) return items[0];
      } catch (e) {
        console.warn('⚠️ Fallback run-sync-get-dataset-items failed:', e.message);
      }
      // Treat missing datasetId as critical (stop-and-alert)
      const critical = new Error('No datasetId returned from profile scraper run');
      critical.warningDetected = true; // signal orchestrator to stop
      critical.apifyRun = runId ? { runId } : null;
      throw critical;
    }

    // Fetch dataset items
  const itemsUrl = `https://api.apify.com/v2/datasets/${encodeURIComponent(finalDatasetId)}/items`;
    const itemsResp = await axios.get(itemsUrl, {
      params: { token: apiToken, format: 'json' },
      timeout: 300000
    });
    if (!Array.isArray(itemsResp.data) || itemsResp.data.length === 0) {
      // Treat no items as critical (stop-and-alert)
      const critical = new Error('No data returned from profile scraper');
      critical.warningDetected = true; // signal orchestrator to stop
      critical.apifyRun = { runId: runId || null, datasetId: finalDatasetId || null };
      throw critical;
    }
    console.log(`✅ Profile scraper completed. Retrieved ${itemsResp.data.length} items`);
    return itemsResp.data[0];
    
  } catch (error) {
    console.error(`❌ Error running profile scraper:`, error.message);

    // Log detailed error information
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
    }

    // Try to fetch Apify run details/logs if a runId is present
    let apifyRun = error.apifyRun || null;
    try {
      const runId = apifyRun?.runId || extractRunIdFromError(error);
      if (runId) {
        // Fetch run details
        const runRes = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}`, {
          params: { token: apiToken },
          timeout: 120000
        });
        // Fetch run log (non-stream)
        const tail = await fetchRunLogTail(runId, apiToken, 160);
        apifyRun = {
          runId,
          status: runRes.data?.data?.status,
          statusMessage: runRes.data?.data?.statusMessage || runRes.data?.data?.statusReason || null,
          failureMessage: runRes.data?.data?.statusMessage || null,
          logTail: tail
        };
        console.error('📄 Apify run tail (last ~80 lines):\n' + tail);
      }
    } catch (e) {
      console.error('⚠️ Failed to fetch Apify run details/log:', e.message);
    }

    // Treat 401/403 as critical (likely cookie/auth issue); don't retry further
    const statusCode = error.response?.status;
    if (statusCode === 401 || statusCode === 403) {
      const authErr = new Error(`Authentication failure (${statusCode}). Cookies may be expired.`);
      authErr.warningDetected = true;
      authErr.apifyRun = null;
      throw authErr;
    }

    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return runProfileScraper(input, apiToken, retryCount + 1);
    }

    // Create enhanced error object with Apify response details
    const enhancedError = {
      message: error.message,
      status: error.response?.status,
      apifyError: error.response?.data?.error || null,
      apifyRun,
      warningDetected: !!error.warningDetected,
    };

    throw enhancedError;
  }
}

/**
 * Extract company URL from LinkedIn profile data
 */
function extractCompanyUrl(profileData) {
  // Look for company URL in various possible fields
  if (profileData.experiences && profileData.experiences.length > 0) {
    const currentJob = profileData.experiences[0];
    if (currentJob.companyUrl) {
      return currentJob.companyUrl;
    }
    if (currentJob.company) {
      // Try to construct LinkedIn company URL from company name
      const companySlug = currentJob.company.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return `https://www.linkedin.com/company/${companySlug}`;
    }
  }
  
  return null;
}

/**
 * Scrape LinkedIn profile data
 */
async function scrapeProfile(profileUrl, linkedinCookies, apifyToken, contactCompassToken) {
  // Basic validation for cookies
  if (!Array.isArray(linkedinCookies) || linkedinCookies.length === 0) {
    throw new Error('LinkedIn cookies are missing. Provide a valid cookies array with li_at.');
  }
  const hasLiAt = linkedinCookies.some(c => (c.name || '').toLowerCase() === 'li_at');
  if (!hasLiAt) {
    console.warn('⚠️ li_at cookie not found in provided cookies. The Apify actor may fail authentication.');
  }

  // Construct input exactly as the actor expects it
  const input = {
    cookie: linkedinCookies, // Array of detailed cookie objects
    maxDelay: 60,
    minDelay: 30,
    proxy: {
      useApifyProxy: true,
      apifyProxyCountry: 'US'
    },
    scrapeCompany: true,
    urls: [profileUrl]  // Use simple URL array format as required by actor
  };
  // Only enable findContacts when token is provided
  if (contactCompassToken) {
    input.findContacts = true;
    input['findContacts.contactCompassToken'] = contactCompassToken;
  } else {
    input.findContacts = false;
  }

  console.log('🔧 Profile scraper input constructed with:');
  console.log('- URLs:', input.urls);
  console.log('- LinkedIn cookies:', input.cookie.length, 'cookies provided');
  console.log('- Find contacts:', input.findContacts);
  console.log('- Contact compass token:', contactCompassToken ? 'provided' : 'missing');
  console.log('- Scrape company:', input.scrapeCompany);
  console.log('- Proxy config:', input.proxy);

  // Log the full input for debugging
  console.log('🔍 Full input payload:', JSON.stringify(input, null, 2));

  return await runProfileScraper(input, apifyToken);
}

module.exports = {
  runProfileScraper,
  extractCompanyUrl,
  scrapeProfile
};
