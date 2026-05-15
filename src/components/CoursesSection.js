import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { getCourses, getCourseImageUrl, formatPrice, formatCourseDate } from '../directus/courses';

const CoursesSection = ({ t, lang }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        // Show only first 3 published courses
        setCourses(data.filter(c => c.status === 'published').slice(0, 3));
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <section id="courses" className="py-24 relative bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex justify-center">
            <div className="h-8 w-48 bg-primary/20 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null; // Don't show section if no courses
  }

  return (
    <section id="courses" className="py-24 relative bg-gradient-to-b from-white to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex px-4 py-1.5 text-sm font-medium bg-accent/90 text-white rounded-full shadow-sm mb-4">
            {t.courses.tag}
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-text font-serif">
            {t.courses.title}
          </h2>
          <p className="text-lg text-text/80 max-w-2xl mx-auto">
            {t.courses.description}
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-primary/10 hover:border-accent/20 flex flex-col"
            >
              {/* Image */}
              {course.featured_image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getCourseImageUrl(course.featured_image)}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {course.is_free && (
                    <span className="absolute top-4 right-4 bg-accent text-white text-sm font-medium px-3 py-1 rounded-full">
                      {t.courses.free}
                    </span>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-text font-serif mb-2 group-hover:text-accent transition-colors">
                  {course.title}
                </h3>

                {course.summary && (
                  <p className="text-text/70 text-sm mb-4 line-clamp-2">
                    {course.summary}
                  </p>
                )}

                {/* Meta info */}
                <div className="space-y-2 mb-4 text-sm text-text/60">
                  {course.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatCourseDate(course.start_date, lang)}</span>
                    </div>
                  )}
                  {course.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{course.location === 'Online' ? t.courses.online : course.location}</span>
                    </div>
                  )}
                  {course.max_participants && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{course.max_participants} {t.courses.spotsLeft}</span>
                    </div>
                  )}
                </div>

                {/* Price & CTA */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-primary/10">
                  <span className={`font-semibold ${course.is_free ? 'text-accent' : 'text-text'}`}>
                    {course.is_free ? t.courses.free : formatPrice(course.price, course.currency)}
                  </span>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-1 text-accent font-medium hover:gap-2 transition-all"
                  >
                    {t.courses.register}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            {t.courses.viewAll}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
