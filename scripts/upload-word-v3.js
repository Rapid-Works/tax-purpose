#!/usr/bin/env node

/**
 * Word Document Uploader v3
 * Directly parses DOCX XML to properly detect heading styles
 *
 * Usage:
 *   node scripts/upload-word-v3.js <file.docx>
 *   node scripts/upload-word-v3.js --all
 *   node scripts/upload-word-v3.js --all --dry-run
 */

const { xmlToHtml } = require('../public/word-xml-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Directus config
const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const CLIENT_ID = 1; // tax-purpose client

let accessToken = null;

// Login to Directus and get access token
async function login() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Missing DIRECTUS_ADMIN_EMAIL or DIRECTUS_ADMIN_PASSWORD in .env');
  }

  console.log('Logging in to Directus...');
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  const data = await response.json();
  accessToken = data.data.access_token;
  console.log('✓ Logged in successfully\n');
}

async function parseDocx(filePath) {
  const tmpDir = `/tmp/docx_${Date.now()}`;

  // Extract docx (it's a zip file)
  execSync(`unzip -o "${filePath}" -d "${tmpDir}" 2>/dev/null`);

  // Read document.xml
  const documentXml = fs.readFileSync(`${tmpDir}/word/document.xml`, 'utf8');
  const relsPath = `${tmpDir}/word/_rels/document.xml.rels`;
  const relsXml = fs.existsSync(relsPath) ? fs.readFileSync(relsPath, 'utf8') : '';

  // Clean up
  execSync(`rm -rf "${tmpDir}"`);

  return { documentXml, relsXml };
}

async function uploadToDirectus(title, slug, content, summary) {
  const response = await fetch(`${DIRECTUS_URL}/items/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      slug,
      content,
      summary,
      status: 'published',
      client: CLIENT_ID,
      date_created: '2026-03-19T10:00:00.000Z'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  return response.json();
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node upload-word-v3.js <file.docx> [--dry-run]');
    console.log('       node upload-word-v3.js --all [--dry-run]');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');
  const processAll = args.includes('--all');

  // Login to get access token (skip for dry-run)
  if (!dryRun) {
    await login();
  }

  let files = [];

  if (processAll) {
    const blogDir = path.join(__dirname, '..', 'src', 'word_blogs');
    files = fs.readdirSync(blogDir)
      .filter(f => f.endsWith('.docx'))
      .map(f => path.join(blogDir, f));
  } else {
    files = args.filter(a => !a.startsWith('--'));
  }

  for (const file of files) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${path.basename(file)}`);
      console.log('='.repeat(60));

      const { documentXml, relsXml } = await parseDocx(file);
      const html = xmlToHtml(documentXml, relsXml);

      // Extract title from filename
      const filename = path.basename(file, '.docx');
      const title = filename
        .replace(/^\d+\.\s*/, '')  // Remove leading number
        .replace(/Artikel_/i, '')
        .replace(/_/g, ' ')
        .trim();

      const slug = generateSlug(title);
      const summary = `Blog post: ${title}`;

      console.log(`\nTitle: ${title}`);
      console.log(`Slug: ${slug}`);
      console.log(`HTML length: ${html.length} chars`);
      console.log(`H1 tags: ${(html.match(/<h1>/g) || []).length}`);
      console.log(`H2 tags: ${(html.match(/<h2>/g) || []).length}`);
      console.log(`H3 tags: ${(html.match(/<h3>/g) || []).length}`);

      console.log(`\n--- First 1000 chars ---`);
      console.log(html.substring(0, 1000));
      console.log('...');

      if (!dryRun) {
        console.log('\nUploading to Directus...');
        const result = await uploadToDirectus(title, slug, html, summary);
        console.log(`✓ Created post ID: ${result.data.id}`);
      } else {
        console.log('\n[DRY RUN] Would upload to Directus');
      }

    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
}

main();
