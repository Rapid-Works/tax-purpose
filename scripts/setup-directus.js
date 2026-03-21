/**
 * Directus Multi-Tenancy Setup Script
 *
 * This script creates the required collections and fields for multi-tenancy:
 * - clients collection
 * - posts collection with client relationship
 * - Public API role and token
 *
 * Usage:
 *   DIRECTUS_ADMIN_TOKEN=your_admin_token node scripts/setup-directus.js
 */

const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('Error: DIRECTUS_ADMIN_TOKEN environment variable is required');
  console.error('Usage: DIRECTUS_ADMIN_TOKEN=your_token node scripts/setup-directus.js');
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

  // Handle empty responses (like DELETE)
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

async function deleteCollection(name) {
  if (await collectionExists(name)) {
    console.log(`Deleting existing ${name} collection...`);
    await apiRequest(`/collections/${name}`, 'DELETE');
    console.log(`  ✓ ${name} deleted`);
  }
}

async function createClientsCollection() {
  console.log('Creating clients collection...');

  // Create collection
  await apiRequest('/collections', 'POST', {
    collection: 'clients',
    meta: {
      icon: 'business',
      note: 'Client organizations for multi-tenancy'
    },
    schema: {}
  });

  // Add fields
  const fields = [
    {
      field: 'name',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'Client display name' },
      schema: { is_nullable: false }
    },
    {
      field: 'slug',
      type: 'string',
      meta: { interface: 'input', required: true, note: 'URL-safe identifier (e.g., tax-purpose)' },
      schema: { is_nullable: false, is_unique: true }
    },
    {
      field: 'domain',
      type: 'string',
      meta: { interface: 'input', note: 'Client website domain' },
      schema: {}
    },
    {
      field: 'logo',
      type: 'uuid',
      meta: { interface: 'file-image', note: 'Client logo' },
      schema: {}
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: { choices: [{ text: 'Active', value: 'active' }, { text: 'Inactive', value: 'inactive' }] },
        default_value: 'active'
      },
      schema: { default_value: 'active' }
    }
  ];

  for (const field of fields) {
    await apiRequest('/fields/clients', 'POST', field);
    console.log(`  → Added field: ${field.field}`);
  }

  console.log('  ✓ clients collection created');
}

async function createPostsCollection() {
  console.log('Creating posts collection...');

  // Create collection
  await apiRequest('/collections', 'POST', {
    collection: 'posts',
    meta: {
      icon: 'article',
      note: 'Blog posts (multi-tenant)'
    },
    schema: {}
  });

  // Add fields
  const fields = [
    {
      field: 'title',
      type: 'string',
      meta: { interface: 'input', required: true },
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
      type: 'text',
      meta: { interface: 'input-multiline', note: 'Short description' },
      schema: {}
    },
    {
      field: 'content',
      type: 'text',
      meta: { interface: 'input-rich-text-html', note: 'Full HTML content' },
      schema: {}
    },
    {
      field: 'featured_image',
      type: 'uuid',
      meta: { interface: 'file-image', note: 'Hero image' },
      schema: {}
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: { choices: [{ text: 'Draft', value: 'draft' }, { text: 'Published', value: 'published' }] },
        default_value: 'draft'
      },
      schema: { default_value: 'draft' }
    },
    {
      field: 'client',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        note: 'Client this post belongs to',
        required: true
      },
      schema: {}
    }
  ];

  for (const field of fields) {
    await apiRequest('/fields/posts', 'POST', field);
    console.log(`  → Added field: ${field.field}`);
  }

  // Create relation
  await apiRequest('/relations', 'POST', {
    collection: 'posts',
    field: 'client',
    related_collection: 'clients',
    meta: { one_field: 'posts' }
  });
  console.log('  → Created client relationship');

  console.log('  ✓ posts collection created');
}

async function createFirstClient() {
  console.log('Creating first client entry...');

  try {
    const result = await apiRequest('/items/clients', 'POST', {
      name: 'Tax & Purpose',
      slug: 'tax-purpose',
      domain: 'taxandpurpose.com',
      status: 'active'
    });

    console.log('  ✓ Tax & Purpose client created');
    return result.data.id;
  } catch (error) {
    console.error('  ✗ Error creating client:', error.message);
  }
}

async function createPublicRole() {
  console.log('Creating Public API role...');

  try {
    // Check if role exists
    const roles = await apiRequest('/roles?filter[name][_eq]=Public API');
    if (roles.data && roles.data.length > 0) {
      console.log('  → Public API role already exists');
      return roles.data[0].id;
    }

    // First create a policy
    const policyResult = await apiRequest('/policies', 'POST', {
      name: 'Public API Policy',
      icon: 'public',
      description: 'Read-only access to published content'
    });
    const policyId = policyResult.data.id;
    console.log('  → Created policy');

    // Create role with policy
    const result = await apiRequest('/roles', 'POST', {
      name: 'Public API',
      icon: 'public',
      description: 'Read-only access to published content',
      policies: [policyId]
    });
    const roleId = result.data.id;
    console.log('  → Created role');

    // Set permissions on the policy
    const permissions = [
      { collection: 'clients', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'posts', action: 'read', fields: ['*'], permissions: { status: { _eq: 'published' } } },
      { collection: 'directus_files', action: 'read', fields: ['*'], permissions: {} }
    ];

    for (const perm of permissions) {
      await apiRequest('/permissions', 'POST', { policy: policyId, ...perm });
      console.log(`  → Added ${perm.action} permission for ${perm.collection}`);
    }

    console.log('  ✓ Public API role created');
    return roleId;
  } catch (error) {
    console.error('  ✗ Error creating role:', error.message);
  }
}

async function createClientEditorRole() {
  console.log('Creating Tax & Purpose Editor role...');

  try {
    // Check if role exists
    const roles = await apiRequest('/roles?filter[name][_eq]=Tax %26 Purpose Editor');
    if (roles.data && roles.data.length > 0) {
      console.log('  → Tax & Purpose Editor role already exists');
      return roles.data[0].id;
    }

    // Create policy
    const policyResult = await apiRequest('/policies', 'POST', {
      name: 'Tax & Purpose Editor Policy',
      icon: 'edit',
      description: 'Edit access for Tax & Purpose client only'
    });
    const policyId = policyResult.data.id;
    console.log('  → Created policy');

    // Create role with policy
    const result = await apiRequest('/roles', 'POST', {
      name: 'Tax & Purpose Editor',
      icon: 'edit',
      description: 'Editor for Tax & Purpose website',
      policies: [policyId]
    });
    const roleId = result.data.id;
    console.log('  → Created role');

    // Client filter for permissions
    const clientFilter = { client: { slug: { _eq: 'tax-purpose' } } };

    // Set permissions
    const permissions = [
      { collection: 'posts', action: 'read', fields: ['*'], permissions: clientFilter },
      { collection: 'posts', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'posts', action: 'update', fields: ['*'], permissions: clientFilter },
      { collection: 'posts', action: 'delete', permissions: clientFilter },
      { collection: 'clients', action: 'read', fields: ['id', 'name', 'slug'], permissions: { slug: { _eq: 'tax-purpose' } } },
      { collection: 'directus_files', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'directus_files', action: 'create', fields: ['*'], permissions: {} }
    ];

    for (const perm of permissions) {
      await apiRequest('/permissions', 'POST', { policy: policyId, ...perm });
      console.log(`  → Added ${perm.action} permission for ${perm.collection}`);
    }

    console.log('  ✓ Tax & Purpose Editor role created');
    return roleId;
  } catch (error) {
    console.error('  ✗ Error creating editor role:', error.message);
  }
}

async function createClientUser(roleId) {
  console.log('Creating Tax & Purpose editor user...');

  try {
    // Check if user exists
    const users = await apiRequest('/users?filter[email][_eq]=editor@taxandpurpose.de');
    if (users.data && users.data.length > 0) {
      console.log('  → editor@taxandpurpose.de already exists');
      return;
    }

    await apiRequest('/users', 'POST', {
      email: 'editor@taxandpurpose.de',
      password: 'TaxPurpose2026!',
      role: roleId,
      status: 'active'
    });

    console.log('  ✓ User created: editor@taxandpurpose.de');
    console.log('  → Password: TaxPurpose2026! (change on first login)');
  } catch (error) {
    console.error('  ✗ Error creating user:', error.message);
  }
}

async function main() {
  console.log('');
  console.log('=== Directus Multi-Tenancy Setup ===');
  console.log(`URL: ${DIRECTUS_URL}`);
  console.log('');

  try {
    // Verify connection
    await apiRequest('/server/info');
    console.log('✓ Connected to Directus\n');

    // Clean up existing collections (posts first due to foreign key)
    await deleteCollection('posts');
    await deleteCollection('clients');
    console.log('');

    await createClientsCollection();
    await createPostsCollection();
    await createFirstClient();
    await createPublicRole();
    const editorRoleId = await createClientEditorRole();
    if (editorRoleId) {
      await createClientUser(editorRoleId);
    }

    console.log('\n=== Setup Complete ===');
    console.log('\nAll collections, roles, and users have been created.');
    console.log('You can now log into Directus with:');
    console.log('  - Admin: admin@rapid-works.io');
    console.log('  - Client Editor: editor@taxandpurpose.de / TaxPurpose2026!');
  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
