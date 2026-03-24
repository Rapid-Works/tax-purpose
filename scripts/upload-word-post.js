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

// Post-process HTML to add proper heading tags
// Since Word docs use non-standard styles, we detect headings by patterns
function addHeadingTags(html, title) {
  let result = html;

  // Remove title repetition at the start (if content starts with the title)
  const titlePattern = new RegExp(`^<p>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>`, 'i');
  result = result.replace(titlePattern, '');

  // Convert strong-only paragraphs to h2 (likely section headings)
  // Pattern: <p><strong>Text without period</strong></p>
  result = result.replace(
    /<p><strong>([^<]+)<\/strong><\/p>/g,
    (match, text) => {
      // Only convert if it looks like a heading (not too long, no period at end)
      if (text.length < 150 && !text.trim().endsWith('.')) {
        return `<h2>${text}</h2>`;
      }
      return match;
    }
  );

  // Convert numbered section headings: "1. Title Text" at start of paragraph
  result = result.replace(
    /<p>(\d+)\.\s+([A-ZÄÖÜ][^<]{10,100})<\/p>/g,
    '<h3>$1. $2</h3>'
  );

  // Convert known heading patterns to h2
  const h2Patterns = [
    /^Warum .{10,80}$/,
    /^Was ist .{10,80}\??$/,
    /^Wie .{10,80}$/,
    /^Die .{10,80}$/,
    /^Der .{10,80}$/,
    /^Fazit:.{0,80}$/,
    /^Zusammenfassung.{0,50}$/,
    /.{5,50} – .{5,50}$/,  // Title patterns with em-dash
  ];

  // Find standalone short paragraphs that match heading patterns
  result = result.replace(/<p>([^<]{15,120})<\/p>/g, (match, text) => {
    const trimmed = text.trim();
    if (h2Patterns.some(p => p.test(trimmed))) {
      return `<h2>${trimmed}</h2>`;
    }
    return match;
  });

  return result.trim();
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

  // Style map for converting Word styles to HTML
  const styleMap = [
    // Standard Word styles
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Heading 4'] => h4:fresh",
    "p[style-name='Title'] => h1:fresh",
    "p[style-name='Subtitle'] => h2:fresh",
    "r[style-name='Strong'] => strong",
    "r[style-name='Emphasis'] => em",
    // Custom Md* styles (from markdown-converted Word docs)
    "p[style-name='MdHeading1'] => h1:fresh",
    "p[style-name='MdHeading2'] => h2:fresh",
    "p[style-name='MdHeading3'] => h3:fresh",
    "p[style-name='MdHeading4'] => h4:fresh",
    "p[style-name='MdHeading5'] => h5:fresh",
    "p[style-name='MdHeading6'] => h6:fresh",
    "r[style-name='MdStrong'] => strong",
    "r[style-name='MdEm'] => em",
    // German heading styles
    "p[style-name='Überschrift 1'] => h1:fresh",
    "p[style-name='Überschrift 2'] => h2:fresh",
    "p[style-name='Überschrift 3'] => h3:fresh",
    "p[style-name='Überschrift 4'] => h4:fresh"
  ];

  // Convert Word to HTML with style mapping
  const result = await mammoth.convertToHtml({
    path: filePath,
    styleMap: styleMap
  });
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

  // Remove first h1 from content (it's now the title), fix dates, and add heading tags
  let content = removeFirstH1(html);
  content = fixDates(content);
  content = addHeadingTags(content, title);

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
