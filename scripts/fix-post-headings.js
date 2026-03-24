/**
 * Fix blog post headings - converts short paragraphs to proper heading tags
 */

const DIRECTUS_URL = 'https://directus.rapid-works.io';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || 'taxpurpose_frontend_token_2026';

// Patterns that indicate a heading (short, no period at end, looks like a title)
function isHeading(text) {
  const cleanText = text.replace(/<[^>]*>/g, '').trim();

  // Skip if too long (more than 100 chars)
  if (cleanText.length > 100) return false;

  // Skip if ends with period, question mark in middle of sentence, etc.
  if (cleanText.endsWith('.') && !cleanText.match(/\d\./)) return false;

  // Skip if it's metadata (Veröffentlicht, Lesezeit, Kategorie)
  if (cleanText.match(/^(Veröffentlicht|Lesezeit|Kategorie|Nutzung von KI)/)) return false;

  // Skip if contains <br> (indicates multi-line, not a heading)
  if (text.includes('<br')) return false;

  // Skip numbered list items that start with just a number
  if (cleanText.match(/^\d+\.\s*$/)) return false;

  // Known heading patterns
  const headingPatterns = [
    /^(Warum|Was ist|Wie|Die|Der|Das|Ein|Eine|Drei|Vier|Fünf|Fazit|Beispiel|Replikation|Andere)/i,
    /^[\d]+\.\s+[A-ZÄÖÜ]/,  // Numbered headings like "1. Too Good To Go"
    /Unternehmen|Entrepreneur|Definition|Fallbeispiele|Kernmerkmale|Herausforderung/i,
    /Messbark|Skalierung|Finanzierung|Rechtsform|Verantwortung/i
  ];

  return headingPatterns.some(pattern => cleanText.match(pattern));
}

function fixHeadings(html) {
  // Split by paragraphs and process
  let result = html;

  // Find all <p>...</p> tags
  const pTags = html.match(/<p[^>]*>.*?<\/p>/gi) || [];

  for (const pTag of pTags) {
    const content = pTag.replace(/<\/?p[^>]*>/gi, '');

    if (isHeading(content)) {
      // Determine heading level based on content
      let level = 'h2';

      // Sub-headings (within sections)
      if (content.match(/^(Das Problem|Die Lösung|Das Modell|Die Zahlen|Das Besondere|Steuerliche)/)) {
        level = 'h3';
      }

      // Replace <p> with heading
      const newTag = `<${level}>${content}</${level}>`;
      result = result.replace(pTag, newTag);
    }
  }

  // Also fix the metadata section - wrap in a styled div
  result = result.replace(
    /<p>(Veröffentlicht:.*?<br\s*\/?>\s*Lesezeit:.*?<br\s*\/?>\s*Kategorie:.*?<br\s*\/?>\s*<strong>Nutzung von KI:<\/strong>.*?)<\/p>/gi,
    '<div class="post-meta text-sm text-gray-500 mb-8 p-4 bg-gray-50 rounded-lg">$1</div>'
  );

  return result;
}

async function fixPosts() {
  // Get all posts
  const response = await fetch(`${DIRECTUS_URL}/items/posts?fields=id,title,content`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });

  const data = await response.json();

  if (!data.data) {
    console.error('Failed to fetch posts:', data);
    return;
  }

  for (const post of data.data) {
    console.log(`\nProcessing: ${post.title}`);

    const fixedContent = fixHeadings(post.content);

    if (fixedContent !== post.content) {
      // Update the post
      const updateResponse = await fetch(`${DIRECTUS_URL}/items/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: fixedContent })
      });

      if (updateResponse.ok) {
        console.log(`  ✓ Updated post ${post.id}`);
      } else {
        const err = await updateResponse.json();
        console.log(`  ✗ Failed:`, err);
      }
    } else {
      console.log('  No changes needed');
    }
  }
}

fixPosts().catch(console.error);
