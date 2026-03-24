#!/usr/bin/env node

/**
 * Word Document Uploader v2
 * Uses officeparser to properly detect headings based on formatting (font size, bold)
 * instead of relying on Word heading styles
 */

const officeParser = require('officeparser');
const path = require('path');
const fs = require('fs');

// Directus config
const DIRECTUS_URL = 'https://directus.rapid-works.io';
const DIRECTUS_TOKEN = 'taxpurpose_admin_token_2026';
const CLIENT_ID = 1; // tax-purpose client

// Threshold for detecting headings (font size in pt)
const H2_MIN_SIZE = 13; // Font size >= 13pt becomes h2
const H3_MIN_SIZE = 11; // Font size >= 11pt but < 13pt becomes h3

async function parseWordDocument(filePath) {
  console.log(`\nParsing: ${path.basename(filePath)}`);

  const ast = await officeParser.parseOffice(filePath);

  // Debug: let's see what we get
  console.log('\n--- AST Structure Preview ---');

  let html = '';

  function processNode(node, depth = 0) {
    const indent = '  '.repeat(depth);

    if (node.type === 'heading') {
      const level = node.metadata?.level || 2;
      console.log(`${indent}HEADING L${level}: "${node.text?.substring(0, 50)}..."`);
      html += `<h${level}>${escapeHtml(node.text)}</h${level}>\n`;
      return;
    }

    if (node.type === 'paragraph') {
      const text = node.text?.trim();
      if (!text) return;

      // Check formatting to detect implicit headings
      const formatting = node.formatting || {};
      const fontSize = parseFloat(formatting.size) || 11;
      const isBold = formatting.bold === true;

      // Check if children have bold formatting
      let childrenAreBold = false;
      if (node.children && node.children.length > 0) {
        childrenAreBold = node.children.every(child =>
          child.formatting?.bold === true || child.type === 'text'
        );
        // Check first child formatting
        if (node.children[0]?.formatting?.bold) {
          childrenAreBold = true;
        }
      }

      const effectiveBold = isBold || childrenAreBold;

      console.log(`${indent}PARA: size=${fontSize}pt, bold=${effectiveBold}, "${text.substring(0, 50)}..."`);

      // Detect headings by formatting
      if (fontSize >= H2_MIN_SIZE || (effectiveBold && text.length < 100 && !text.endsWith('.'))) {
        // Likely a heading
        if (fontSize >= H2_MIN_SIZE) {
          html += `<h2>${escapeHtml(text)}</h2>\n`;
        } else {
          html += `<h3>${escapeHtml(text)}</h3>\n`;
        }
      } else {
        html += `<p>${processInlineFormatting(node)}</p>\n`;
      }
      return;
    }

    if (node.type === 'list') {
      const listType = node.metadata?.ordered ? 'ol' : 'ul';
      html += `<${listType}>\n`;
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'list-item') {
            html += `<li>${processInlineFormatting(child)}</li>\n`;
          }
        });
      }
      html += `</${listType}>\n`;
      return;
    }

    if (node.type === 'table') {
      html += '<table>\n';
      if (node.children) {
        let isFirstRow = true;
        node.children.forEach(row => {
          if (row.type === 'table-row') {
            html += '<tr>\n';
            if (row.children) {
              row.children.forEach(cell => {
                const tag = isFirstRow ? 'th' : 'td';
                html += `<${tag}>${escapeHtml(cell.text || '')}</${tag}>\n`;
              });
            }
            html += '</tr>\n';
            isFirstRow = false;
          }
        });
      }
      html += '</table>\n';
      return;
    }

    // Process children
    if (node.children) {
      node.children.forEach(child => processNode(child, depth + 1));
    }
  }

  function processInlineFormatting(node) {
    if (!node.children || node.children.length === 0) {
      return escapeHtml(node.text || '');
    }

    let result = '';
    node.children.forEach(child => {
      let text = escapeHtml(child.text || '');
      if (child.formatting?.bold) text = `<strong>${text}</strong>`;
      if (child.formatting?.italic) text = `<em>${text}</em>`;
      result += text;
    });
    return result || escapeHtml(node.text || '');
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Process the AST
  if (ast.content) {
    ast.content.forEach(node => processNode(node));
  }

  return html;
}

async function uploadToDirectus(title, slug, content, summary) {
  const response = await fetch(`${DIRECTUS_URL}/items/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
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
    console.log('Usage: node upload-word-v2.js <file.docx> [--dry-run]');
    console.log('       node upload-word-v2.js --all [--dry-run]');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');
  const processAll = args.includes('--all');

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

      const html = await parseWordDocument(file);

      // Extract title from filename
      const filename = path.basename(file, '.docx');
      const title = filename
        .replace(/^\d+\.\s*/, '')  // Remove leading number
        .replace(/Artikel_/i, '')
        .replace(/_/g, ' ')
        .trim();

      const slug = generateSlug(title);
      const summary = `Blog post: ${title}`;

      console.log(`\n--- Generated HTML (first 1000 chars) ---`);
      console.log(html.substring(0, 1000));
      console.log('...');

      console.log(`\nTitle: ${title}`);
      console.log(`Slug: ${slug}`);
      console.log(`HTML length: ${html.length} chars`);
      console.log(`H2 tags: ${(html.match(/<h2>/g) || []).length}`);
      console.log(`H3 tags: ${(html.match(/<h3>/g) || []).length}`);

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
