import { useState, useEffect } from 'react';
import { getCourses, getCourseImageUrl, formatPrice, formatCourseDate } from '../directus/courses';
import { Calendar, MapPin, Users, Euro, ArrowRight } from 'lucide-react';
import CourseRegistration from './CourseRegistration';

const Courses = ({ t, lang }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const result = await getCourses();
        setCourses(result || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [lang]);

  const handleRegisterClick = (course) => {
    setSelectedCourse(course);
    setShowRegistration(true);
  };

  const handleCloseRegistration = () => {
    setShowRegistration(false);
    setSelectedCourse(null);
  };

  const texts = {
    de: {
      tag: 'Kurse & Workshops',
      title: 'Weiterbildung mit Purpose',
      description: 'Entdecken Sie unsere Kurse zu nachhaltiger Steuerplanung und Purpose Economy.',
      free: 'Kostenlos',
      register: 'Anmelden',
      learnMore: 'Mehr erfahren',
      online: 'Online',
      spots: 'Plätze',
      unlimited: 'Unbegrenzt',
      noCourses: 'Aktuell sind keine Kurse verfügbar.',
      checkBack: 'Schauen Sie bald wieder vorbei!'
    },
    en: {
      tag: 'Courses & Workshops',
      title: 'Education with Purpose',
      description: 'Discover our courses on sustainable tax planning and the purpose economy.',
      free: 'Free',
      register: 'Register',
      learnMore: 'Learn more',
      online: 'Online',
      spots: 'spots',
      unlimited: 'Unlimited',
      noCourses: 'No courses are currently available.',
      checkBack: 'Check back soon!'
    }
  };

  const txt = texts[lang] || texts.de;

  return (
    <>
      <section className="py-24 relative bg-background overflow-hidden min-h-screen">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(232,189,230,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(232,189,230,0.1)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex px-4 py-1.5 text-sm font-medium bg-accent text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              {txt.tag}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-text font-serif">
              {txt.title}
            </h1>
            <p className="mt-4 text-lg text-text/90 max-w-2xl mx-auto font-light">
              {txt.description}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          )}

          {/* No Courses Message */}
          {!loading && courses.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-text mb-2">{txt.noCourses}</h3>
              <p className="text-text/70">{txt.checkBack}</p>
            </div>
          )}

          {/* Courses Grid */}
          {!loading && courses.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-primary/10 hover:border-accent/20 hover:shadow-xl transition-all duration-500 flex flex-col"
                >
                  {/* Image */}
                  {course.featured_image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getCourseImageUrl(course.featured_image)}
                        alt={course.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-lg ${
                          course.is_free || course.price === 0
                            ? 'bg-accent text-white'
                            : 'bg-white text-text'
                        }`}>
                          {course.is_free || course.price === 0
                            ? txt.free
                            : formatPrice(course.price, course.currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* No Image - Show Price Badge */}
                  {!course.featured_image && (
                    <div className="p-4 pt-6 flex justify-end">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        course.is_free || course.price === 0
                          ? 'bg-accent text-white'
                          : 'bg-secondary text-text'
                      }`}>
                        {course.is_free || course.price === 0
                          ? txt.free
                          : formatPrice(course.price, course.currency)}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-text group-hover:text-accent transition-colors duration-300 font-serif mb-3">
                      {course.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-text/70 text-sm line-clamp-3 mb-4 flex-1">
                      {course.summary}
                    </p>

                    {/* Meta Info */}
                    <div className="space-y-2 mb-6 text-sm text-text/60">
                      {course.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-accent" />
                          <span>{formatCourseDate(course.start_date, lang)}</span>
                        </div>
                      )}
                      {course.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-accent" />
                          <span>{course.location === 'Online' ? txt.online : course.location}</span>
                        </div>
                      )}
                      {course.max_participants && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-accent" />
                          <span>{course.max_participants} {txt.spots}</span>
                        </div>
                      )}
                      {!course.is_free && course.price > 0 && !course.featured_image && (
                        <div className="flex items-center gap-2">
                          <Euro className="w-4 h-4 text-accent" />
                          <span>{formatPrice(course.price, course.currency)}</span>
                        </div>
                      )}
                    </div>

                    {/* Register Button */}
                    <button
                      onClick={() => handleRegisterClick(course)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-medium bg-accent text-white hover:bg-accent/90 transition-all duration-300 shadow-md hover:shadow-xl group/btn"
                    >
                      {txt.register}
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Registration Modal */}
      {showRegistration && selectedCourse && (
        <CourseRegistration
          course={selectedCourse}
          lang={lang}
          onClose={handleCloseRegistration}
        />
      )}
    </>
  );
};

export default Courses;
