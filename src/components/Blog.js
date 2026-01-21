import { useState, useEffect } from 'react';
import Butter from 'buttercms';
import { ArrowRight, Calendar } from 'lucide-react';

// Initialize ButterCMS - Replace with your API key
const butter = Butter(process.env.REACT_APP_BUTTER_CMS_API_KEY || 'your_api_key_here');

const Blog = ({ t, lang }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await butter.post.list({
          page: 1,
          page_size: 3
        });
        setPosts(response?.data?.data || []);
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
  }, [lang]);

  // Placeholder posts for when there are no blog posts yet or API key not configured
  const placeholderPosts = [
    {
      slug: 'sustainable-tax-planning',
      title: lang === 'de' ? 'Nachhaltige Steuerplanung für Sozialunternehmen' : 'Sustainable Tax Planning for Social Enterprises',
      summary: lang === 'de'
        ? 'Erfahre, wie du als Sozialunternehmer steuerliche Vorteile nutzen und gleichzeitig gesellschaftliche Wirkung erzielen kannst.'
        : 'Learn how social entrepreneurs can leverage tax benefits while creating societal impact.',
      featured_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      published: '2025-01-15',
      tags: [{ name: lang === 'de' ? 'Steuerplanung' : 'Tax Planning' }]
    },
    {
      slug: 'esg-tax-reporting',
      title: lang === 'de' ? 'ESG und steuerliche Berichterstattung' : 'ESG and Tax Reporting',
      summary: lang === 'de'
        ? 'Die Bedeutung der steuerlichen Transparenz im Rahmen der Nachhaltigkeitsberichterstattung (CSRD).'
        : 'The importance of tax transparency in sustainability reporting (CSRD).',
      featured_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      published: '2025-01-10',
      tags: [{ name: 'ESG' }]
    },
    {
      slug: 'steward-ownership-tax',
      title: lang === 'de' ? 'Verantwortungseigentum: Steuerliche Aspekte' : 'Steward Ownership: Tax Considerations',
      summary: lang === 'de'
        ? 'Ein Überblick über die steuerlichen Implikationen von Verantwortungseigentum und Purpose-Unternehmen.'
        : 'An overview of the tax implications of steward ownership and purpose-driven companies.',
      featured_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      published: '2025-01-05',
      tags: [{ name: lang === 'de' ? 'Verantwortungseigentum' : 'Steward Ownership' }]
    }
  ];

  const displayPosts = posts.length > 0 ? posts : placeholderPosts;
  const isPlaceholder = posts.length === 0 && !loading;

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
                key={post.slug || index}
                className="group relative bg-white rounded-2xl overflow-hidden border border-primary/10 hover:border-accent/20 hover:shadow-xl transition-all duration-500"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.featured_image || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'}
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm text-accent rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-text/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(post.published)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-text group-hover:text-accent transition-colors duration-300 font-serif mb-3 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-text/70 text-sm line-clamp-3 mb-4">
                    {post.summary || post.meta_description}
                  </p>

                  {/* Read More Link */}
                  <a
                    href={isPlaceholder ? '#contact' : `/blog/${post.slug}`}
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

        {/* Placeholder notice */}
        {isPlaceholder && !error && (
          <p className="text-center text-text/60 text-sm mt-8 italic">
            {lang === 'de'
              ? 'Blog-Beiträge werden demnächst verfügbar sein. Kontaktiere mich für aktuelle Einblicke!'
              : 'Blog posts coming soon. Contact me for the latest insights!'}
          </p>
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
