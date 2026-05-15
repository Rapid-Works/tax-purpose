import { createDirectus, rest, readItems, createItem } from '@directus/sdk';

const directusUrl = process.env.REACT_APP_DIRECTUS_URL;

// Tax & Purpose client ID is 1
const CLIENT_ID = 1;

const client = createDirectus(directusUrl).with(rest());

/**
 * Get all published courses for the current client
 */
export async function getCourses() {
  try {
    const courses = await client.request(
      readItems('courses', {
        sort: ['sort'],
        fields: [
          'id',
          'slug',
          'title',
          'summary',
          'description',
          'featured_image',
          'price',
          'currency',
          'is_free',
          'max_participants',
          'start_date',
          'end_date',
          'location',
          'status'
        ]
      })
    );
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

/**
 * Get a single course by slug
 */
export async function getCourseBySlug(slug) {
  try {
    const courses = await client.request(
      readItems('courses', {
        filter: {
          slug: { _eq: slug }
        },
        fields: [
          'id',
          'slug',
          'title',
          'summary',
          'description',
          'featured_image',
          'price',
          'currency',
          'is_free',
          'max_participants',
          'start_date',
          'end_date',
          'location',
          'status'
        ]
      })
    );
    return courses[0] || null;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

/**
 * Get the number of registrations for a course
 */
export async function getCourseRegistrationCount(courseId) {
  try {
    const registrations = await client.request(
      readItems('course_registrations', {
        filter: {
          course: { _eq: courseId },
          payment_status: { _in: ['free', 'paid'] }
        },
        aggregate: { count: '*' }
      })
    );
    return registrations[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching registration count:', error);
    return 0;
  }
}

/**
 * Register for a free course
 */
export async function registerForFreeCourse(courseId, registrationData) {
  try {
    const registration = await client.request(
      createItem('course_registrations', {
        ...registrationData,
        course: courseId,
        client: CLIENT_ID,
        payment_status: 'free',
        registered_at: new Date().toISOString()
      })
    );

    return { success: true, registration };
  } catch (error) {
    console.error('Error registering for course:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a pending registration for a paid course
 * The actual payment will be handled by Directus Flows
 */
export async function createPaidCourseRegistration(courseId, registrationData) {
  try {
    const registration = await client.request(
      createItem('course_registrations', {
        ...registrationData,
        course: courseId,
        client: CLIENT_ID,
        payment_status: 'pending',
        registered_at: new Date().toISOString()
      })
    );

    return { success: true, registration };
  } catch (error) {
    console.error('Error creating registration:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to get image URL
 */
export function getCourseImageUrl(imageId) {
  if (!imageId) return null;
  return `${directusUrl}/assets/${imageId}`;
}

/**
 * Format price for display
 */
export function formatPrice(price, currency = 'EUR') {
  if (price === 0 || price === null || price === undefined) {
    return null; // Free
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Format date for display
 */
export function formatCourseDate(dateString, lang = 'de') {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default client;
