#!/usr/bin/env node

/**
 * Migration Script: HTML → Tiptap JSON
 * Converts existing blog posts from HTML to Tiptap JSON format
 *
 * Usage:
 *   node scripts/migrate-to-tiptap.js --dry-run  (preview changes)
 *   node scripts/migrate-to-tiptap.js            (apply changes)
 */

const path = require('path');
const { generateJSON } = require('@tiptap/html/server');
const StarterKit = require('@tiptap/starter-kit').default;

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

let accessToken = null;

// Tiptap extensions (must match what Flexible Editor uses)
const extensions = [StarterKit];

async function login() {
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

async function fetchPosts() {
  const response = await fetch(`${DIRECTUS_URL}/items/posts?fields=id,title,content`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data;
}

function htmlToTiptapJson(html) {
  if (!html) return null;

  // generateJSON converts HTML to Tiptap's ProseMirror JSON format
  return generateJSON(html, extensions);
}

async function updatePost(id, jsonContent) {
  const response = await fetch(`${DIRECTUS_URL}/items/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: JSON.stringify(jsonContent) })
  });

  if (!response.ok) {
    throw new Error(`Failed to update post ${id}: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  await login();

  console.log('Fetching posts...');
  const posts = await fetchPosts();
  console.log(`Found ${posts.length} posts\n`);

  for (const post of posts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Post ${post.id}: ${post.title}`);
    console.log('='.repeat(60));

    if (!post.content) {
      console.log('⚠ No content, skipping');
      continue;
    }

    // Check if already JSON
    try {
      const parsed = JSON.parse(post.content);
      if (parsed.type === 'doc') {
        console.log('✓ Already in Tiptap JSON format, skipping');
        continue;
      }
    } catch {
      // Not JSON, proceed with conversion
    }

    console.log(`HTML length: ${post.content.length} chars`);

    const json = htmlToTiptapJson(post.content);
    console.log(`JSON nodes: ${json.content?.length || 0}`);
    console.log(`JSON preview: ${JSON.stringify(json).substring(0, 200)}...`);

    if (!dryRun) {
      console.log('\nUpdating post...');
      await updatePost(post.id, json);
      console.log('✓ Updated');
    } else {
      console.log('\n[DRY RUN] Would update post');
    }
  }

  console.log('\n✓ Migration complete');
}

main().catch(console.error);
