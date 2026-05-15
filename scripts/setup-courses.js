/**
 * Directus Courses Setup Script
 *
 * Creates the courses and course_registrations collections for the courses feature.
 *
 * Usage:
 *   DIRECTUS_ADMIN_TOKEN=your_admin_token node scripts/setup-courses.js
 */

const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('Error: DIRECTUS_ADMIN_TOKEN environment variable is required');
  console.error('Usage: DIRECTUS_ADMIN_TOKEN=your_token node scripts/setup-courses.js');
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

async function createCoursesCollection() {
  console.log('Creating courses collection...');

  if (await collectionExists('courses')) {
    console.log('  → courses collection already exists, skipping');
    return;
  }

  // Create collection
  await apiRequest('/collections', 'POST', {
    collection: 'courses',
    meta: {
      icon: 'school',
      note: 'Courses available for registration (multi-tenant)'
    },
    schema: {}
  });

  // Add fields
  const fields = [
    {
      field: 'title',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'Course title' },
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
      meta: { interface: 'input', note: 'Short description for cards' },
      schema: {}
    },
    {
      field: 'description',
      type: 'text',
      meta: { interface: 'input-rich-text-html', note: 'Full course description' },
      schema: {}
    },
    {
      field: 'featured_image',
      type: 'uuid',
      meta: { interface: 'file-image', note: 'Course image' },
      schema: {}
    },
    {
      field: 'price',
      type: 'decimal',
      meta: {
        interface: 'input',
        note: 'Price in EUR (0 = free)',
        options: { min: 0 }
      },
      schema: { numeric_precision: 10, numeric_scale: 2, default_value: 0 }
    },
    {
      field: 'currency',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: { choices: [{ text: 'EUR', value: 'EUR' }] },
        default_value: 'EUR'
      },
      schema: { default_value: 'EUR' }
    },
    {
      field: 'is_free',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        note: 'Is this a free course?',
        default_value: true
      },
      schema: { default_value: true }
    },
    {
      field: 'max_participants',
      type: 'integer',
      meta: {
        interface: 'input',
        note: 'Maximum number of participants (leave empty for unlimited)',
        options: { min: 0 }
      },
      schema: {}
    },
    {
      field: 'start_date',
      type: 'timestamp',
      meta: { interface: 'datetime', note: 'Course start date/time' },
      schema: {}
    },
    {
      field: 'end_date',
      type: 'timestamp',
      meta: { interface: 'datetime', note: 'Course end date/time' },
      schema: {}
    },
    {
      field: 'location',
      type: 'string',
      meta: { interface: 'input', note: 'Location (or "Online")' },
      schema: {}
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
            { text: 'Archived', value: 'archived' }
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
        note: 'Client this course belongs to',
        required: true
      },
      schema: {}
    }
  ];

  for (const field of fields) {
    await apiRequest('/fields/courses', 'POST', field);
    console.log(`  + Added field: ${field.field}`);
  }

  // Create relation to clients
  await apiRequest('/relations', 'POST', {
    collection: 'courses',
    field: 'client',
    related_collection: 'clients',
    meta: { one_field: 'courses' }
  });
  console.log('  + Created client relationship');

  console.log('  ✓ courses collection created');
}

async function createRegistrationsCollection() {
  console.log('Creating course_registrations collection...');

  if (await collectionExists('course_registrations')) {
    console.log('  → course_registrations collection already exists, skipping');
    return;
  }

  // Create collection
  await apiRequest('/collections', 'POST', {
    collection: 'course_registrations',
    meta: {
      icon: 'how_to_reg',
      note: 'Course registrations/signups (multi-tenant)'
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
      meta: { interface: 'input-multiline', note: 'Additional notes/message' },
      schema: {}
    },
    {
      field: 'payment_status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Free', value: 'free' },
            { text: 'Pending', value: 'pending' },
            { text: 'Paid', value: 'paid' },
            { text: 'Failed', value: 'failed' },
            { text: 'Refunded', value: 'refunded' }
          ]
        },
        default_value: 'free'
      },
      schema: { default_value: 'free' }
    },
    {
      field: 'payment_id',
      type: 'string',
      meta: { interface: 'input', note: 'Mollie payment ID' },
      schema: {}
    },
    {
      field: 'payment_method',
      type: 'string',
      meta: { interface: 'input', note: 'Payment method used (e.g., ideal, creditcard)' },
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
      field: 'course',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        note: 'Course registered for',
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
    await apiRequest('/fields/course_registrations', 'POST', field);
    console.log(`  + Added field: ${field.field}`);
  }

  // Create relation to courses
  await apiRequest('/relations', 'POST', {
    collection: 'course_registrations',
    field: 'course',
    related_collection: 'courses',
    meta: { one_field: 'registrations' }
  });
  console.log('  + Created course relationship');

  // Create relation to clients
  await apiRequest('/relations', 'POST', {
    collection: 'course_registrations',
    field: 'client',
    related_collection: 'clients',
    meta: { one_field: 'course_registrations' }
  });
  console.log('  + Created client relationship');

  console.log('  ✓ course_registrations collection created');
}

async function updatePublicApiPermissions() {
  console.log('Updating Public API permissions for courses...');

  try {
    // Find the Public API policy
    const policies = await apiRequest('/policies?filter[name][_eq]=Public API Policy');
    if (!policies.data || policies.data.length === 0) {
      console.log('  → Public API Policy not found, skipping permissions');
      return;
    }

    const policyId = policies.data[0].id;

    // Add read permissions for courses (published only)
    const permissions = [
      {
        collection: 'courses',
        action: 'read',
        fields: ['*'],
        permissions: { status: { _eq: 'published' } }
      },
      {
        collection: 'course_registrations',
        action: 'create',
        fields: ['first_name', 'last_name', 'email', 'phone', 'company', 'notes', 'course', 'client', 'payment_status', 'registered_at'],
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
  console.log('Updating Tax & Purpose Editor permissions for courses...');

  try {
    // Find the editor policy
    const policies = await apiRequest('/policies?filter[name][_eq]=Tax %26 Purpose Editor Policy');
    if (!policies.data || policies.data.length === 0) {
      console.log('  → Tax & Purpose Editor Policy not found, skipping permissions');
      return;
    }

    const policyId = policies.data[0].id;
    const clientFilter = { client: { slug: { _eq: 'tax-purpose' } } };

    // Add permissions for courses management
    const permissions = [
      { collection: 'courses', action: 'read', fields: ['*'], permissions: clientFilter },
      { collection: 'courses', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'courses', action: 'update', fields: ['*'], permissions: clientFilter },
      { collection: 'courses', action: 'delete', permissions: clientFilter },
      { collection: 'course_registrations', action: 'read', fields: ['*'], permissions: clientFilter },
      { collection: 'course_registrations', action: 'update', fields: ['*'], permissions: clientFilter },
      { collection: 'course_registrations', action: 'delete', permissions: clientFilter }
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

async function createSampleCourse() {
  console.log('Creating sample courses...');

  try {
    // Get Tax & Purpose client ID
    const clients = await apiRequest('/items/clients?filter[slug][_eq]=tax-purpose');
    if (!clients.data || clients.data.length === 0) {
      console.log('  → Tax & Purpose client not found');
      return;
    }
    const clientId = clients.data[0].id;

    // Check if courses already exist
    const existingCourses = await apiRequest(`/items/courses?filter[client][_eq]=${clientId}`);
    if (existingCourses.data && existingCourses.data.length > 0) {
      console.log('  → Sample courses already exist');
      return;
    }

    // Create sample free course
    await apiRequest('/items/courses', 'POST', {
      title: 'Einführung in nachhaltige Steuerstrategien',
      slug: 'einfuehrung-nachhaltige-steuerstrategien',
      summary: 'Lernen Sie die Grundlagen nachhaltiger Steuerplanung kennen.',
      description: '<p>In diesem kostenlosen Webinar erhalten Sie einen Überblick über nachhaltige Steuerstrategien für Unternehmen.</p><p>Themen:</p><ul><li>Grundlagen der nachhaltigen Steuerplanung</li><li>Steuervorteile für grüne Investitionen</li><li>Best Practices aus der Praxis</li></ul>',
      price: 0,
      is_free: true,
      location: 'Online',
      status: 'published',
      sort: 1,
      client: clientId
    });
    console.log('  + Created free sample course');

    // Create sample paid course
    await apiRequest('/items/courses', 'POST', {
      title: 'Masterclass: Steueroptimierung für Impact-Unternehmen',
      slug: 'masterclass-steueroptimierung-impact-unternehmen',
      summary: 'Intensive Schulung zur Steueroptimierung für soziale und nachhaltige Unternehmen.',
      description: '<p>Diese umfassende Masterclass richtet sich an Unternehmer und Finanzverantwortliche von Impact-Unternehmen.</p><p>Was Sie lernen:</p><ul><li>Detaillierte Steuerstrategien</li><li>Fördermöglichkeiten optimal nutzen</li><li>Internationale Steuerplanung</li><li>Praxisbeispiele und Fallstudien</li></ul>',
      price: 299.00,
      is_free: false,
      location: 'Online',
      status: 'published',
      sort: 2,
      client: clientId
    });
    console.log('  + Created paid sample course');

    console.log('  ✓ Sample courses created');
  } catch (error) {
    console.error('  ✗ Error creating sample courses:', error.message);
  }
}

async function main() {
  console.log('');
  console.log('=== Directus Courses Setup ===');
  console.log(`URL: ${DIRECTUS_URL}`);
  console.log('');

  try {
    // Verify connection
    await apiRequest('/server/info');
    console.log('✓ Connected to Directus\n');

    await createCoursesCollection();
    await createRegistrationsCollection();
    await updatePublicApiPermissions();
    await updateEditorPermissions();
    await createSampleCourse();

    console.log('\n=== Setup Complete ===');
    console.log('\nCollections created:');
    console.log('  - courses');
    console.log('  - course_registrations');
    console.log('\nSample courses have been added.');
    console.log('You can now view and manage courses in Directus.');
  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
