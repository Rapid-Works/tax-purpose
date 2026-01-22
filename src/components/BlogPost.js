import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { client } from '../sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { PortableText } from '@portabletext/react';
import { ArrowLeft, Calendar } from 'lucide-react';

const builder = imageUrlBuilder(client);
const urlFor = (source) => builder.image(source);

const BlogPost = ({ t, lang }) => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const query = `*[_type == "post" && slug.current == $slug][0] {
          _id,
          title,
          slug,
          publishedAt,
          image,
          body
        }`;
        const result = await client.fetch(query, { slug });
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
      {/* Hero Section with Featured Image */}
      {post.image && (
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={urlFor(post.image).width(1200).url()}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
        </div>
      )}

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

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-text/60 mb-8 pb-8 border-b border-primary/20">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(post.publishedAt)}
          </span>
        </div>

        {/* Body Content */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:text-text prose-headings:font-serif
            prose-p:text-text/80 prose-p:leading-relaxed
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-strong:text-text
            prose-ul:text-text/80 prose-ol:text-text/80
            prose-li:marker:text-accent
            prose-blockquote:border-l-accent prose-blockquote:text-text/70 prose-blockquote:italic
            prose-img:rounded-xl prose-img:shadow-lg
            prose-figcaption:text-text/60 prose-figcaption:text-center"
        >
          {Array.isArray(post.body) && <PortableText value={post.body} />}
        </div>

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
