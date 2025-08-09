require('dotenv').config();
const express = require('express');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

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

// API Routes

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
 * Start post scraping session
 */
app.post('/api/start-post-scraping', async (req, res) => {
    try {
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
            const apifyUrl = `https://api.apify.com/v2/acts/curious_coder~linkedin-post-search-scraper/run-sync-get-dataset-items?token=${config.apifyToken}`;
            
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
 * Stop post scraping session
 */
app.post('/api/stop-post-scraping', (req, res) => {
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

/**
 * Serve the main dashboard
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Start server
app.listen(PORT, () => {
    console.log(`🌐 LinkedIn Scraper Dashboard running at http://localhost:${PORT}`);
    console.log('📊 Open your browser and navigate to the URL above to access the dashboard');
    addLog('🚀 Server started successfully', 'success');
    addLog('💡 Ready to accept scraping configurations', 'info');
});

module.exports = app;
