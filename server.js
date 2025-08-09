#!/usr/bin/env node

/**
 * LinkedIn Scraper Dashboard - Main Entry Point
 * 
 * A comprehensive LinkedIn scraping dashboard with:
 * - Profile scraping with Apify integration
 * - Post scraping capabilities  
 * - ChatGPT comment generation
 * - Airtable data management
 * 
 * @author LinkedIn Scraper Team
 * @version 2.0.0
 */

// Load environment configuration
require('dotenv').config();

// Start the main application server
require('./src/server.js');