/**
 * Directus Events Setup Script
 *
 * Creates the events and event_registrations collections for the events feature.
 *
 * Usage:
 *   DIRECTUS_ADMIN_TOKEN=your_admin_token node scripts/setup-events.js
 */

const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('Error: DIRECTUS_ADMIN_TOKEN environment variable is required');
  console.error('Usage: DIRECTUS_ADMIN_TOKEN=your_token node scripts/setup-events.js');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, options);

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`API Error: ${JSON.stringify(data)}`);
  }
  return data;
}

async function collectionExists(name) {
  try {
    await apiRequest(`/collections/${name}`);
    return true;
  } catch {
    return false;
  }
}

async function createEventsCollection() {
  console.log('Creating events collection...');

  if (await collectionExists('events')) {
    console.log('  → events collection already exists, skipping');
    return;
  }

  // Create collection
  await apiRequest('/collections', 'POST', {
    collection: 'events',
    meta: {
      icon: 'event',
      note: 'Events available for registration (multi-tenant)'
    },
    schema: {}
  });

  // Add fields
  const fields = [
    {
      field: 'title',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'Event title' },
      schema: { is_nullable: false }
    },
    {
      field: 'slug',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'URL slug' },
      schema: { is_nullable: false }
    },
    {
      field: 'summary',
      type: 'string',
      meta: { interface: 'input', note: 'Short description for event cards' },
      schema: {}
    },
    {
      field: 'description',
      type: 'text',
      meta: { interface: 'input-rich-text-html', note: 'Full event description' },
      schema: {}
    },
    {
      field: 'cover_image',
      type: 'uuid',
      meta: { interface: 'file-image', note: 'Event cover image' },
      schema: {}
    },
    {
      field: 'date',
      type: 'timestamp',
      meta: { interface: 'datetime', required: true, note: 'Event start date/time' },
      schema: { is_nullable: false }
    },
    {
      field: 'end_date',
      type: 'timestamp',
      meta: { interface: 'datetime', note: 'Event end date/time (optional)' },
      schema: {}
    },
    {
      field: 'location',
      type: 'string',
      meta: { interface: 'input', note: 'Physical location/venue' },
      schema: {}
    },
    {
      field: 'is_online',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        note: 'Is this an online event?',
        default_value: false
      },
      schema: { default_value: false }
    },
    {
      field: 'online_link',
      type: 'string',
      meta: { interface: 'input', note: 'Online meeting link (shown after registration)' },
      schema: {}
    },
    {
      field: 'is_free',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        note: 'Is this a free event?',
        default_value: true
      },
      schema: { default_value: true }
    },
    {
      field: 'price',
      type: 'decimal',
      meta: {
        interface: 'input',
        note: 'Price (0 = free)',
        options: { min: 0 }
      },
      schema: { numeric_precision: 10, numeric_scale: 2, default_value: 0 }
    },
    {
      field: 'currency',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Ghana Cedis (GHS)', value: 'GHS' },
            { text: 'US Dollars (USD)', value: 'USD' },
            { text: 'Euro (EUR)', value: 'EUR' }
          ]
        },
        default_value: 'GHS'
      },
      schema: { default_value: 'GHS' }
    },
    {
      field: 'capacity',
      type: 'integer',
      meta: {
        interface: 'input',
        note: 'Maximum number of attendees (leave empty for unlimited)',
        options: { min: 0 }
      },
      schema: {}
    },
    {
      field: 'registration_open',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        note: 'Is registration currently open?',
        default_value: true
      },
      schema: { default_value: true }
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Draft', value: 'draft' },
            { text: 'Published', value: 'published' },
            { text: 'Cancelled', value: 'cancelled' },
            { text: 'Completed', value: 'completed' }
          ]
        },
        default_value: 'draft'
      },
      schema: { default_value: 'draft' }
    },
    {
      field: 'sort',
      type: 'integer',
      meta: { interface: 'input', note: 'Display order' },
      schema: {}
    },
    {
      field: 'client',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        note: 'Client this event belongs to',
        required: true
      },
      schema: {}
    }
  ];

  for (const field of fields) {
    await apiRequest('/fields/events', 'POST', field);
    console.log(`  + Added field: ${field.field}`);
  }

  // Create relation to clients
  await apiRequest('/relations', 'POST', {
    collection: 'events',
    field: 'client',
    related_collection: 'clients',
    meta: { one_field: 'events' }
  });
  console.log('  + Created client relationship');

  console.log('  ✓ events collection created');
}

async function createRegistrationsCollection() {
  console.log('Creating event_registrations collection...');

  if (await collectionExists('event_registrations')) {
    console.log('  → event_registrations collection already exists, skipping');
    return;
  }

  // Create collection
  await apiRequest('/collections', 'POST', {
    collection: 'event_registrations',
    meta: {
      icon: 'how_to_reg',
      note: 'Event registrations/signups (multi-tenant)'
    },
    schema: {}
  });

  // Add fields
  const fields = [
    {
      field: 'first_name',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'First name' },
      schema: { is_nullable: false }
    },
    {
      field: 'last_name',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'Last name' },
      schema: { is_nullable: false }
    },
    {
      field: 'email',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'Email address' },
      schema: { is_nullable: false }
    },
    {
      field: 'phone',
      type: 'string',
      meta: { interface: 'input', note: 'Phone number' },
      schema: {}
    },
    {
      field: 'company',
      type: 'string',
      meta: { interface: 'input', note: 'Company/Organization' },
      schema: {}
    },
    {
      field: 'notes',
      type: 'text',
      meta: { interface: 'input-multiline', note: 'Additional notes/questions' },
      schema: {}
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Free', value: 'free' },
            { text: 'Pending Payment', value: 'pending' },
            { text: 'Paid', value: 'paid' },
            { text: 'Confirmed', value: 'confirmed' },
            { text: 'Cancelled', value: 'cancelled' },
            { text: 'Refunded', value: 'refunded' }
          ]
        },
        default_value: 'free'
      },
      schema: { default_value: 'free' }
    },
    {
      field: 'payment_reference',
      type: 'string',
      meta: { interface: 'input', note: 'Paystack payment reference' },
      schema: {}
    },
    {
      field: 'payment_amount',
      type: 'decimal',
      meta: { interface: 'input', note: 'Amount paid' },
      schema: { numeric_precision: 10, numeric_scale: 2 }
    },
    {
      field: 'registered_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        note: 'Registration timestamp',
        readonly: true
      },
      schema: {}
    },
    {
      field: 'event',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        note: 'Event registered for',
        required: true
      },
      schema: {}
    },
    {
      field: 'client',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        note: 'Client (for multi-tenancy)',
        required: true
      },
      schema: {}
    }
  ];

  for (const field of fields) {
    await apiRequest('/fields/event_registrations', 'POST', field);
    console.log(`  + Added field: ${field.field}`);
  }

  // Create relation to events
  await apiRequest('/relations', 'POST', {
    collection: 'event_registrations',
    field: 'event',
    related_collection: 'events',
    meta: { one_field: 'registrations' }
  });
  console.log('  + Created event relationship');

  // Create relation to clients
  await apiRequest('/relations', 'POST', {
    collection: 'event_registrations',
    field: 'client',
    related_collection: 'clients',
    meta: { one_field: 'event_registrations' }
  });
  console.log('  + Created client relationship');

  console.log('  ✓ event_registrations collection created');
}

async function updatePublicApiPermissions() {
  console.log('Updating Public API permissions for events...');

  try {
    // Find the Public API policy
    const policies = await apiRequest('/policies?filter[name][_eq]=Public API Policy');
    if (!policies.data || policies.data.length === 0) {
      console.log('  → Public API Policy not found, skipping permissions');
      return;
    }

    const policyId = policies.data[0].id;

    // Add permissions for events
    const permissions = [
      {
        collection: 'events',
        action: 'read',
        fields: ['*'],
        permissions: { status: { _eq: 'published' } }
      },
      {
        collection: 'event_registrations',
        action: 'create',
        fields: ['first_name', 'last_name', 'email', 'phone', 'company', 'notes', 'event', 'client', 'status', 'registered_at'],
        permissions: {}
      }
    ];

    for (const perm of permissions) {
      try {
        await apiRequest('/permissions', 'POST', { policy: policyId, ...perm });
        console.log(`  + Added ${perm.action} permission for ${perm.collection}`);
      } catch (error) {
        // Permission might already exist
        console.log(`  → ${perm.action} permission for ${perm.collection} may already exist`);
      }
    }

    console.log('  ✓ Permissions updated');
  } catch (error) {
    console.error('  ✗ Error updating permissions:', error.message);
  }
}

async function updateEditorPermissions() {
  console.log('Updating Tax & Purpose Editor permissions for events...');

  try {
    // Find the editor policy
    const policies = await apiRequest('/policies?filter[name][_eq]=Tax %26 Purpose Editor Policy');
    if (!policies.data || policies.data.length === 0) {
      console.log('  → Tax & Purpose Editor Policy not found, skipping permissions');
      return;
    }

    const policyId = policies.data[0].id;
    const clientFilter = { client: { slug: { _eq: 'tax-purpose' } } };

    // Add permissions for events management
    const permissions = [
      { collection: 'events', action: 'read', fields: ['*'], permissions: clientFilter },
      { collection: 'events', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'events', action: 'update', fields: ['*'], permissions: clientFilter },
      { collection: 'events', action: 'delete', permissions: clientFilter },
      { collection: 'event_registrations', action: 'read', fields: ['*'], permissions: clientFilter },
      { collection: 'event_registrations', action: 'update', fields: ['*'], permissions: clientFilter },
      { collection: 'event_registrations', action: 'delete', permissions: clientFilter }
    ];

    for (const perm of permissions) {
      try {
        await apiRequest('/permissions', 'POST', { policy: policyId, ...perm });
        console.log(`  + Added ${perm.action} permission for ${perm.collection}`);
      } catch (error) {
        console.log(`  → ${perm.action} permission for ${perm.collection} may already exist`);
      }
    }

    console.log('  ✓ Editor permissions updated');
  } catch (error) {
    console.error('  ✗ Error updating editor permissions:', error.message);
  }
}

async function createSampleEvent() {
  console.log('Creating sample events...');

  try {
    // Get Tax & Purpose client ID
    const clients = await apiRequest('/items/clients?filter[slug][_eq]=tax-purpose');
    if (!clients.data || clients.data.length === 0) {
      console.log('  → Tax & Purpose client not found');
      return;
    }
    const clientId = clients.data[0].id;

    // Check if events already exist
    const existingEvents = await apiRequest(`/items/events?filter[client][_eq]=${clientId}`);
    if (existingEvents.data && existingEvents.data.length > 0) {
      console.log('  → Sample events already exist');
      return;
    }

    // Create sample free event
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(10, 0, 0, 0);

    await apiRequest('/items/events', 'POST', {
      title: 'Tax & Purpose Community Meetup',
      slug: 'community-meetup-june-2026',
      summary: 'Join us for an informal gathering to discuss sustainable business practices and network with like-minded professionals.',
      description: '<p>We are excited to invite you to our monthly community meetup!</p><h3>What to Expect</h3><ul><li>Networking with fellow sustainable business practitioners</li><li>Short presentations on recent developments</li><li>Open discussion and Q&A</li><li>Light refreshments</li></ul><p>This is a <strong>free event</strong> open to all members of the Tax & Purpose community.</p>',
      date: nextMonth.toISOString(),
      location: 'Accra Business Hub, Ring Road Central',
      is_online: false,
      is_free: true,
      price: 0,
      currency: 'GHS',
      capacity: 50,
      registration_open: true,
      status: 'published',
      sort: 1,
      client: clientId
    });
    console.log('  + Created free sample event');

    // Create sample paid event (for later)
    const nextQuarter = new Date();
    nextQuarter.setMonth(nextQuarter.getMonth() + 3);
    nextQuarter.setHours(9, 0, 0, 0);

    await apiRequest('/items/events', 'POST', {
      title: 'Annual Tax & Purpose Conference 2026',
      slug: 'annual-conference-2026',
      summary: 'Our flagship annual conference featuring expert speakers, workshops, and networking opportunities.',
      description: '<p>Join us for the Tax & Purpose Annual Conference 2026 - a full-day event bringing together the best minds in sustainable business and impact investing.</p><h3>Program Highlights</h3><ul><li>Keynote speeches from industry leaders</li><li>Interactive workshops on tax optimization</li><li>Panel discussions on ESG compliance</li><li>Networking lunch and coffee breaks</li><li>Certificate of attendance</li></ul><h3>Who Should Attend</h3><p>This conference is ideal for CFOs, tax professionals, sustainability officers, and business owners interested in aligning their operations with purpose-driven goals.</p>',
      date: nextQuarter.toISOString(),
      location: 'Kempinski Hotel Gold Coast City, Accra',
      is_online: false,
      is_free: false,
      price: 500,
      currency: 'GHS',
      capacity: 200,
      registration_open: true,
      status: 'draft', // Keep draft until payment is set up
      sort: 2,
      client: clientId
    });
    console.log('  + Created paid sample event (draft)');

    console.log('  ✓ Sample events created');
  } catch (error) {
    console.error('  ✗ Error creating sample events:', error.message);
  }
}

async function main() {
  console.log('');
  console.log('=== Directus Events Setup ===');
  console.log(`URL: ${DIRECTUS_URL}`);
  console.log('');

  try {
    // Verify connection
    await apiRequest('/server/info');
    console.log('✓ Connected to Directus\n');

    await createEventsCollection();
    await createRegistrationsCollection();
    await updatePublicApiPermissions();
    await updateEditorPermissions();
    await createSampleEvent();

    console.log('\n=== Setup Complete ===');
    console.log('\nCollections created:');
    console.log('  - events');
    console.log('  - event_registrations');
    console.log('\nSample events have been added.');
    console.log('You can now view and manage events in Directus.');
    console.log('\nNext steps:');
    console.log('1. Review and publish events in Directus admin');
    console.log('2. Set up Directus Flow for registration confirmation emails');
    console.log('3. (Later) Integrate Paystack for paid events');
  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
