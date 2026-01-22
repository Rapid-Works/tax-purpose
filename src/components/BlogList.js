import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { ArrowRight, Calendar, ArrowLeft } from 'lucide-react';

const builder = imageUrlBuilder(client);
const urlFor = (source) => builder.image(source);

const BlogList = ({ t, lang }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 9;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        const query = `{
          "posts": *[_type == "post"] | order(publishedAt desc)[$start...$end] {
            _id,
            title,
            slug,
            publishedAt,
            image,
            "summary": array::join(string::split((pt::text(body)), "")[0...150], "") + "..."
          },
          "total": count(*[_type == "post"])
        }`;

        const result = await client.fetch(query, { start, end });
        setPosts(result.posts || []);
        setHasMore(result.total > end);
        setError(null);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError(err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white py-16 border-b border-primary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'de' ? 'Zurück zur Startseite' : 'Back to Home'}
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-text font-serif">
            {t.blog?.title || 'Blog'}
          </h1>
          <p className="mt-4 text-lg text-text/70 max-w-2xl">
            {t.blog?.description || (lang === 'de'
              ? 'Erfahre mehr über nachhaltige Steuerstrategien und aktuelle Entwicklungen im Bereich Purpose Economy.'
              : 'Learn more about sustainable tax strategies and current developments in the purpose economy.')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-text/70">
              {lang === 'de'
                ? 'Fehler beim Laden der Beiträge. Bitte versuche es später erneut.'
                : 'Error loading posts. Please try again later.'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text/70">
              {lang === 'de'
                ? 'Noch keine Blogbeiträge vorhanden.'
                : 'No blog posts yet.'}
            </p>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && posts.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article
                key={post._id || index}
                className="group relative bg-white rounded-2xl overflow-hidden border border-primary/10 hover:border-accent/20 hover:shadow-xl transition-all duration-500"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image ? urlFor(post.image).width(800).url() : 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'}
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-text/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-text group-hover:text-accent transition-colors duration-300 font-serif mb-3 line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Summary */}
                  <p className="text-text/70 text-sm line-clamp-3 mb-4">
                    {post.summary}
                  </p>

                  {/* Read More Link */}
                  <Link
                    to={`/blog/${post.slug.current}`}
                    className="inline-flex items-center gap-2 text-accent font-medium text-sm group/link"
                  >
                    {lang === 'de' ? 'Weiterlesen' : 'Read more'}
                    <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && posts.length > 0 && (
          <div className="flex justify-center gap-4 mt-12">
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-medium text-accent border-2 border-accent/30 hover:bg-accent/5 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                {lang === 'de' ? 'Vorherige' : 'Previous'}
              </button>
            )}
            {hasMore && (
              <button
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-medium text-accent border-2 border-accent/30 hover:bg-accent/5 transition-all duration-300"
              >
                {lang === 'de' ? 'Nächste' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
