#!/usr/bin/env node

/**
 * Word Document Uploader (Simplified)
 * Uses mammoth for Word → HTML, then Tiptap for HTML → JSON
 *
 * Usage:
 *   node scripts/upload-word.js <file.docx>
 *   node scripts/upload-word.js --all
 *   node scripts/upload-word.js --all --dry-run
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { generateJSON } = require('@tiptap/html/server');
const StarterKit = require('@tiptap/starter-kit').default;

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const CLIENT_ID = 1; // tax-purpose client

let accessToken = null;
const extensions = [StarterKit];

// Custom style map for mammoth
const styleMap = [
  "p[style-name='MdHeading1'] => h1:fresh",
  "p[style-name='MdHeading2'] => h2:fresh",
  "p[style-name='MdHeading3'] => h3:fresh",
  "p[style-name='MdHeading4'] => h4:fresh",
  "p[style-name='Titel'] => h1:fresh",
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
];

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
    throw new Error(`Login failed: ${await response.text()}`);
  }

  const data = await response.json();
  accessToken = data.data.access_token;
  console.log('✓ Logged in\n');
}

async function convertWordToJson(filePath) {
  // Word → HTML (mammoth)
  const result = await mammoth.convertToHtml(
    { path: filePath },
    { styleMap }
  );

  if (result.messages.length > 0) {
    console.log('Mammoth warnings:', result.messages);
  }

  let html = result.value;

  // Remove first h1 (title is handled separately)
  html = html.replace(/<h1>.*?<\/h1>/, '');

  // HTML → Tiptap JSON
  const json = generateJSON(html, extensions);

  return { html, json };
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
      content: JSON.stringify(content), // Store as JSON string
      summary,
      status: 'published',
      client: CLIENT_ID,
      date_created: '2026-03-19T10:00:00.000Z'
    })
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${await response.text()}`);
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

function extractTitle(filePath) {
  const filename = path.basename(filePath, '.docx');
  return filename
    .replace(/^\d+\.\s*/, '')
    .replace(/Artikel_/i, '')
    .replace(/_/g, ' ')
    .trim();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node upload-word.js <file.docx> [--dry-run]');
    console.log('       node upload-word.js --all [--dry-run]');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');
  const processAll = args.includes('--all');

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

      const { html, json } = await convertWordToJson(file);
      const title = extractTitle(file);
      const slug = generateSlug(title);
      const summary = title; // Clean summary without "Blog post:" prefix

      console.log(`\nTitle: ${title}`);
      console.log(`Slug: ${slug}`);
      console.log(`HTML length: ${html.length} chars`);
      console.log(`JSON nodes: ${json.content?.length || 0}`);

      console.log(`\n--- JSON preview ---`);
      console.log(JSON.stringify(json, null, 2).substring(0, 500));
      console.log('...');

      if (!dryRun) {
        console.log('\nUploading to Directus...');
        const result = await uploadToDirectus(title, slug, json, summary);
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
