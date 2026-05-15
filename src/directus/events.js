import { createDirectus, rest, readItems, createItem } from '@directus/sdk';

const directusUrl = process.env.REACT_APP_DIRECTUS_URL;

// Tax & Purpose client ID is 1
const CLIENT_ID = 1;

const client = createDirectus(directusUrl).with(rest());

/**
 * Get all published events for the current client
 */
export async function getEvents() {
  try {
    const events = await client.request(
      readItems('events', {
        sort: ['date'],
        filter: {
          status: { _eq: 'published' },
          client: { _eq: CLIENT_ID }
        },
        fields: [
          'id',
          'slug',
          'title',
          'summary',
          'description',
          'cover_image',
          'date',
          'end_date',
          'location',
          'is_online',
          'online_link',
          'is_free',
          'price',
          'currency',
          'capacity',
          'registration_open',
          'status'
        ]
      })
    );
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

/**
 * Get upcoming events only
 */
export async function getUpcomingEvents() {
  try {
    const now = new Date().toISOString();
    const events = await client.request(
      readItems('events', {
        sort: ['date'],
        filter: {
          status: { _eq: 'published' },
          client: { _eq: CLIENT_ID },
          date: { _gte: now }
        },
        fields: [
          'id',
          'slug',
          'title',
          'summary',
          'cover_image',
          'date',
          'end_date',
          'location',
          'is_online',
          'is_free',
          'price',
          'currency',
          'capacity',
          'registration_open'
        ]
      })
    );
    return events;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

/**
 * Get a single event by slug
 */
export async function getEventBySlug(slug) {
  try {
    const events = await client.request(
      readItems('events', {
        filter: {
          slug: { _eq: slug },
          client: { _eq: CLIENT_ID }
        },
        fields: [
          'id',
          'slug',
          'title',
          'summary',
          'description',
          'cover_image',
          'date',
          'end_date',
          'location',
          'is_online',
          'online_link',
          'is_free',
          'price',
          'currency',
          'capacity',
          'registration_open',
          'status'
        ]
      })
    );
    return events[0] || null;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

/**
 * Get the number of registrations for an event
 */
export async function getEventRegistrationCount(eventId) {
  try {
    const registrations = await client.request(
      readItems('event_registrations', {
        filter: {
          event: { _eq: eventId },
          status: { _in: ['free', 'paid', 'confirmed'] }
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
 * Check if an event has available spots
 */
export async function hasAvailableSpots(eventId, capacity) {
  if (!capacity) return true; // No capacity limit
  const count = await getEventRegistrationCount(eventId);
  return count < capacity;
}

/**
 * Register for a free event
 */
export async function registerForFreeEvent(eventId, registrationData) {
  try {
    const registration = await client.request(
      createItem('event_registrations', {
        ...registrationData,
        event: eventId,
        client: CLIENT_ID,
        status: 'free',
        registered_at: new Date().toISOString()
      })
    );

    return { success: true, registration };
  } catch (error) {
    console.error('Error registering for event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a pending registration for a paid event
 * The actual payment will be handled by Directus Flows + Paystack
 */
export async function createPaidEventRegistration(eventId, registrationData) {
  try {
    const registration = await client.request(
      createItem('event_registrations', {
        ...registrationData,
        event: eventId,
        client: CLIENT_ID,
        status: 'pending',
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
export function getEventImageUrl(imageId) {
  if (!imageId) return null;
  return `${directusUrl}/assets/${imageId}`;
}

/**
 * Format price for display
 */
export function formatEventPrice(price, currency = 'GHS') {
  if (price === 0 || price === null || price === undefined) {
    return null; // Free
  }

  // Ghana Cedis formatting
  if (currency === 'GHS') {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(price);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Format date for display
 */
export function formatEventDate(dateString, lang = 'en') {
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

/**
 * Format date range for display
 */
export function formatEventDateRange(startDate, endDate, lang = 'en') {
  if (!startDate) return null;

  const start = new Date(startDate);
  const locale = lang === 'de' ? 'de-DE' : 'en-US';

  if (!endDate) {
    return formatEventDate(startDate, lang);
  }

  const end = new Date(endDate);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    // Same day: "Monday, January 15, 2026, 10:00 AM - 2:00 PM"
    const dateStr = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(start);

    const startTime = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(start);

    const endTime = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(end);

    return `${dateStr}, ${startTime} - ${endTime}`;
  }

  // Different days
  return `${formatEventDate(startDate, lang)} - ${formatEventDate(endDate, lang)}`;
}

export default client;
