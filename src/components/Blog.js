import { useState, useEffect } from 'react';
import { getPosts } from '../directus/client';
import { ArrowRight, Calendar } from 'lucide-react';

const Blog = ({ t, lang }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const result = await getPosts(3);
        setPosts(result || []);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [lang]);

  const displayPosts = posts;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section id="blog" className="py-24 relative bg-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(232,189,230,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(232,189,230,0.1)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex px-4 py-1.5 text-sm font-medium bg-accent text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            {t.blog?.tag || (lang === 'de' ? 'Blog' : 'Blog')}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-text font-serif">
            {t.blog?.title || (lang === 'de' ? 'Aktuelle Einblicke' : 'Latest Insights')}
          </h2>
          <p className="mt-4 text-lg text-text/90 max-w-2xl mx-auto font-light">
            {t.blog?.description || (lang === 'de'
              ? 'Erfahre mehr über nachhaltige Steuerstrategien und aktuelle Entwicklungen im Bereich Purpose Economy.'
              : 'Learn more about sustainable tax strategies and current developments in the purpose economy.')}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {displayPosts.map((post, index) => (
              <article
                key={post.id || index}
                className="group relative bg-white rounded-2xl overflow-hidden border border-primary/10 hover:border-accent/20 hover:shadow-xl transition-all duration-500"
              >
                {/* Image - hidden for now */}
                {/* <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.featured_image ? getImageUrl(post.featured_image) : 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'}
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div> */}

                {/* Content */}
                <div className="p-6">
                  {/* Meta - only show if date is available */}
                  {post.date_created && (
                    <div className="flex items-center gap-4 text-sm text-text/60 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.date_created)}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-text group-hover:text-accent transition-colors duration-300 font-serif mb-3">
                    {post.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-text/70 text-sm line-clamp-3 mb-4">
                    {post.summary}
                  </p>

                  {/* Read More Link */}
                  <a
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-accent font-medium text-sm group/link"
                  >
                    {lang === 'de' ? 'Weiterlesen' : 'Read more'}
                    <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform duration-300" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* View All Button - only show if there are actual posts */}
        {posts.length > 0 && (
          <div className="text-center mt-12">
            <a
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium text-accent border-2 border-accent/30 hover:bg-accent/5 transition-all duration-300 group"
            >
              {lang === 'de' ? 'Alle Beiträge ansehen' : 'View all posts'}
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default Blog;
