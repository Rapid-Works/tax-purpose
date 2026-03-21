/**
 * Test script to debug Directus SDK connection
 */

const { createDirectus, rest, readItems, staticToken } = require('@directus/sdk');

const directusUrl = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const directusToken = process.env.REACT_APP_DIRECTUS_TOKEN || 'taxpurpose_frontend_token_2026';
const clientSlug = process.env.REACT_APP_CLIENT_SLUG || 'tax-purpose';

console.log('Config:');
console.log('  URL:', directusUrl);
console.log('  Token:', directusToken ? directusToken.substring(0, 10) + '...' : 'MISSING');
console.log('  Client:', clientSlug);

const client = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

async function test() {
  try {
    console.log('\nFetching posts...');
    const posts = await client.request(
      readItems('posts', {
        limit: 3,
        sort: ['-id'],
        filter: {
          status: { _eq: 'published' },
          client: { slug: { _eq: clientSlug } }
        },
        fields: ['id', 'slug', 'title', 'summary', 'featured_image', 'status']
      })
    );

    console.log(`\nFound ${posts.length} posts:`);
    posts.forEach((post, i) => {
      console.log(`  ${i + 1}. ${post.title}`);
      console.log(`     Slug: ${post.slug}`);
    });
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

test();
