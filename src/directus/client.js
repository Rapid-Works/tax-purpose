import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const directusUrl = process.env.REACT_APP_DIRECTUS_URL;
const directusToken = process.env.REACT_APP_DIRECTUS_TOKEN;
const clientSlug = process.env.REACT_APP_CLIENT_SLUG;

const client = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

// Helper function to get posts (filtered by client)
export async function getPosts(limit = 10) {
  try {
    const posts = await client.request(
      readItems('posts', {
        limit,
        sort: ['sort', '-date_created'],
        filter: {
          status: { _eq: 'published' },
          client: { slug: { _eq: clientSlug } }
        },
        fields: ['id', 'slug', 'title', 'summary', 'featured_image', 'status', 'date_created', 'sort']
      })
    );
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Helper function to get paginated posts with hasMore check (filtered by client)
export async function getPostsPaginated(page = 1, pageSize = 9) {
  try {
    const offset = (page - 1) * pageSize;
    // Fetch one more than needed to check if there are more pages
    const posts = await client.request(
      readItems('posts', {
        limit: pageSize + 1,
        offset,
        sort: ['sort', '-date_created'],
        filter: {
          status: { _eq: 'published' },
          client: { slug: { _eq: clientSlug } }
        },
        fields: ['id', 'slug', 'title', 'summary', 'featured_image', 'status', 'date_created', 'sort']
      })
    );

    const hasMore = posts.length > pageSize;
    const displayPosts = hasMore ? posts.slice(0, pageSize) : posts;

    return { posts: displayPosts, hasMore };
  } catch (error) {
    console.error('Error fetching paginated posts:', error);
    return { posts: [], hasMore: false };
  }
}

// Helper function to get a single post by slug (filtered by client)
export async function getPostBySlug(slug) {
  try {
    const posts = await client.request(
      readItems('posts', {
        filter: {
          slug: { _eq: slug },
          client: { slug: { _eq: clientSlug } }
        },
        fields: ['id', 'slug', 'title', 'summary', 'content', 'featured_image', 'status']
      })
    );
    return posts[0] || null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Helper to get image URL
export function getImageUrl(imageId) {
  if (!imageId) return null;
  return `${directusUrl}/assets/${imageId}`;
}

export default client;
