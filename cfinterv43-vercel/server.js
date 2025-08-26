require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const { generateComment } = require('./services/chatgptService');
const { fetchRecordsFromView, updateRecord } = require('./services/airtableService');

// Hardcoded Airtable credentials for testing
const AIRTABLE_CREDENTIALS = {
    AIRTABLE_TOKEN: 'patFClficxpGIUnJF.be5a51a7e3fabe7337cd2cb13dc3f10234fc52d8a1f60e012eb68be7b2fcc982',
    AIRTABLE_BASE_ID: 'appD9VxZrOhiQY9VB',
    AIRTABLE_TABLE_NAME: 'tblyhMPmCt87ORo3t',
    AIRTABLE_VIEW_ID: 'viw4Cfi8IczC1HStD',
    // Add separate spreadsheet table for marking rows as "Done"
    AIRTABLE_SPREADSHEET_TABLE: 'tblyhMPmCt87ORo3t', // Use same table for now, but with different view
    AIRTABLE_SPREADSHEET_VIEW: 'viw4Cfi8IczC1HStD',  // Use same view for now
    // Status field configuration
    AIRTABLE_DONE_FIELD: 'Last Action Stage',           // Field to update for completion status
    AIRTABLE_DONE_VALUE: 'Profile Scraped'              // Value to set when profile is processed
};

// Override environment variables with hardcoded values
process.env.AIRTABLE_TOKEN = AIRTABLE_CREDENTIALS.AIRTABLE_TOKEN;
process.env.AIRTABLE_BASE_ID = AIRTABLE_CREDENTIALS.AIRTABLE_BASE_ID;
process.env.AIRTABLE_TABLE_NAME = AIRTABLE_CREDENTIALS.AIRTABLE_TABLE_NAME;
process.env.AIRTABLE_VIEW_ID = AIRTABLE_CREDENTIALS.AIRTABLE_VIEW_ID;
process.env.AIRTABLE_SPREADSHEET_TABLE = AIRTABLE_CREDENTIALS.AIRTABLE_SPREADSHEET_TABLE;
process.env.AIRTABLE_SPREADSHEET_VIEW = AIRTABLE_CREDENTIALS.AIRTABLE_SPREADSHEET_VIEW;
process.env.AIRTABLE_DONE_FIELD = AIRTABLE_CREDENTIALS.AIRTABLE_DONE_FIELD;
process.env.AIRTABLE_DONE_VALUE = AIRTABLE_CREDENTIALS.AIRTABLE_DONE_VALUE;

/**
 * Mask sensitive tokens for logging
 */
function maskToken(token) {
    if (!token || typeof token !== 'string') return '***';
    if (token.length <= 8) return '***';
    return token.substring(0, 4) + '***' + token.substring(token.length - 4);
}

/**
 * Format date for Airtable compatibility
 * Airtable expects dates in YYYY-MM-DD format
 */
function formatDateForAirtable(dateInput) {
    if (!dateInput) return '';
    
    try {
        // Handle various date formats
        let date;
        
        if (typeof dateInput === 'string') {
            // Try parsing ISO string first
            if (dateInput.includes('T') || dateInput.includes('Z')) {
                date = new Date(dateInput);
            } else if (dateInput.includes('-')) {
                // Already in YYYY-MM-DD format
                return dateInput;
            } else if (dateInput.includes('/')) {
                // Handle MM/DD/YYYY or DD/MM/YYYY format
                date = new Date(dateInput);
            } else {
                // Try parsing as timestamp
                date = new Date(parseInt(dateInput));
            }
        } else if (typeof dateInput === 'number') {
            // Handle timestamp
            date = new Date(dateInput);
        } else {
            date = new Date(dateInput);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn(`⚠️ Invalid date format: ${dateInput}`);
            return '';
        }
        
        // Format as YYYY-MM-DD for Airtable
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.warn(`⚠️ Error formatting date ${dateInput}:`, error.message);
        return '';
    }
}

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = !!process.env.VERCEL;
const BACKEND_URL = process.env.BACKEND_URL || '';

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
        res.cookie('auth', 'ok', { httpOnly: true, sameSite: 'lax', signed: true, secure: false, maxAge: 1000 * 60 * 60 * 3 });
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
    // For serverless environments (e.g., Vercel), ensure we don't fall through to static index
    if (req.path === '/' || req.path.startsWith('/public/index.html')) {
        return res.redirect('/login');
    }
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

// Root - send to dashboard (dashboard.html). Auth is enforced by the guard above.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/dashboard.html'));
});

// Multi-page application routes
app.get('/post-scraper', (req, res) => {
    res.sendFile(path.join(__dirname, './public/post-scraper.html'));
});

app.get('/post-import', (req, res) => {
    res.sendFile(path.join(__dirname, './public/post-import.html'));
});

app.get('/chatgpt', (req, res) => {
    res.sendFile(path.join(__dirname, './public/chatgpt.html'));
});

// Serve static files AFTER custom routes to prevent conflict with index.html
app.use(express.static(path.join(__dirname, './public')));

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

/**
 * Start scraping session
 */
app.post('/api/start-scraping', async (req, res) => {
    try {
        // In serverless (Vercel) we can't run long-lived child processes; proxy to external backend if configured
        if (IS_VERCEL) {
            if (BACKEND_URL) {
                try {
                    const response = await axios.post(`${BACKEND_URL}/api/start-scraping`, req.body, { timeout: 300000 });
                    return res.status(response.status).json(response.data);
                } catch (err) {
                    const status = err.response?.status || 500;
                    const data = err.response?.data || { error: err.message };
                    return res.status(status).json(data);
                }
            }
            return res.status(400).json({
                error: 'Scraping cannot start on Vercel serverless environment. Configure BACKEND_URL to a persistent server and redeploy.'
            });
        }

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
        `.trim();

        fs.writeFileSync('.env.temp', envConfig);

        addLog('🚀 Starting LinkedIn scraping process...', 'info');
        addLog('📊 Configuration applied (using environment variables for sensitive data)', 'success');
        addLog(`📋 Spreadsheet: ${process.env.GOOGLE_SPREADSHEET_URL ? 'Configured' : 'Not configured'}`, 'info');
        addLog(`🗃️ Airtable: ${process.env.AIRTABLE_TOKEN ? 'Configured' : 'Not configured'}`, 'info');

    // Start the scraping process (only on persistent/serverful environments)
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
    res.status(500).json({ error: 'Failed to start scraping process', details: error.message });
    }
});

/**
 * Stop scraping session
 */
app.post('/api/stop-scraping', (req, res) => {
    // Proxy in Vercel if configured
    if (IS_VERCEL && BACKEND_URL) {
        return axios.post(`${BACKEND_URL}/api/stop-scraping`).then(r => {
            res.status(r.status).json(r.data);
        }).catch(err => {
            const status = err.response?.status || 500;
            const data = err.response?.data || { error: err.message };
            res.status(status).json(data);
        });
    }
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
    // Proxy in Vercel if configured
    if (IS_VERCEL && BACKEND_URL) {
        return axios.get(`${BACKEND_URL}/api/status`).then(r => {
            res.status(r.status).json(r.data);
        }).catch(err => {
            const status = err.response?.status || 500;
            const data = err.response?.data || { error: err.message };
            res.status(status).json(data);
        });
    }
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
 * Start post scraping session
 */
app.post('/api/start-post-scraping', async (req, res) => {
    try {
        if (IS_VERCEL && BACKEND_URL) {
            try {
                const response = await axios.post(`${BACKEND_URL}/api/start-post-scraping`, req.body, { timeout: 300000 });
                return res.status(response.status).json(response.data);
            } catch (err) {
                const status = err.response?.status || 500;
                const data = err.response?.data || { error: err.message };
                return res.status(status).json(data);
            }
        } else if (IS_VERCEL && !BACKEND_URL) {
            return res.status(400).json({ error: 'Post scraping is not supported on Vercel. Configure BACKEND_URL.' });
        }

        const config = req.body;
        
        // Validate configuration
        if (!config.cookies || !config.apifyToken) {
            return res.status(400).json({ error: 'Missing required configuration' });
        }

        // Validate environment variables
        if (!process.env.AIRTABLE_TOKEN) {
            return res.status(500).json({ error: 'Missing required environment variables: AIRTABLE_TOKEN' });
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

        addPostLog('🚀 Starting LinkedIn post scraping process...', 'info');
        addPostLog('📊 Fetching LinkedIn URLs from Airtable...', 'info');

        // Fetch LinkedIn URLs from Airtable using the specific view
        const airtableService = require('./services/airtableService');
        const axios = require('axios');
        
        try {
            // Fetch LinkedIn URLs from the specific view
            const linkedinUrls = await airtableService.fetchUrlsFromView(
                process.env.AIRTABLE_TOKEN,
                process.env.AIRTABLE_BASE_ID,
                process.env.AIRTABLE_TABLE_NAME,
                'viweMZlXNZMoyE5kL'
            );

            if (linkedinUrls.length === 0) {
                throw new Error('No LinkedIn URLs found in the specified Airtable view');
            }

            addPostLog(`✅ Found ${linkedinUrls.length} LinkedIn URLs from Airtable`, 'success');
            postScrapingStats.total = linkedinUrls.length;

            // Construct Apify API URL and payload
            const apifyBuildParam = config.apifyBuild ? `&build=${encodeURIComponent(config.apifyBuild)}` : '';
            const apifyUrl = `https://api.apify.com/v2/acts/curious_coder~linkedin-post-search-scraper/run-sync-get-dataset-items?token=${config.apifyToken}${apifyBuildParam}`;
            
            const apifyPayload = {
                "cookie": config.cookies,
                "deepScrape": config.deepScrape || true,
                "limitPerSource": config.maxPosts || 1,
                "maxDelay": 8,
                "minDelay": 2,
                "proxy": {
                    "useApifyProxy": true,
                    "apifyProxyCountry": "US"
                },
                "rawData": false,
                "urls": linkedinUrls
            };

            addPostLog('📡 Sending request to Apify post scraper...', 'info');
            addPostLog(`🎯 Processing ${linkedinUrls.length} LinkedIn URLs...`, 'info');

            // Make request to Apify API
            const response = await axios.post(apifyUrl, apifyPayload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 600000 // 10 minutes timeout for large datasets
            });

            const posts = response.data || [];
            postScrapingStats.posts = posts.length;
            postScrapingStats.processed = linkedinUrls.length;

            addPostLog(`✅ Successfully scraped ${posts.length} posts from ${linkedinUrls.length} profiles`, 'success');

            // Save posts back to Airtable
            if (posts.length > 0) {
                addPostLog('💾 Saving post data to Airtable...', 'info');
                
                let savedCount = 0;
                for (const post of posts) {
                    try {
                        // Map post data to Airtable fields - only the 3 core fields requested
                        const postData = {
                            'Post URL': post.url || '',
                            'Post Text': post.text || '',
                            'Posted On': post.postedAtISO ? new Date(post.postedAtISO).toISOString().split('T')[0] : (post.date || '')
                        };

                        // Insert post data into Airtable using service
                        await airtableService.insertPostData(
                            postData,
                            process.env.AIRTABLE_TOKEN,
                            process.env.AIRTABLE_BASE_ID,
                            process.env.AIRTABLE_TABLE_NAME
                        );
                        
                        savedCount++;
                        postScrapingStats.posts = savedCount;
                        
                        // Add small delay to respect Airtable rate limits
                        await new Promise(resolve => setTimeout(resolve, 200));
                        
                    } catch (saveError) {
                        console.error('Error saving post to Airtable:', saveError);
                        postScrapingStats.errors++;
                        addPostLog(`❌ Error saving post: ${saveError.message}`, 'error');
                    }
                }
                
                addPostLog(`✅ Saved ${savedCount} posts to Airtable`, 'success');
            }

            postScrapingStats.completed = true;
            addPostLog('🎉 Post scraping completed!', 'success');

            res.json({ 
                status: 'completed', 
                message: 'Post scraping completed successfully', 
                urlsProcessed: linkedinUrls.length,
                postsScraped: posts.length,
                postsSaved: savedCount || 0
            });

        } catch (airtableError) {
            throw new Error(`Airtable error: ${airtableError.message}`);
        }

    } catch (error) {
        console.error('Error starting post scraping:', error);
        addPostLog(`❌ Error: ${error.message}`, 'error');
        postScrapingStats.errors++;
        postScrapingStats.completed = true;
        res.status(500).json({ error: error.message });
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
        
        // Enhanced input validation
        if (!runId || !apifyToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters: runId and apifyToken' 
            });
        }

        // Validate runId format (should be alphanumeric)
        if (!/^[a-zA-Z0-9]+$/.test(runId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid runId format. Must be alphanumeric.' 
            });
        }

        // Validate apifyToken format (should start with apify_api_)
        if (!apifyToken.startsWith('apify_api_')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid Apify token format. Must start with "apify_api_"' 
            });
        }

        console.log(`🔧 Manual Profile Scraper: Processing Run ID=${runId}, token=${maskToken(apifyToken)}`);

        // Step 1: Get run details from Apify with enhanced error handling
        const runDetailsUrl = `https://api.apify.com/v2/actor-runs/${runId}`;
        console.log(`🌐 GET ${runDetailsUrl}?token=${maskToken(apifyToken)}`);
        
        let runResponse;
        try {
            runResponse = await axios.get(runDetailsUrl, {
                params: { token: apifyToken },
                timeout: 300000, // Increased timeout to 5 minutes for better reliability
                headers: {
                    'User-Agent': 'LinkedIn-Scraper-Dashboard/1.0'
                }
            });
        } catch (runError) {
            if (runError.code === 'ECONNABORTED') {
                throw new Error('Apify API request timed out. Please try again.');
            }
            if (runError.response?.status === 401) {
                throw new Error('Invalid Apify API token. Please check your token.');
            }
            if (runError.response?.status === 404) {
                throw new Error(`Run ID ${runId} not found. Please check the run ID.`);
            }
            if (runError.response?.status >= 500) {
                throw new Error('Apify service is temporarily unavailable. Please try again later.');
            }
            throw new Error(`Failed to fetch run details: ${runError.message}`);
        }

        const runData = runResponse.data?.data || runResponse.data;
        if (!runData) {
            throw new Error('Invalid response structure from Apify API');
        }

        console.log(`📊 Run Status: ${runData.status}`);
        console.log(`📊 Dataset ID: ${runData.defaultDatasetId}`);

        // Enhanced status checking
        if (runData.status === 'FAILED') {
            return res.json({ 
                success: false, 
                error: `Run failed. Please check Apify dashboard for details.`,
                runStatus: runData.status,
                datasetId: runData.defaultDatasetId || null,
                meta: runData.meta || {}
            });
        }

        if (runData.status === 'RUNNING') {
            return res.json({ 
                success: false, 
                error: `Run is still in progress. Please wait for completion.`,
                runStatus: runData.status,
                datasetId: runData.defaultDatasetId || null,
                progress: runData.meta?.progress || 0
            });
        }

        if (runData.status !== 'SUCCEEDED') {
            return res.json({ 
                success: false, 
                error: `Run not completed. Current status: ${runData.status}`,
                runStatus: runData.status,
                datasetId: runData.defaultDatasetId || null
            });
        }

        const datasetId = runData.defaultDatasetId;
        if (!datasetId) {
            throw new Error('No datasetId returned from profile scraper run');
        }

        // Step 2: Get dataset items from Apify with enhanced error handling
        console.log(`🌐 GET https://api.apify.com/v2/datasets/${datasetId}/items?token=${maskToken(apifyToken)}&format=json`);
        
        let itemsResponse;
        try {
            itemsResponse = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
                params: { token: apifyToken, format: 'json' },
                timeout: 300000, // Increased timeout to 5 minutes for dataset retrieval
                headers: {
                    'User-Agent': 'LinkedIn-Scraper-Dashboard/1.0'
                }
            });
        } catch (itemsError) {
            if (itemsError.code === 'ECONNABORTED') {
                throw new Error('Dataset retrieval timed out. Please try again.');
            }
            if (itemsError.response?.status === 401) {
                throw new Error('Invalid Apify API token for dataset access.');
            }
            if (itemsError.response?.status === 404) {
                throw new Error(`Dataset ${datasetId} not found or access denied.`);
            }
            throw new Error(`Failed to retrieve dataset: ${itemsError.message}`);
        }

        const items = Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
        if (items.length === 0) {
            return res.json({
                success: false,
                error: 'No profiles found in the dataset. The scraping may not have completed successfully.',
                runStatus: 'SUCCEEDED',
                datasetId,
                itemsCount: 0
            });
        }

        // Validate items structure
        if (!items[0] || typeof items[0] !== 'object') {
            throw new Error('Invalid data structure returned from Apify dataset');
        }

        console.log(`✅ Retrieved ${items.length} profile(s) from Apify`);
        try {
            const firstKeys = Object.keys(items[0] || {});
            console.log(`🔍 First item keys: ${firstKeys.join(', ')}`);
            
            // Check for essential fields
            const essentialFields = ['firstName', 'lastName', 'publicIdentifier'];
            const missingFields = essentialFields.filter(field => !items[0][field]);
            if (missingFields.length > 0) {
                console.warn(`⚠️ Missing essential fields in first item: ${missingFields.join(', ')}`);
            }
        } catch (keyError) {
            console.warn(`⚠️ Could not analyze item structure: ${keyError.message}`);
        }

        // Step 3: Process each profile with enhanced error handling and rate limiting
        const results = [];
        const airtableService = require('./services/airtableService');
        const { mapApifyResponseToAirtable, validateAirtableData } = require('./utils/apifyDataMapper');

        // Enhanced rate limiting: Max 4 requests/second with jitter
        const RATE_LIMIT_DELAY = 250; // 250ms between requests = 4 req/s
        const JITTER_RANGE = 50; // Add ±50ms jitter to avoid thundering herd
        
        // Track comprehensive stats
        let duplicatesFound = 0;
        let newProfilesAdded = 0;
        let existingProfilesUpdated = 0;
        let validationFailures = 0;
        let processingErrors = 0;
        let spreadsheetRowsMarked = 0;
        
        // Get spreadsheet view ID for marking rows as done
        const spreadsheetViewId = process.env.AIRTABLE_SPREADSHEET_VIEW || process.env.AIRTABLE_VIEW_ID;
        const spreadsheetTableName = process.env.AIRTABLE_SPREADSHEET_TABLE || process.env.AIRTABLE_TABLE_NAME;
        const doneFieldName = process.env.AIRTABLE_DONE_FIELD || 'Last Action Stage';
        const doneFieldValue = process.env.AIRTABLE_DONE_VALUE || 'Profile Scraped';
        
        console.log(`ℹ️ Spreadsheet update functionality disabled - URL matching not configured`);
        
        // Process profiles with enhanced error handling
        for (let i = 0; i < items.length; i++) {
            const profileData = items[i];
            const profileIndex = i + 1;
            
            try {
                // Validate profile data structure
                if (!profileData || typeof profileData !== 'object') {
                    console.warn(`⚠️ Profile ${profileIndex}: Invalid data structure`);
                    results.push({ 
                        index: i, 
                        success: false, 
                        error: 'Invalid profile data structure',
                        profileIndex
                    });
                    validationFailures++;
                    continue;
                }

                // Check for minimum required fields
                if (!profileData.firstName && !profileData.lastName && !profileData.publicIdentifier) {
                    console.warn(`⚠️ Profile ${profileIndex}: Missing all identification fields`);
                    results.push({ 
                        index: i, 
                        success: false, 
                        error: 'Missing identification fields (firstName, lastName, publicIdentifier)',
                        profileIndex
                    });
                    validationFailures++;
                    continue;
                }

                const profileName = `${profileData.firstName || 'Unknown'} ${profileData.lastName || 'Unknown'}`.trim();
                console.log(`🔄 Processing profile ${profileIndex}/${items.length}: ${profileName}`);

                // Map to Airtable format with error handling
                let airtableData;
                try {
                    airtableData = mapApifyResponseToAirtable(profileData, profileData.linkedinUrl || profileData.url);
                } catch (mappingError) {
                    console.error(`❌ Mapping error for profile ${profileIndex}: ${mappingError.message}`);
                    results.push({ 
                        index: i, 
                        success: false, 
                        error: `Data mapping failed: ${mappingError.message}`,
                        profileIndex,
                        profileName
                    });
                    processingErrors++;
                    continue;
                }
                
                // Enhanced data validation
                const requiredFields = ['firstName', 'lastName'];
                const isValid = validateAirtableData(airtableData, requiredFields);
                if (!isValid) {
                    console.warn(`⚠️ Profile ${profileIndex} validation failed for required fields: ${requiredFields.join(', ')}`);
                    results.push({ 
                        index: i, 
                        success: false, 
                        error: `Data validation failed for required fields: ${requiredFields.join(', ')}`,
                        profileIndex,
                        profileName
                    });
                    validationFailures++;
                    continue;
                }

                // Enhanced duplicate checking with fallback URL construction
                const urlField = process.env.AIRTABLE_UNIQUE_URL_FIELD || 'linkedinUrl';
                let urlValue = airtableData[urlField];
                
                // Fallback URL construction if linkedinUrl is missing
                if (!urlValue && profileData.publicIdentifier) {
                    urlValue = `https://www.linkedin.com/in/${profileData.publicIdentifier}/`;
                    airtableData[urlField] = urlValue;
                    console.log(`🔧 Constructed fallback URL for profile ${profileIndex}: ${urlValue}`);
                }
                
                if (!urlValue) {
                    console.warn(`⚠️ Profile ${profileIndex} has no LinkedIn URL - skipping duplicate check`);
                    results.push({ 
                        index: i, 
                        success: false, 
                        error: 'No LinkedIn URL found for duplicate checking',
                        profileIndex,
                        profileName
                    });
                    validationFailures++;
                    continue;
                }

                // Check if profile already exists in Airtable with retry logic
                console.log(`🔍 Checking for duplicate: ${urlValue}`);
                let existingRecord = null;
                let duplicateCheckRetries = 0;
                const maxDuplicateCheckRetries = 2;
                
                while (duplicateCheckRetries <= maxDuplicateCheckRetries) {
                    try {
                        existingRecord = await airtableService.findRecordByUrl(
                            process.env.AIRTABLE_TOKEN,
                            process.env.AIRTABLE_BASE_ID,
                            process.env.AIRTABLE_TABLE_NAME,
                            urlField,
                            urlValue
                        );
                        break; // Success - exit retry loop
                    } catch (findError) {
                        duplicateCheckRetries++;
                        console.warn(`⚠️ Duplicate check attempt ${duplicateCheckRetries}/${maxDuplicateCheckRetries} failed: ${findError.message}`);
                        
                        if (duplicateCheckRetries <= maxDuplicateCheckRetries) {
                            // Wait before retry with exponential backoff
                            const waitTime = Math.min(1000 * Math.pow(2, duplicateCheckRetries - 1), 5000);
                            console.log(`⏳ Waiting ${waitTime}ms before duplicate check retry...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                            console.error(`❌ Duplicate check failed after ${maxDuplicateCheckRetries} attempts for profile ${profileIndex}`);
                            // Continue processing even if duplicate check fails
                        }
                    }
                }

                if (existingRecord) {
                    console.log(`🔄 Duplicate found for profile ${profileIndex}: ${profileName} (Record ID: ${existingRecord.id})`);
                    duplicatesFound++;
                    
                    results.push({ 
                        index: i, 
                        success: true, 
                        profileName,
                        airtableAction: 'duplicate_skipped',
                        recordId: existingRecord.id,
                        isDuplicate: true,
                        duplicateMessage: `Profile already exists in Airtable (Record ID: ${existingRecord.id})`,
                        profileIndex
                    });
                    
                    console.log(`⏭️ Skipping duplicate profile ${profileIndex}`);
                    continue; // Skip to next profile
                }

                // No duplicate found - proceed with Airtable insertion/update
                console.log(`✅ No duplicate found - proceeding with Airtable insertion for profile ${profileIndex}`);
                
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
                            // Rate limit exceeded - wait longer with exponential backoff
                            const waitTime = Math.max(30000, retryCount * 30000); // 30s, 60s, 90s
                            console.log(`⏳ Rate limit (429) hit for profile ${profileIndex}. Waiting ${waitTime/1000}s before retry ${retryCount}/${maxRetries}`);
                            
                            if (retryCount <= maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, waitTime));
                                continue;
                            } else {
                                throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
                            }
                        } else if (retryCount <= maxRetries) {
                            // Other error - wait a bit and retry with exponential backoff
                            const waitTime = Math.min(retryCount * 2000, 10000); // 2s, 4s, 6s, 8s, 10s max
                            console.log(`⚠️ Airtable error for profile ${profileIndex}. Retrying in ${waitTime/1000}s (${retryCount}/${maxRetries})`);
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

                // Spreadsheet update functionality disabled - URL matching won't work correctly
                // The LinkedIn profile URLs won't match with spreadsheet URLs
                console.log(`ℹ️ Skipping spreadsheet update - URL matching not configured`);
                
                results.push({ 
                    index: i, 
                    success: true, 
                    profileName,
                    airtableAction: airtableResult.action || 'inserted',
                    recordId: airtableResult.record?.id || 'n/a',
                    isDuplicate: false,
                    profileIndex,
                    spreadsheetMarked: false,
                    spreadsheetRowId: null,
                    spreadsheetNote: 'Spreadsheet update disabled - URL matching not configured'
                });

                console.log(`✅ Profile ${profileIndex} processed successfully (${airtableResult.action})`);

                // Enhanced rate limiting with jitter to avoid thundering herd
                if (i < items.length - 1) {
                    const jitter = Math.random() * JITTER_RANGE - (JITTER_RANGE / 2);
                    const actualDelay = Math.max(100, RATE_LIMIT_DELAY + jitter);
                    console.log(`⏱️ Rate limiting: Waiting ${Math.round(actualDelay)}ms before next request...`);
                    await new Promise(resolve => setTimeout(resolve, actualDelay));
                }

            } catch (profileError) {
                console.error(`❌ Error processing profile ${profileIndex}:`, profileError.message);
                results.push({ 
                    index: i, 
                    success: false, 
                    error: profileError.message,
                    profileIndex,
                    profileName: profileData?.firstName && profileData?.lastName ? 
                        `${profileData.firstName} ${profileData.lastName}` : 'Unknown'
                });
                processingErrors++;
            }
        }

            // Enhanced final statistics
            const successCount = results.filter(r => r.success).length;
            const errorCount = results.filter(r => !r.success).length;
            const duplicateCount = results.filter(r => r.isDuplicate).length;
            const newProfilesCount = results.filter(r => r.success && !r.isDuplicate).length;

                    console.log(`🎉 Manual Profile Scraper completed: ${successCount} success, ${errorCount} errors, ${duplicateCount} duplicates skipped`);
        console.log(`📊 Detailed stats: ${newProfilesAdded} new profiles, ${existingProfilesUpdated} updated, ${validationFailures} validation failures, ${processingErrors} processing errors`);

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
                validationFailures,
                processingErrors,
                results,
                processingSummary: {
                    total: items.length,
                    successful: successCount,
                    failed: errorCount,
                    duplicates: duplicateCount,
                    newProfiles: newProfilesCount,
                    validationIssues: validationFailures,
                    processingIssues: processingErrors
                }
            });

        } catch (error) {
            const statusCode = error.response?.status || 500;
            const apiMessage = error.response?.data?.error || error.response?.data?.message;
            
            console.error(`❌ Manual Profile Scraper error (${statusCode}):`, error.message);
            if (apiMessage) console.error('   ↳ API says:', apiMessage);
            
            // Enhanced error response with more context
            const errorResponse = {
                success: false, 
                error: error.message,
                statusCode,
                apifyMessage: apiMessage || null,
                timestamp: new Date().toISOString(),
                errorType: error.code || 'UNKNOWN_ERROR'
            };
            
            // Add specific error handling for common issues
            if (error.code === 'ECONNABORTED') {
                errorResponse.error = 'Request timed out. Please try again.';
                errorResponse.suggestion = 'Check your internet connection and try again.';
            } else if (error.code === 'ENOTFOUND') {
                errorResponse.error = 'Network error. Please check your internet connection.';
                errorResponse.suggestion = 'Verify your internet connection and try again.';
            } else if (statusCode === 401) {
                errorResponse.suggestion = 'Please verify your Apify API token.';
            } else if (statusCode === 404) {
                errorResponse.suggestion = 'Please verify the Run ID exists and is accessible.';
            } else if (statusCode >= 500) {
                errorResponse.suggestion = 'Apify service may be temporarily unavailable. Please try again later.';
            }
            
            return res.status(500).json(errorResponse);
        }
    });

/**
 * Manual Post Import: Accept a JSON/CSV payload of posts and update Airtable by linkedinUrl
 * Body: {
 *   records: Array<{ linkedinUrl: string, url?: string, text?: string, postedAtISO?: string, date?: string }>,
 *   viewId?: string // optional, default same as scraping view
 * }
 */
app.post('/api/import-posts', async (req, res) => {
    try {
        const { records, viewId } = req.body || {};
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'No records provided' });
        }
        if (!process.env.AIRTABLE_TOKEN) {
            return res.status(500).json({ error: 'Missing required environment variables: AIRTABLE_TOKEN' });
        }

        const airtableService = require('./services/airtableService');
        const targetViewId = viewId || AIRTABLE_CREDENTIALS.AIRTABLE_VIEW_ID;
        
        console.log(`🔍 Debug: Using view ID: ${targetViewId}`);
        console.log(`🔍 Debug: AIRTABLE_CREDENTIALS.AIRTABLE_VIEW_ID = ${AIRTABLE_CREDENTIALS.AIRTABLE_VIEW_ID}`);
        console.log(`🔍 Debug: process.env.AIRTABLE_VIEW_ID = ${process.env.AIRTABLE_VIEW_ID}`);

        const urlToRecordId = await airtableService.fetchRecordMapByLinkedinUrl(
            process.env.AIRTABLE_TOKEN,
            process.env.AIRTABLE_BASE_ID,
            process.env.AIRTABLE_TABLE_NAME,
            targetViewId
        );

        let updates = 0;
        let notFound = 0;
        let errors = 0;

        for (const rec of records) {
            // Handle both linkedinUrl and inputUrl fields
            const linkedinUrl = (rec.linkedinUrl || rec.inputUrl || '').trim();
            if (!linkedinUrl) {
                console.log(`⚠️ Skipping record - no linkedinUrl or inputUrl found:`, rec);
                continue;
            }
            
            console.log(`🔍 Searching for profile: ${linkedinUrl}`);
            const recordId = urlToRecordId.get(linkedinUrl);
            if (!recordId) {
                console.log(`❌ Profile not found in Airtable for URL: ${linkedinUrl}`);
                notFound++;
                continue;
            }
            
            console.log(`✅ Found profile in Airtable: ${linkedinUrl}`);

            const postData = {
                'Post URL': rec.url || '',
                'Post Text': rec.text || '',
                'Posted On': formatDateForAirtable(rec.postedAtISO || rec.date)
            };

            try {
                await airtableService.updateRecord(
                    recordId,
                    postData,
                    process.env.AIRTABLE_TOKEN,
                    process.env.AIRTABLE_BASE_ID,
                    process.env.AIRTABLE_TABLE_NAME
                );
                updates++;
                // small delay to respect rate limits
                await new Promise(r => setTimeout(r, 150));
            } catch (e) {
                console.error('Error updating record from import:', e.message);
                errors++;
            }
        }

        return res.json({ status: 'ok', updated: updates, notFound, errors, total: records.length });
    } catch (err) {
        console.error('Import error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * Stop post scraping session
 */
app.post('/api/stop-post-scraping', (req, res) => {
    if (IS_VERCEL && BACKEND_URL) {
        return axios.post(`${BACKEND_URL}/api/stop-post-scraping`).then(r => res.status(r.status).json(r.data)).catch(err => {
            const status = err.response?.status || 500;
            const data = err.response?.data || { error: err.message };
            res.status(status).json(data);
        });
    }
    if (postScrapingProcess) {
        postScrapingProcess.kill();
        postScrapingProcess = null;
        addPostLog('⏹️ Post scraping process stopped by user', 'info');
        postScrapingStats.completed = true;
    }
    
    res.json({ status: 'stopped', message: 'Post scraping process stopped' });
});

/**
 * Get current post scraping status
 */
app.get('/api/post-status', (req, res) => {
    if (IS_VERCEL && BACKEND_URL) {
        return axios.get(`${BACKEND_URL}/api/post-status`).then(r => res.status(r.status).json(r.data)).catch(err => {
            const status = err.response?.status || 500;
            const data = err.response?.data || { error: err.message };
            res.status(status).json(data);
        });
    }
    // Get recent logs (last 10 entries)
    const recentLogs = postScrapingStats.logs.slice(-10);
    
    res.json({
        ...postScrapingStats,
        logs: recentLogs,
        isRunning: postScrapingProcess !== null
    });
    
    // Clear sent logs to avoid duplication
    postScrapingStats.logs = [];
});

/**
 * Start ChatGPT comment generation
 */
app.post('/api/start-chatgpt', async (req, res) => {
    try {
        if (IS_VERCEL && BACKEND_URL) {
            try {
                const response = await axios.post(`${BACKEND_URL}/api/start-chatgpt`, req.body, { timeout: 300000 });
                return res.status(response.status).json(response.data);
            } catch (err) {
                const status = err.response?.status || 500;
                const data = err.response?.data || { error: err.message };
                return res.status(status).json(data);
            }
        } else if (IS_VERCEL && !BACKEND_URL) {
            return res.status(400).json({ error: 'ChatGPT processing is not supported on Vercel. Configure BACKEND_URL.' });
        }

        // Get configuration from environment variables
        const config = {
            airtableToken: process.env.AIRTABLE_TOKEN,
            baseId: process.env.AIRTABLE_BASE_ID,
            tableName: process.env.AIRTABLE_TABLE_NAME,
            viewId: process.env.AIRTABLE_VIEW_ID,
            chatgptToken: process.env.CHATGPT_API_TOKEN,
            assistantId: process.env.CHATGPT_ASSISTANT_ID
        };
        
        // Validate configuration from environment
        const missingVars = [];
        if (!config.airtableToken) missingVars.push('AIRTABLE_TOKEN');
        if (!config.baseId) missingVars.push('AIRTABLE_BASE_ID');
        if (!config.tableName) missingVars.push('AIRTABLE_TABLE_NAME');
        if (!config.viewId) missingVars.push('AIRTABLE_VIEW_ID');
        if (!config.chatgptToken) missingVars.push('CHATGPT_API_TOKEN');
        if (!config.assistantId) missingVars.push('CHATGPT_ASSISTANT_ID');
        
        if (missingVars.length > 0) {
            return res.status(400).json({ 
                error: `Missing environment variables: ${missingVars.join(', ')}` 
            });
        }

        // Check if already running
        if (chatgptProcess !== null) {
            return res.status(400).json({ error: 'ChatGPT processing is already running' });
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

// Only start the listener when running as a standalone server (not in Vercel serverless)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🌐 LinkedIn Scraper Dashboard running at http://localhost:${PORT}`);
        console.log('📊 Open your browser and navigate to the URL above to access the dashboard');
        addLog('🚀 Server started successfully', 'success');
        addLog('💡 Ready to accept scraping configurations', 'info');
    });
}

module.exports = app;