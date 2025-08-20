require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const { generateComment } = require('./services/chatgptService');
const { fetchRecordsFromView, updateRecord } = require('./services/airtableService');

const app = express();
const PORT = process.env.PORT || 3000;

// Utility: avoid printing full secrets in logs
function maskToken(token) {
    if (!token || typeof token !== 'string') return '';
    return token.length > 8 ? `${token.slice(0, 8)}...` : '***';
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET || 'change-me'));

// Simple auth middleware with signed cookie
const AUTH_USER = 'krishna';
const AUTH_PASS = 'maruti';
const LOGIN_PATHS = new Set(['/login', '/logout', '/public/login.html']);

function isAuthed(req) {
    try {
        return req.signedCookies && req.signedCookies.auth === 'ok';
    } catch {
        return false;
    }
}

// Public: login and static login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === AUTH_USER && password === AUTH_PASS) {
        res.cookie('auth', 'ok', { httpOnly: true, sameSite: 'lax', signed: true, secure: false, maxAge: 1000 * 60 * 60 * 8 });
        return res.redirect('/');
    }
    return res.redirect('/login?error=1');
});

app.post('/logout', (req, res) => {
    res.clearCookie('auth');
    res.redirect('/login');
});

// Protect everything else (APIs and static dashboard) except login
app.use((req, res, next) => {
    if (LOGIN_PATHS.has(req.path) || req.path.startsWith('/public/login')) return next();
    if (isAuthed(req)) return next();
    // Allow static assets needed by login page
    if (req.path.startsWith('/favicon') || req.path.startsWith('/robots.txt')) return next();
    return res.redirect('/login');
});

// Serve static after auth guard to protect dashboard
// Light cache control: disable cache for HTML so UI updates are visible immediately
app.use((req, res, next) => {
    if (req.method === 'GET') {
        if (req.path === '/' || req.path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store');
        } else if (/(\.css|\.js|\.png|\.jpg|\.svg|\.ico)$/i.test(req.path)) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
    next();
});
app.use(express.static(path.join(__dirname, '../public')));

// Global state for tracking scraping session
let scrapingProcess = null;
let scrapingStats = {
    leads: 0,
    total: 0,
    errors: 0,
    processed: 0,
    completed: false,
    logs: []
};

// Global state for tracking post scraping session
let postScrapingProcess = null;
let postScrapingStats = {
    posts: 0,
    total: 0,
    errors: 0,
    processed: 0,
    completed: false,
    logs: []
};
// Cooperative cancellation for post scraper
let postScrapingActive = false;
let postScrapingShouldStop = false;

// Global state for tracking ChatGPT processing session
let chatgptProcess = null;
let chatgptStats = {
    records: 0,
    total: 0,
    errors: 0,
    processed: 0,
    completed: false,
    logs: []
};

// API Routes

// Root - send to dashboard (index.html). Auth is enforced by the guard above.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Start scraping session
 */
app.post('/api/start-scraping', async (req, res) => {
    try {
        const config = req.body;
        
        // Validate configuration
        if (!config.cookies || !config.apifyToken || !config.contactCompassToken) {
            return res.status(400).json({ error: 'Missing required configuration' });
        }

        // Validate environment variables
        if (!process.env.GOOGLE_SPREADSHEET_URL || !process.env.AIRTABLE_TOKEN) {
            return res.status(500).json({ error: 'Missing required environment variables: GOOGLE_SPREADSHEET_URL or AIRTABLE_TOKEN' });
        }

        // Reset stats
        scrapingStats = {
            leads: 0,
            total: 0,
            errors: 0,
            processed: 0,
            completed: false,
            logs: []
        };
        // Create temporary environment file with configuration
        const envConfig = `
GOOGLE_SPREADSHEET_URL=${process.env.GOOGLE_SPREADSHEET_URL}
APIFY_PROFILE_TOKEN=${config.apifyToken}
APIFY_COOKIES_JSON='${JSON.stringify(config.cookies)}'
CONTACT_COMPASS_TOKEN=${config.contactCompassToken}
AIRTABLE_TOKEN=${process.env.AIRTABLE_TOKEN}
AIRTABLE_BASE_ID=${process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB'}
AIRTABLE_TABLE_NAME=${process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t'}
WEBHOOK_URL=${process.env.WEBHOOK_URL || 'https://hook.us2.make.com/qqvwiwch83ekvgtzmu3zyco5py2mdyjn'}
GOOGLE_SA_CLIENT_EMAIL=${process.env.GOOGLE_SA_CLIENT_EMAIL || ''}
GOOGLE_SA_PRIVATE_KEY='${(process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/'/g, "'\''")}'
GOOGLE_SA_KEY_FILE=${process.env.GOOGLE_SA_KEY_FILE || ''}
        `.trim();

        fs.writeFileSync('.env.temp', envConfig);

        addLog('🚀 Starting LinkedIn scraping process...', 'info');
        addLog('📊 Configuration applied (using environment variables for sensitive data)', 'success');
        addLog(`📋 Spreadsheet: ${process.env.GOOGLE_SPREADSHEET_URL ? 'Configured' : 'Not configured'}`, 'info');
        addLog(`🗃️ Airtable: ${process.env.AIRTABLE_TOKEN ? 'Configured' : 'Not configured'}`, 'info');

        // Start the scraping process
        scrapingProcess = spawn('node', ['index.js'], {
            env: { ...process.env, ...require('dotenv').parse(fs.readFileSync('.env.temp')) },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handle process output
        scrapingProcess.stdout.on('data', (data) => {
            const output = data.toString();
            parseScrapingOutput(output);
        });

        scrapingProcess.stderr.on('data', (data) => {
            const error = data.toString();
            addLog(`❌ Error: ${error}`, 'error');
            scrapingStats.errors++;
        });

        scrapingProcess.on('close', (code) => {
            addLog(`🏁 Scraping process completed with code ${code}`, code === 0 ? 'success' : 'error');
            scrapingStats.completed = true;
            scrapingProcess = null;
            
            // Clean up temp file
            try {
                fs.unlinkSync('.env.temp');
            } catch (e) {
                console.log('Temp file cleanup failed:', e.message);
            }
        });

        res.json({ status: 'started', message: 'Scraping process initiated successfully' });

    } catch (error) {
        console.error('Error starting scraping:', error);
        res.status(500).json({ error: 'Failed to start scraping process' });
    }
});

/**
 * Stop scraping session
 */
app.post('/api/stop-scraping', (req, res) => {
    if (scrapingProcess) {
        scrapingProcess.kill('SIGTERM');
        scrapingProcess = null;
        addLog('⏹️ Scraping process stopped by user', 'info');
        scrapingStats.completed = true;
    }
    
    res.json({ status: 'stopped', message: 'Scraping process stopped' });
});

/**
 * Get current status and stats
 */
app.get('/api/status', (req, res) => {
    // Get recent logs (last 10 entries)
    const recentLogs = scrapingStats.logs.slice(-10);
    
    res.json({
        ...scrapingStats,
        logs: recentLogs,
        isRunning: scrapingProcess !== null
    });
    
    // Clear sent logs to avoid duplication
    scrapingStats.logs = [];
});

/**
 * Start post scraping session (fire-and-forget; progress via /api/post-status)
 */
app.post('/api/start-post-scraping', async (req, res) => {
    try {
        const config = req.body || {};

        // Validate configuration
        if (!config.cookies || !config.apifyToken) {
            return res.status(400).json({ error: 'Missing required configuration' });
        }

        // Validate environment variables
        const missing = [];
        if (!process.env.AIRTABLE_TOKEN) missing.push('AIRTABLE_TOKEN');
        if (!process.env.AIRTABLE_BASE_ID) missing.push('AIRTABLE_BASE_ID');
        if (!process.env.AIRTABLE_TABLE_NAME && !process.env.AIRTABLE_POSTS_TABLE_NAME) missing.push('AIRTABLE_TABLE_NAME or AIRTABLE_POSTS_TABLE_NAME');
        if (!process.env.AIRTABLE_VIEW_ID) missing.push('AIRTABLE_VIEW_ID');
        if (missing.length) {
            return res.status(400).json({ error: 'Missing required environment variables', missing });
        }

        // Reset post scraping stats
        postScrapingStats = {
            posts: 0,
            total: 0,
            errors: 0,
            processed: 0,
            completed: false,
            logs: []
        };
    postScrapingShouldStop = false;
    postScrapingActive = true;

        addPostLog('🚀 Starting LinkedIn post scraping process...', 'info');
        addPostLog('📊 Fetching LinkedIn URLs from Airtable...', 'info');

        // Start background work
        setImmediate(() => runPostScrapingInBackground(config));
        return res.json({ status: 'started', message: 'Post scraping started in background' });

    } catch (error) {
        console.error('Error starting post scraping:', error);
        addPostLog(`❌ Error: ${error.message}`, 'error');
        postScrapingStats.errors++;
        postScrapingStats.completed = true;
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Environment readiness check for UI
 */
app.get('/api/env-check', (req, res) => {
    const postEnv = {
        AIRTABLE_TOKEN: !!process.env.AIRTABLE_TOKEN,
        AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_NAME: !!process.env.AIRTABLE_TABLE_NAME || !!process.env.AIRTABLE_POSTS_TABLE_NAME,
        AIRTABLE_VIEW_ID: !!process.env.AIRTABLE_VIEW_ID,
        WEBHOOK_URL: !!process.env.WEBHOOK_URL,
    };
    const postMissing = Object.entries(postEnv)
        .filter(([, ok]) => !ok)
        .map(([k]) => k === 'AIRTABLE_TABLE_NAME' ? 'AIRTABLE_TABLE_NAME or AIRTABLE_POSTS_TABLE_NAME' : k);

    const profileEnv = {
        GOOGLE_SPREADSHEET_URL: !!process.env.GOOGLE_SPREADSHEET_URL,
        AIRTABLE_TOKEN: !!process.env.AIRTABLE_TOKEN,
        AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_NAME: !!process.env.AIRTABLE_TABLE_NAME,
        WEBHOOK_URL: !!process.env.WEBHOOK_URL,
        GOOGLE_SA_AUTH: !!(process.env.GOOGLE_SA_CLIENT_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY) || !!process.env.GOOGLE_SA_KEY_FILE,
    };
    const profileMissing = Object.entries(profileEnv).filter(([, ok]) => !ok).map(([k]) => k);

    const chatgptEnv = {
        AIRTABLE_TOKEN: !!process.env.AIRTABLE_TOKEN,
        AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_NAME: !!process.env.AIRTABLE_TABLE_NAME,
        AIRTABLE_CHATGPT_VIEW_ID_or_AIRTABLE_VIEW_ID: !!(process.env.AIRTABLE_CHATGPT_VIEW_ID || process.env.AIRTABLE_VIEW_ID),
        CHATGPT_API_TOKEN: !!process.env.CHATGPT_API_TOKEN,
        CHATGPT_ASSISTANT_ID: !!process.env.CHATGPT_ASSISTANT_ID,
    };
    const chatgptMissing = Object.entries(chatgptEnv).filter(([, ok]) => !ok).map(([k]) => k);

    res.json({
        post: { ok: postMissing.length === 0, missing: postMissing },
        profile: { ok: profileMissing.length === 0, missing: profileMissing },
        chatgpt: { ok: chatgptMissing.length === 0, missing: chatgptMissing }
    });
});

/**
 * Airtable Upsert Self-Test
 * Query params: url (required), field (optional; defaults to AIRTABLE_UNIQUE_URL_FIELD or 'linkedinUrl')
 * Returns whether an update or insert would occur, with matched recordId if any.
 */
app.get('/api/airtable-selftest', async (req, res) => {
    try {
        const url = (req.query.url || '').trim();
        const field = (req.query.field || process.env.AIRTABLE_UNIQUE_URL_FIELD || 'linkedinUrl').trim();
        const token = process.env.AIRTABLE_TOKEN;
        const baseId = process.env.AIRTABLE_BASE_ID;
        const tableName = process.env.AIRTABLE_TABLE_NAME;

        const missing = [];
        if (!token) missing.push('AIRTABLE_TOKEN');
        if (!baseId) missing.push('AIRTABLE_BASE_ID');
        if (!tableName) missing.push('AIRTABLE_TABLE_NAME');
        if (!url) missing.push('url');
        if (!field) missing.push('field');
        if (missing.length) {
            return res.status(400).json({ ok: false, error: 'Missing parameters', missing });
        }

        const airtableService = require('./services/airtableService');
        const found = await airtableService.findRecordByUrl(token, baseId, tableName, field, url);
        if (found) {
            return res.json({ ok: true, mode: 'update', recordId: found.id, field, url, baseId, tableName });
        }
        return res.json({ ok: true, mode: 'insert', recordId: null, field, url, baseId, tableName });
    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
});

/**
 * Manual Profile Scraper - Process Run ID
 * POST body: { runId, apifyToken }
 * Fetches data from Apify and sends to Airtable
 */
app.post('/api/manual-profile-scraper', async (req, res) => {
    try {
        const { runId, apifyToken } = req.body || {};
        
        if (!runId || !apifyToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters: runId and apifyToken' 
            });
        }

        console.log(`🔧 Manual Profile Scraper: Processing Run ID=${runId}, token=${maskToken(apifyToken)}`);

        // Step 1: Get run details from Apify
        const runDetailsUrl = `https://api.apify.com/v2/actor-runs/${runId}`;
        console.log(`🌐 GET ${runDetailsUrl}?token=${maskToken(apifyToken)}`);
        const runResponse = await axios.get(runDetailsUrl, {
            params: { token: apifyToken },
            timeout: 30000
        });

        const runData = runResponse.data?.data;
        if (!runData) {
            throw new Error('Invalid response from Apify API');
        }

        console.log(`📊 Run Status: ${runData.status}`);
        console.log(`📊 Dataset ID: ${runData.defaultDatasetId}`);

        if (runData.status !== 'SUCCEEDED') {
            return res.json({ 
                success: false, 
                error: `Run not completed. Status: ${runData.status}`,
                runStatus: runData.status,
                datasetId: runData.defaultDatasetId || null
            });
        }

        const datasetId = runData.defaultDatasetId;
        if (!datasetId) {
            throw new Error('No datasetId returned from profile scraper run');
        }

        // Step 2: Get dataset items from Apify
        console.log(`🌐 GET https://api.apify.com/v2/datasets/${datasetId}/items?token=${maskToken(apifyToken)}&format=json`);
        const itemsResponse = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
            params: { token: apifyToken, format: 'json' },
            timeout: 30000
        });

        const items = Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
        if (items.length === 0) {
            throw new Error('No data returned from profile scraper');
        }

        console.log(`✅ Retrieved ${items.length} profile(s) from Apify`);
        try {
            const firstKeys = Object.keys(items[0] || {});
            console.log(`🔍 First item keys: ${firstKeys.join(', ')}`);
        } catch {}

        // Step 3: Process each profile and send to Airtable with duplicate checking and rate limiting
        const results = [];
        const airtableService = require('./services/airtableService');
        const { mapApifyResponseToAirtable, validateAirtableData } = require('./utils/apifyDataMapper');

        // Rate limiting: Max 4 requests/second (safe margin below Airtable's 5 req/s limit)
        const RATE_LIMIT_DELAY = 250; // 250ms between requests = 4 req/s
        
        // Track duplicate stats
        let duplicatesFound = 0;
        let newProfilesAdded = 0;
        let existingProfilesUpdated = 0;
        
        for (let i = 0; i < items.length; i++) {
            const profileData = items[i];
            try {
                console.log(`🔄 Processing profile ${i + 1}/${items.length}: ${profileData.firstName} ${profileData.lastName}`);

                // Map to Airtable format
                const airtableData = mapApifyResponseToAirtable(profileData, profileData.linkedinUrl || profileData.url);
                
                // Validate data
                const isValid = validateAirtableData(airtableData, ['firstName', 'lastName']);
                if (!isValid) {
                    console.warn(`⚠️ Profile ${i + 1} validation failed`);
                    results.push({ 
                        index: i, 
                        success: false, 
                        error: 'Data validation failed' 
                    });
                    continue;
                }

                // Check for duplicates using LinkedIn URL before sending to Airtable
                const urlField = process.env.AIRTABLE_UNIQUE_URL_FIELD || 'linkedinUrl';
                const urlValue = airtableData[urlField];
                
                if (!urlValue) {
                    console.warn(`⚠️ Profile ${i + 1} has no LinkedIn URL - skipping duplicate check`);
                    results.push({ 
                        index: i, 
                        success: false, 
                        error: 'No LinkedIn URL found for duplicate checking' 
                    });
                    continue;
                }

                // Check if profile already exists in Airtable
                console.log(`🔍 Checking for duplicate: ${urlValue}`);
                let existingRecord = null;
                try {
                    existingRecord = await airtableService.findRecordByUrl(
                        process.env.AIRTABLE_TOKEN,
                        process.env.AIRTABLE_BASE_ID,
                        process.env.AIRTABLE_TABLE_NAME,
                        urlField,
                        urlValue
                    );
                } catch (findError) {
                    console.warn(`⚠️ Error checking for duplicates: ${findError.message}`);
                    // Continue processing even if duplicate check fails
                }

                if (existingRecord) {
                    console.log(`🔄 Duplicate found for profile ${i + 1}: ${profileData.firstName} ${profileData.lastName} (Record ID: ${existingRecord.id})`);
                    duplicatesFound++;
                    
                    // Add to results as duplicate (not an error, just informational)
                    results.push({ 
                        index: i, 
                        success: true, 
                        profileName: `${profileData.firstName} ${profileData.lastName}`,
                        airtableAction: 'duplicate_skipped',
                        recordId: existingRecord.id,
                        isDuplicate: true,
                        duplicateMessage: `Profile already exists in Airtable (Record ID: ${existingRecord.id})`
                    });
                    
                    console.log(`⏭️ Skipping duplicate profile ${i + 1}`);
                    continue; // Skip to next profile
                }

                // No duplicate found - proceed with Airtable insertion/update
                console.log(`✅ No duplicate found - proceeding with Airtable insertion for profile ${i + 1}`);
                
                let airtableResult;
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount <= maxRetries) {
                    try {
                        // Always insert new record since we've confirmed it's not a duplicate
                        airtableResult = await airtableService.insertRecord(
                            airtableData,
                            process.env.AIRTABLE_TOKEN,
                            process.env.AIRTABLE_BASE_ID,
                            process.env.AIRTABLE_TABLE_NAME
                        );
                        
                        // Success - break out of retry loop
                        break;
                        
                    } catch (airtableError) {
                        retryCount++;
                        
                        if (airtableError.response?.status === 429) {
                            // Rate limit exceeded - wait longer
                            const waitTime = Math.max(30000, retryCount * 30000); // 30s, 60s, 90s
                            console.log(`⏳ Rate limit (429) hit for profile ${i + 1}. Waiting ${waitTime/1000}s before retry ${retryCount}/${maxRetries}`);
                            
                            if (retryCount <= maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, waitTime));
                                continue;
                            } else {
                                throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
                            }
                        } else if (retryCount <= maxRetries) {
                            // Other error - wait a bit and retry
                            const waitTime = retryCount * 2000; // 2s, 4s, 6s
                            console.log(`⚠️ Airtable error for profile ${i + 1}. Retrying in ${waitTime/1000}s (${retryCount}/${maxRetries})`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                            continue;
                        } else {
                            // Max retries reached
                            throw airtableError;
                        }
                    }
                }

                // Track success stats
                if (airtableResult.action === 'inserted') {
                    newProfilesAdded++;
                } else if (airtableResult.action === 'updated') {
                    existingProfilesUpdated++;
                }

                results.push({ 
                    index: i, 
                    success: true, 
                    profileName: `${profileData.firstName} ${profileData.lastName}`,
                    airtableAction: airtableResult.action || 'inserted',
                    recordId: airtableResult.record?.id || 'n/a',
                    isDuplicate: false
                });

                console.log(`✅ Profile ${i + 1} processed successfully (${airtableResult.action})`);

                // Rate limiting delay between requests (except for the last one)
                if (i < items.length - 1) {
                    console.log(`⏱️ Rate limiting: Waiting ${RATE_LIMIT_DELAY}ms before next request...`);
                    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                }

            } catch (profileError) {
                console.error(`❌ Error processing profile ${i + 1}:`, profileError.message);
                results.push({ 
                    index: i, 
                    success: false, 
                    error: profileError.message 
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        const duplicateCount = results.filter(r => r.isDuplicate).length;
        const newProfilesCount = results.filter(r => r.success && !r.isDuplicate).length;

        console.log(`🎉 Manual Profile Scraper completed: ${successCount} success, ${errorCount} errors, ${duplicateCount} duplicates skipped`);

        return res.json({
            success: true,
            message: `Processed ${items.length} profile(s): ${newProfilesCount} new, ${duplicateCount} duplicates skipped, ${errorCount} errors`,
            runStatus: 'SUCCEEDED',
            datasetId,
            itemsCount: items.length,
            firstItemKeys: Object.keys(items[0] || {}),
            totalProfiles: items.length,
            successCount,
            errorCount,
            duplicateCount,
            newProfilesCount,
            duplicatesFound,
            newProfilesAdded,
            existingProfilesUpdated,
            results
        });

    } catch (error) {
        const statusCode = error.response?.status || 500;
        const apiMessage = error.response?.data?.error || error.response?.data?.message;
        console.error(`❌ Manual Profile Scraper error (${statusCode}):`, error.message);
        if (apiMessage) console.error('   ↳ API says:', apiMessage);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            statusCode,
            apifyMessage: apiMessage || null
        });
    }
});

async function runPostScrapingInBackground(config) {
    const airtableService = require('./services/airtableService');
    const axios = require('axios');
    const webhookService = require('./services/webhookService');
    try {
        const viewId = process.env.AIRTABLE_VIEW_ID;
        const sourceTable = process.env.AIRTABLE_TABLE_NAME || process.env.AIRTABLE_POSTS_TABLE_NAME; // prefer source table
        const updateTable = sourceTable; // update the same table (same record id)

        addPostLog(`🔎 Using Airtable view: ${viewId}`, 'info');
        addPostLog(`🗂️ Source Airtable table: ${sourceTable}`, 'info');
        addPostLog(`🔧 Base: ${process.env.AIRTABLE_BASE_ID}, Table: ${sourceTable}, View: ${viewId}`, 'info');

        // Fetch records with ids and URLs
        const records = await airtableService.fetchUrlRecordsFromView(
            process.env.AIRTABLE_TOKEN,
            process.env.AIRTABLE_BASE_ID,
            sourceTable,
            viewId
        );

        if (records.length === 0) {
            throw new Error('No records with LinkedIn URLs found in the specified Airtable view');
        }

        postScrapingStats.total = records.length;
        addPostLog(`✅ Found ${records.length} records with LinkedIn URLs`, 'success');

        const actorId = process.env.APIFY_POST_ACTOR || 'curious_coder~linkedin-post-search-scraper';
        const fldUrl = process.env.AIRTABLE_POST_URL_FIELD || 'Post URL';
        const fldText = process.env.AIRTABLE_POST_TEXT_FIELD || 'Post Text';
        const fldDate = process.env.AIRTABLE_POST_DATE_FIELD || 'Posted On';

        // Process sequentially, one record at a time
        for (let i = 0; i < records.length; i++) {
            if (postScrapingShouldStop) {
                addPostLog('⏹️ Stop requested. Exiting before processing next record.', 'warning');
                break;
            }
            const rec = records[i];
            addPostLog(`🔄 [${i + 1}/${records.length}] Processing record ${rec.id} (${rec.url})`, 'info');
            try {
                // Prepare Apify input for a single URL
                const startRunUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${config.apifyToken}`;
                const apifyPayload = {
                    cookie: config.cookies,
                    deepScrape: (typeof config.deepScrape === 'boolean') ? config.deepScrape : true,
                    limitPerSource: config.maxPosts || 1,
                    maxDelay: 8,
                    minDelay: 2,
                    proxy: { useApifyProxy: true, apifyProxyCountry: 'US' },
                    rawData: false,
                    urls: [rec.url]
                };

                // Run actor
                let datasetId = null;
                let runId = null;
                try {
                    // Start the run
                    const startResp = await axios.post(startRunUrl, apifyPayload, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 120000
                    });
                    runId = startResp.data?.data?.id || startResp.data?.id;
                    if (runId) {
                        addPostLog(`🏃 Started run: ${runId}`,'info');
                    }
                    if (!runId) {
                        addPostLog(`⚠️ No runId returned for ${rec.id}; will fetch items via fallback endpoint`, 'warning');
                    }

                    // Poll run until finished to obtain datasetId and logs
                    if (runId) {
                        const runInfoUrl = `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${config.apifyToken}`;
                        let status = 'STARTED';
                        let attempts = 0;
                        const maxAttempts = 60; // ~2 minutes at 2s
                        while (attempts < maxAttempts) {
                            attempts++;
                            try {
                                const ri = await axios.get(runInfoUrl, { timeout: 30000 });
                                status = ri.data?.data?.status || status;
                                datasetId = ri.data?.data?.defaultDatasetId || datasetId;
                                if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
                                    break;
                                }
                            } catch (e) {
                                console.warn('ℹ️ Poll run info failed:', e.response?.status, e.message);
                            }
                            await new Promise(r => setTimeout(r, 2000));
                        }
                        addPostLog(`⏳ Run status: ${status?.toLowerCase?.() || status} (attempt ${attempts}/${maxAttempts})`, 'info');
                        // If run succeeded but datasetId still missing, try a few more quick polls
                        if (!datasetId && (status === 'SUCCEEDED' || status === 'COMPLETED')) {
                            for (let extra = 1; extra <= 5 && !datasetId; extra++) {
                                try {
                                    const ri2 = await axios.get(runInfoUrl, { timeout: 15000 });
                                    datasetId = ri2.data?.data?.defaultDatasetId || datasetId;
                                } catch {}
                                if (!datasetId) await new Promise(r => setTimeout(r, 1000));
                            }
                        }
                        addPostLog(`🗂️ Dataset for ${rec.id}: ${datasetId || 'not provided'} (run: ${runId})`, datasetId ? 'info' : 'warning');
                        // If datasetId still missing, stop scraping and notify webhook
                        if (!datasetId) {
                            try {
                                await webhookService.triggerWebhook({
                                    type: 'post_error',
                                    phase: 'dataset-missing',
                                    recordId: rec.id,
                                    url: rec.url,
                                    runId,
                                    error: 'No datasetId returned from Apify run',
                                    apifyErrorMessage: 'No datasetId returned from Apify run',
                                    timestamp: new Date().toISOString()
                                }, process.env.WEBHOOK_URL);
                            } catch {}
                            addPostLog(`⛔ No datasetId returned for ${rec.id}. Stopping post scraping.`, 'error');
                            postScrapingStats.completed = true;
                            postScrapingActive = false;
                            return;
                        }

                        // Fetch run log and detect Apify warnings (e.g., redirected 10 times)
                        try {
                            const logRes = await axios.get(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}/log`, {
                                params: { token: config.apifyToken, stream: 0 },
                                responseType: 'text',
                                transformResponse: [d => d],
                                timeout: 120000
                            });
                            const logText = typeof logRes.data === 'string' ? logRes.data : String(logRes.data || '');
                            const warnMatch = logText.match(/redirected\s+10\s+times\b|too\s+many\s+redirects|not\s+logged\s+in|login\s+required|unauthorized|forbidden|\b401\b|\b403\b|cookie|li_at|session\s+expired/i);
                            if (warnMatch) {
                                const webhookService = require('./services/webhookService');
                                const details = {
                                    type: 'post_warning',
                                    message: `Apify warning detected: ${warnMatch[0]}`,
                                    recordId: rec.id,
                                    url: rec.url,
                                    runId,
                                    logTail: logText.split('\n').slice(-120).join('\n'),
                                    timestamp: new Date().toISOString()
                                };
                                await webhookService.triggerWebhook(details, process.env.WEBHOOK_URL);
                                addPostLog(`⚠️ Warning detected for ${rec.id}: ${warnMatch[0]}. Stopping.`, 'warning');
                                // Stop entire post scraping loop
                                postScrapingStats.completed = true;
                                postScrapingActive = false;
                                return;
                            }
                        } catch (e) {
                            console.warn('⚠️ Could not fetch post run log for warnings:', e.message);
                        }
                    }
                } catch (apifyErr) {
                    const status = apifyErr.response?.status;
                    const data = apifyErr.response?.data;
                    console.error('❌ Apify run-sync failed:', status, JSON.stringify(data));
                    addPostLog(`❌ Apify run failed for ${rec.id} ${status || ''}: ${data?.error || apifyErr.message}`.trim(), 'error');
                    // Notify webhook about Apify run error
                    try {
                        await webhookService.triggerWebhook({
                            type: 'post_error',
                            phase: 'start-run',
                            recordId: rec.id,
                            url: rec.url,
                            status,
                            error: data?.error?.message || apifyErr.message,
                            apifyErrorMessage: data?.error?.message || apifyErr.message,
                            raw: data || null,
                            timestamp: new Date().toISOString()
                        }, process.env.WEBHOOK_URL);
                    } catch {}
                    // Stop the entire session on any run start error
                    if (status === 401 || status === 403) {
                        try {
                            await webhookService.triggerWebhook({
                                type: 'post_warning',
                                message: `Authentication failure (${status}). Cookies may be expired.`,
                                recordId: rec.id,
                                url: rec.url,
                                status,
                                raw: data || null,
                                timestamp: new Date().toISOString()
                            }, process.env.WEBHOOK_URL);
                        } catch {}
                        addPostLog(`⚠️ Auth failure for ${rec.id} (${status}). Stopping.`, 'warning');
                    }
                    postScrapingStats.errors++;
                    postScrapingStats.completed = true;
                    postScrapingActive = false;
                    return;
                }

                // Fetch items for this run
                let items = [];
                try {
                    const itemsUrl = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${config.apifyToken}&format=json`;
                    const itemsResp = await axios.get(itemsUrl, { timeout: 300000 });
                    items = Array.isArray(itemsResp.data) ? itemsResp.data : [];
                    addPostLog(`📥 Retrieved ${items.length} items for ${rec.id} from dataset ${datasetId}`, 'info');
                } catch (itemsErr) {
                    const status = itemsErr.response?.status;
                    const data = itemsErr.response?.data;
                    console.error('❌ Failed to fetch dataset items:', status, JSON.stringify(data));
                    addPostLog(`❌ Items fetch failed for ${rec.id} ${status || ''}: ${data?.error || itemsErr.message}`.trim(), 'error');
                    // Notify webhook about items fetch error
                    try {
                        await webhookService.triggerWebhook({
                            type: 'post_error',
                            phase: 'items-fetch',
                            recordId: rec.id,
                            url: rec.url,
                            datasetId,
                            status,
                            error: data?.error?.message || itemsErr.message,
                            apifyErrorMessage: data?.error?.message || itemsErr.message,
                            raw: data || null,
                            timestamp: new Date().toISOString()
                        }, process.env.WEBHOOK_URL);
                    } catch {}
                    postScrapingStats.errors++;
                    postScrapingStats.completed = true;
                    postScrapingActive = false;
                    return;
                }

                // Select first post (if any) and update the same record
                const first = items[0];
                if (!first) {
                    // No output from Apify; stop and notify
                    try {
                        await webhookService.triggerWebhook({
                            type: 'post_error',
                            phase: 'no-output',
                            recordId: rec.id,
                            url: rec.url,
                            runId,
                            datasetId,
                            error: 'No items returned from Apify dataset',
                            apifyErrorMessage: 'No items returned from Apify dataset',
                            timestamp: new Date().toISOString()
                        }, process.env.WEBHOOK_URL);
                    } catch {}
                    addPostLog(`⛔ No items returned for ${rec.id}. Stopping post scraping.`, 'error');
                    postScrapingStats.completed = true;
                    postScrapingActive = false;
                    return;
                } else {
                    const updates = {};
                    updates[fldUrl] = first.url || '';
                    updates[fldText] = first.text || '';
                    updates[fldDate] = first.postedAtISO ? new Date(first.postedAtISO).toISOString().split('T')[0] : (first.date || '');

                    try {
                        await airtableService.updateRecord(
                            rec.id,
                            updates,
                            process.env.AIRTABLE_TOKEN,
                            process.env.AIRTABLE_BASE_ID,
                            updateTable
                        );
                        postScrapingStats.posts++;
                        addPostLog(`✅ Updated record ${rec.id} with latest post`, 'success');
                    } catch (saveErr) {
                        console.error(`❌ Error updating record ${rec.id}:`, saveErr);
                        postScrapingStats.errors++;
                        addPostLog(`❌ Airtable update failed for ${rec.id}: ${saveErr.message}`, 'error');
                        // Notify webhook about Airtable update error
                        try {
                            await webhookService.triggerWebhook({
                                type: 'post_error',
                                phase: 'airtable-update',
                                recordId: rec.id,
                                url: rec.url,
                                error: saveErr.message,
                                apifyErrorMessage: saveErr.message,
                                timestamp: new Date().toISOString()
                            }, process.env.WEBHOOK_URL);
                        } catch {}
                        // Stop on Airtable failure as requested
                        postScrapingStats.completed = true;
                        postScrapingActive = false;
                        return;
                    }
                }

                // Mark processed and wait to respect rate limits (20s between records)
                postScrapingStats.processed++;
                await new Promise(r => setTimeout(r, 20000));
            } catch (err) {
                postScrapingStats.errors++;
                addPostLog(`❌ Unexpected error for ${rec.id}: ${err.message}`, 'error');
                // Notify webhook about unexpected per-record error
                try {
                    await webhookService.triggerWebhook({
                        type: 'post_error',
                        phase: 'unexpected',
                        recordId: rec.id,
                        url: rec.url,
                        error: err.message,
                        apifyErrorMessage: err.message,
                        timestamp: new Date().toISOString()
                    }, process.env.WEBHOOK_URL);
                } catch {}
                // Stop entire session on unexpected error
                postScrapingStats.completed = true;
                postScrapingActive = false;
                return;
    }

    // end for-loop over records
    }

    postScrapingStats.completed = true;
    postScrapingActive = false;
        addPostLog(`🎉 Completed. Processed ${postScrapingStats.processed}/${postScrapingStats.total}. Updated: ${postScrapingStats.posts}. Errors: ${postScrapingStats.errors}`, 'success');
    } catch (err) {
        console.error('Error in background post scraping:', err);
        addPostLog(`❌ Error: ${err.message}`, 'error');
    postScrapingStats.errors++;
    postScrapingStats.completed = true;
    postScrapingActive = false;
        // Notify webhook about top-level error
        try {
            await webhookService.triggerWebhook({
                type: 'post_error',
                phase: 'top-level',
                error: err.message,
                apifyErrorMessage: err.message,
                timestamp: new Date().toISOString()
            }, process.env.WEBHOOK_URL);
        } catch {}
    }
}

/**
 * Stop post scraping session
 */
app.post('/api/stop-post-scraping', (req, res) => {
    postScrapingShouldStop = true;
    addPostLog('⏹️ Stop requested by user. Will stop after current operation.', 'info');
    return res.json({ status: 'stopping', message: 'Stop requested' });
});

/**
 * Get current post scraping status
 */
app.get('/api/post-status', (req, res) => {
    const recentLogs = postScrapingStats.logs.slice(-10);
    res.json({
        ...postScrapingStats,
        logs: recentLogs,
    isRunning: postScrapingActive
    });
    // Clear sent logs to avoid duplication
    postScrapingStats.logs = [];
});

/**
 * Start ChatGPT comment generation
 */
app.post('/api/start-chatgpt', async (req, res) => {
    try {
        // Get configuration from environment variables
        const config = {
            airtableToken: process.env.AIRTABLE_TOKEN,
            baseId: process.env.AIRTABLE_BASE_ID,
            tableName: process.env.AIRTABLE_TABLE_NAME,
            viewId: process.env.AIRTABLE_CHATGPT_VIEW_ID || process.env.AIRTABLE_VIEW_ID,
            chatgptToken: process.env.CHATGPT_API_TOKEN,
            assistantId: process.env.CHATGPT_ASSISTANT_ID
        };
        
        // Validate configuration from environment
        const missingVars = [];
        if (!config.airtableToken) missingVars.push('AIRTABLE_TOKEN');
        if (!config.baseId) missingVars.push('AIRTABLE_BASE_ID');
        if (!config.tableName) missingVars.push('AIRTABLE_TABLE_NAME');
    if (!config.viewId) missingVars.push('AIRTABLE_CHATGPT_VIEW_ID or AIRTABLE_VIEW_ID');
        if (!config.chatgptToken) missingVars.push('CHATGPT_API_TOKEN');
        if (!config.assistantId) missingVars.push('CHATGPT_ASSISTANT_ID');
        
        if (missingVars.length > 0) {
            return res.status(400).json({ 
                error: `Missing environment variables: ${missingVars.join(', ')}` 
            });
        }

        // Reset stats
        chatgptStats = {
            records: 0,
            total: 0,
            errors: 0,
            processed: 0,
            completed: false,
            logs: []
        };

        // Add log helper
        function addChatGPTLog(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = { timestamp, message, type };
            chatgptStats.logs.push(logEntry);
            console.log(`[${timestamp}] ${message}`);
        }

        addChatGPTLog('🤖 Starting ChatGPT comment generation...', 'success');

        // Start processing in background
        chatgptProcess = true;
        processChatGPTComments(config, addChatGPTLog);

        res.json({ message: 'ChatGPT processing started successfully' });

    } catch (error) {
        console.error('Error starting ChatGPT processing:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get ChatGPT processing status
 */
app.get('/api/chatgpt-status', (req, res) => {
    // Get recent logs (last 10 entries)
    const recentLogs = chatgptStats.logs.slice(-10);
    
    res.json({
        ...chatgptStats,
        logs: recentLogs,
        isRunning: chatgptProcess !== null
    });
    
    // Clear sent logs to avoid duplication
    chatgptStats.logs = [];
});

/**
 * Process ChatGPT comments for all records
 */
async function processChatGPTComments(config, addLog) {
    try {
        addLog('📋 Fetching records from Airtable...', 'info');
        
        // Fetch records from the specified view
        const records = await fetchRecordsFromView(
            config.airtableToken,
            config.baseId,
            config.tableName,
            config.viewId,
            ['firstName', 'Post Text']
        );

        chatgptStats.total = records.length;
        addLog(`📊 Found ${records.length} records to process`, 'info');

        if (records.length === 0) {
            addLog('ℹ️ No records found to process', 'warning');
            chatgptStats.completed = true;
            chatgptProcess = null;
            return;
        }

        // Process each record
        for (let i = 0; i < records.length; i++) {
            if (chatgptProcess === null) {
                addLog('⏹️ Processing stopped by user', 'warning');
                break;
            }

            const record = records[i];
            const firstName = record.fields.firstName || 'User';
            const postText = record.fields['Post Text'] || '';

            try {
                addLog(`🤖 Processing ${i + 1}/${records.length}: ${firstName}`, 'info');
                
                // Generate comment using ChatGPT
                const generatedComment = await generateComment(
                    firstName,
                    postText,
                    config.chatgptToken,
                    config.assistantId
                );

                // Update the record with generated comment
                await updateRecord(
                    record.id,
                    { 'Generated Comment': generatedComment },
                    config.airtableToken,
                    config.baseId,
                    config.tableName
                );

                chatgptStats.processed++;
                chatgptStats.records++;
                addLog(`✅ Generated comment for ${firstName}`, 'success');

                // Add delay between requests to be respectful
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                chatgptStats.errors++;
                addLog(`❌ Error processing ${firstName}: ${error.message}`, 'error');
                console.error(`Error processing record ${record.id}:`, error);
            }
        }

        addLog(`🎉 ChatGPT processing completed! Processed: ${chatgptStats.processed}, Errors: ${chatgptStats.errors}`, 'success');
        chatgptStats.completed = true;

    } catch (error) {
        addLog(`❌ Fatal error in ChatGPT processing: ${error.message}`, 'error');
        console.error('Fatal error in ChatGPT processing:', error);
        chatgptStats.errors++;
    } finally {
        chatgptProcess = null;
    }
}

/**
 * Parse scraping output and update stats
 */
function parseScrapingOutput(output) {
    const lines = output.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
        // Parse different types of output
        if (line.includes('Processing') && line.includes('profiles')) {
            const match = line.match(/Processing (\d+) profiles/);
            if (match) {
                scrapingStats.total = parseInt(match[1]);
                addLog(`📊 Found ${scrapingStats.total} profiles to process`, 'info');
            }
        }
        
        if (line.includes('Processing profile')) {
            const match = line.match(/Processing profile (\d+)\/(\d+)/);
            if (match) {
                scrapingStats.processed = parseInt(match[1]);
                scrapingStats.total = parseInt(match[2]);
                addLog(`🔄 Processing profile ${match[1]}/${match[2]}`, 'info');
            }
        }
        
        if (line.includes('Successfully inserted record with ID:')) {
            scrapingStats.leads++;
            addLog('✅ Lead successfully added to Airtable', 'success');
        }
        
        if (line.includes('Error processing profile')) {
            scrapingStats.errors++;
            addLog('❌ Error processing profile', 'error');
        }
        
        if (line.includes('Found') && line.includes('"To Do" items')) {
            const match = line.match(/Found (\d+) "To Do" items/);
            if (match) {
                scrapingStats.total = parseInt(match[1]);
                addLog(`🎯 Found ${scrapingStats.total} "To Do" items to process`, 'info');
            }
        }
        
        // Add other significant log messages
        if (line.includes('🚀') || line.includes('✅') || line.includes('❌') || line.includes('📊')) {
            const logType = line.includes('❌') ? 'error' : 
                           line.includes('✅') ? 'success' : 'info';
            addLog(line.trim(), logType);
        }
    });
}

/**
 * Add log entry with timestamp
 */
function addLog(message, type = 'info') {
    const timestamp = new Date().toISOString();
    scrapingStats.logs.push({
        timestamp,
        message,
        type
    });
    
    // Keep only last 100 logs
    if (scrapingStats.logs.length > 100) {
        scrapingStats.logs = scrapingStats.logs.slice(-100);
    }
    
    console.log(`[${timestamp}] ${message}`);
}

/**
 * Add post log entry with timestamp
 */
function addPostLog(message, type = 'info') {
    const timestamp = new Date().toISOString();
    postScrapingStats.logs.push({
        timestamp,
        message,
        type
    });
    
    // Keep only last 100 logs
    if (postScrapingStats.logs.length > 100) {
        postScrapingStats.logs = postScrapingStats.logs.slice(-100);
    }
    
    console.log(`[POST] [${timestamp}] ${message}`);
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        isRunning: scrapingProcess !== null
    });
});

// (duplicate root route removed)

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    if (scrapingProcess) {
        scrapingProcess.kill('SIGTERM');
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    if (scrapingProcess) {
        scrapingProcess.kill('SIGTERM');
    }
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🌐 LinkedIn Scraper Dashboard running at http://localhost:${PORT}`);
    console.log('📊 Open your browser and navigate to the URL above to access the dashboard');
    addLog('🚀 Server started successfully', 'success');
    addLog('💡 Ready to accept scraping configurations', 'info');
});

module.exports = app;
