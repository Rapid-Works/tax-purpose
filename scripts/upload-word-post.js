/**
 * Word Document to Directus Blog Post Uploader
 *
 * Converts a .docx file to HTML and creates a blog post in Directus.
 *
 * Usage:
 *   npm install mammoth
 *   DIRECTUS_ADMIN_TOKEN=your_token node scripts/upload-word-post.js path/to/post.docx
 *
 * Options:
 *   --title "Custom Title"     Override the title (default: first H1 or filename)
 *   --slug "custom-slug"       Override the slug (default: auto-generated from title)
 *   --status "published"       Set status (default: draft)
 *   --client "tax-purpose"     Client slug (default: from env or tax-purpose)
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;
const DEFAULT_CLIENT_SLUG = process.env.REACT_APP_CLIENT_SLUG || 'tax-purpose';

if (!ADMIN_TOKEN) {
  console.error('Error: DIRECTUS_ADMIN_TOKEN environment variable is required');
  console.error('Usage: DIRECTUS_ADMIN_TOKEN=your_token node scripts/upload-word-post.js path/to/post.docx');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    filePath: null,
    title: null,
    slug: null,
    status: 'draft',
    clientSlug: DEFAULT_CLIENT_SLUG
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--title' && args[i + 1]) {
      options.title = args[++i];
    } else if (arg === '--slug' && args[i + 1]) {
      options.slug = args[++i];
    } else if (arg === '--status' && args[i + 1]) {
      options.status = args[++i];
    } else if (arg === '--client' && args[i + 1]) {
      options.clientSlug = args[++i];
    } else if (!arg.startsWith('--')) {
      options.filePath = arg;
    }
  }

  return options;
}

// Generate URL-friendly slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, char => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[char] || char))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Extract title from HTML (first h1) or use filename
function extractTitle(html, filename) {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    // Remove HTML tags from title
    return h1Match[1].replace(/<[^>]*>/g, '').trim();
  }
  // Use filename without extension
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Extract summary (first paragraph)
function extractSummary(html) {
  const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
  if (pMatch) {
    const text = pMatch[1].replace(/<[^>]*>/g, '').trim();
    return text.length > 200 ? text.substring(0, 197) + '...' : text;
  }
  return '';
}

// Remove first h1 from content (since we use it as title)
function removeFirstH1(html) {
  return html.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim();
}

// Fix dates in content (12. März → 19. März)
function fixDates(html) {
  return html.replace(/12\. März 2026/g, '19. März 2026');
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`API Error: ${JSON.stringify(data)}`);
  }
  return data;
}

async function getClientId(slug) {
  const result = await apiRequest(`/items/clients?filter[slug][_eq]=${slug}`);
  if (!result.data || result.data.length === 0) {
    throw new Error(`Client not found: ${slug}`);
  }
  return result.data[0].id;
}

async function convertAndUpload(options) {
  const { filePath, status, clientSlug } = options;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  console.log(`\nConverting: ${filePath}`);

  // Convert Word to HTML
  const result = await mammoth.convertToHtml({ path: filePath });
  let html = result.value;

  // Log any conversion warnings
  if (result.messages.length > 0) {
    console.log('Conversion warnings:');
    result.messages.forEach(msg => console.log(`  - ${msg.message}`));
  }

  // Extract or use provided title
  const title = options.title || extractTitle(html, filePath);
  console.log(`Title: ${title}`);

  // Generate or use provided slug
  const slug = options.slug || generateSlug(title);
  console.log(`Slug: ${slug}`);

  // Extract summary from first paragraph
  const summary = extractSummary(html);
  console.log(`Summary: ${summary.substring(0, 50)}...`);

  // Remove first h1 from content (it's now the title) and fix dates
  let content = removeFirstH1(html);
  content = fixDates(content);

  // Get client ID
  const clientId = await getClientId(clientSlug);
  console.log(`Client: ${clientSlug} (ID: ${clientId})`);

  // Create post in Directus
  const postData = {
    title,
    slug,
    summary,
    content,
    status,
    client: clientId
  };

  const postResult = await apiRequest('/items/posts', 'POST', postData);

  console.log(`\n✓ Post created successfully!`);
  console.log(`  ID: ${postResult.data.id}`);
  console.log(`  Status: ${status}`);
  console.log(`  URL: ${DIRECTUS_URL}/admin/content/posts/${postResult.data.id}`);

  return postResult.data;
}

async function main() {
  const options = parseArgs();

  if (!options.filePath) {
    console.error('Usage: DIRECTUS_ADMIN_TOKEN=your_token node scripts/upload-word-post.js path/to/post.docx');
    console.error('\nOptions:');
    console.error('  --title "Title"        Custom title');
    console.error('  --slug "slug"          Custom URL slug');
    console.error('  --status "published"   Status (draft/published)');
    console.error('  --client "slug"        Client slug');
    process.exit(1);
  }

  try {
    await convertAndUpload(options);
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
