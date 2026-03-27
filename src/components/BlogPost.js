import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostBySlug } from '../directus/client';
import { ArrowLeft, Calendar } from 'lucide-react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

const BlogPost = ({ t, lang }) => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert Tiptap JSON to HTML (handles both JSON and legacy HTML content)
  const contentHtml = useMemo(() => {
    if (!post?.content) return '';

    // If content is already HTML string (legacy), return as-is
    if (typeof post.content === 'string') {
      // Check if it looks like HTML (starts with < or contains HTML tags)
      if (post.content.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(post.content)) {
        return post.content;
      }
      // Try parsing as JSON string
      try {
        const parsed = JSON.parse(post.content);
        if (parsed.type === 'doc') {
          return generateHTML(parsed, [StarterKit]);
        }
      } catch {
        return post.content;
      }
    }

    // If content is Tiptap JSON object
    if (typeof post.content === 'object' && post.content.type === 'doc') {
      return generateHTML(post.content, [StarterKit]);
    }

    return '';
  }, [post?.content]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const result = await getPostBySlug(slug);
        setPost(result || null);
        setError(null);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-text mb-4">
            {lang === 'de' ? 'Beitrag nicht gefunden' : 'Post not found'}
          </h1>
          <p className="text-text/70 mb-8">
            {lang === 'de'
              ? 'Der gesuchte Blogbeitrag existiert nicht oder wurde entfernt.'
              : 'The blog post you are looking for does not exist or has been removed.'}
          </p>
          <Link
            to="/#blog"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'de' ? 'Zurück zum Blog' : 'Back to Blog'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-background">
      {/* Hero Section with Featured Image - hidden for now */}
      {/* {post.featured_image && (
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={getImageUrl(post.featured_image)}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
        </div>
      )} */}

      {/* Content */}
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          to="/#blog"
          className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'de' ? 'Zurück zum Blog' : 'Back to Blog'}
        </Link>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text font-serif mb-6">
          {post.title}
        </h1>

        {/* Meta - only show if date is available */}
        {post.date_created && (
          <div className="flex flex-wrap items-center gap-4 text-text/60 mb-8 pb-8 border-b border-primary/20">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date_created)}
            </span>
          </div>
        )}

        {/* Body Content */}
        {contentHtml && (
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-text prose-headings:font-serif
              prose-h2:mt-8 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-text/80 prose-p:leading-normal prose-p:mb-2
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-text
              prose-ul:text-text/80 prose-ul:my-2 prose-ol:text-text/80 prose-ol:my-2
              prose-li:marker:text-accent prose-li:mb-1
              prose-blockquote:border-l-accent prose-blockquote:text-text/70 prose-blockquote:italic
              prose-img:rounded-xl prose-img:shadow-lg
              prose-figcaption:text-text/60 prose-figcaption:text-center
              prose-table:my-4"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}

        {/* Bottom Navigation */}
        <div className="mt-12 pt-8 border-t border-primary/20">
          <Link
            to="/#blog"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-medium text-accent border-2 border-accent/30 hover:bg-accent/5 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'de' ? 'Alle Beiträge ansehen' : 'View all posts'}
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogPost;
