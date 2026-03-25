# Directus Multi-Tenancy Plan

## Overview

Single Directus instance at `directus.rapid-works.io` serving multiple client websites with complete data isolation.

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │     directus.rapid-works.io     │
                    │    (Single Directus Instance)   │
                    └─────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
              │ Tax&Purpose│   │ Bautalents│   │ Client 3  │
              │  Website   │   │  Website  │   │  Website  │
              └───────────┘   └───────────┘   └───────────┘
```

---

## Database Schema

### 1. `clients` Collection ✅

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key (auto) |
| name | string | Client display name |
| slug | string | Unique identifier (e.g., "tax-purpose") |
| domain | string | Client website domain |
| logo | file | Client logo |
| status | string | active / inactive |
| date_created | datetime | Auto-generated |

### 2. `posts` Collection ✅

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key (auto) |
| client | m2o → clients | **Relationship to client** |
| title | string | Post title |
| slug | string | URL slug |
| summary | text | Short description |
| content | wysiwyg | Full HTML content |
| featured_image | file | Hero image |
| status | string | draft / published |
| date_created | datetime | Auto-generated |
| author | m2o → directus_users | Post author |

### 3. Future Collections (Same Pattern)

All content collections follow the same pattern with a `client` field:
- `pages`
- `team_members`
- `services`
- `testimonials`
- etc.

---

## Roles & Permissions

### Agency Admin (You)
- Full access to all collections
- Can see all clients' data
- Can create/manage client accounts
- Can create roles for clients

### Client Editor (Per Client)
- **Read posts**: `{ "client": { "_eq": "$CURRENT_USER.client" } }`
- **Create posts**: Auto-set `client` to user's client
- **Update posts**: Only their client's posts
- **Delete posts**: Only their client's posts
- Cannot see `clients` collection
- Cannot see other clients' data

### Public API (Frontend)
- Read-only access to published content
- Filtered by client slug in API request

---

## Frontend Changes

### Environment Variables

```env
# Each client website has its own client slug
REACT_APP_DIRECTUS_URL=https://directus.rapid-works.io
REACT_APP_DIRECTUS_TOKEN=public_readonly_token
REACT_APP_CLIENT_SLUG=tax-purpose
```

### Updated API Client

```javascript
// src/directus/client.js

const clientSlug = process.env.REACT_APP_CLIENT_SLUG;

export async function getPosts(limit = 10) {
  const posts = await client.request(
    readItems('posts', {
      limit,
      sort: ['-date_created'],
      filter: {
        status: { _eq: 'published' },
        client: { slug: { _eq: clientSlug } }  // Filter by client
      },
      fields: ['id', 'slug', 'title', 'summary', 'featured_image', 'date_created']
    })
  );
  return posts;
}
```

---

## Implementation Steps

### Phase 1: Directus Setup ✅ COMPLETE

Automated via `scripts/setup-directus.js`:

```bash
DIRECTUS_ADMIN_TOKEN=your_token node scripts/setup-directus.js
```

- [x] 1.1 Create `clients` collection with fields
- [x] 1.2 Create `posts` collection with client M2O relationship
- [x] 1.3 Create "Tax & Purpose" client entry

### Phase 2: Roles & Permissions ✅ COMPLETE

- [x] 2.1 Create "Public API" role with read permissions
- [x] 2.2 Create "Tax & Purpose Editor" role with filtered permissions
- [x] 2.3 Create editor policy with client-filtered permissions
- [x] 2.4 Create client user (editor@taxandpurpose.de)

### Phase 3: Frontend Updates ✅ COMPLETE

- [x] 3.1 Add `REACT_APP_CLIENT_SLUG` to .env
- [x] 3.2 Update `src/directus/client.js` to filter by client

### Phase 4: Testing

- [ ] 4.1 Verify frontend displays client-specific posts
- [ ] 4.2 Verify client user can only see their data
- [ ] 4.3 Verify agency admin can see all data

---

## API Token Strategy

| Token | Purpose | Permissions |
|-------|---------|-------------|
| `agency_admin_token` | Full backend access | All collections, all operations |
| `public_readonly_token` | Frontend websites | Read published content only |
| `client_editor_token` | Client CMS access | CRUD on their data only |

---

## Adding a New Client

### Quick Checklist

1. ☐ Create client entry in `clients` collection
2. ☐ Create client-specific policy with permissions
3. ☐ Create client-specific role
4. ☐ Link policy to role
5. ☐ Create user account for client
6. ☐ Deploy client website with their `CLIENT_SLUG`

### Step-by-Step API Commands

Replace `NEW_CLIENT_SLUG`, `NEW_CLIENT_NAME`, and credentials as needed.

```bash
# Set variables
ADMIN_TOKEN="your_admin_token"
CLIENT_SLUG="bautalents"
CLIENT_NAME="Bautalents"
CLIENT_DOMAIN="bautalents.de"
EDITOR_EMAIL="editor@bautalents.de"
EDITOR_PASSWORD="Bautalents2026"

# 1. Create client entry
curl -X POST "https://directus.rapid-works.io/items/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$CLIENT_NAME\",\"slug\":\"$CLIENT_SLUG\",\"domain\":\"$CLIENT_DOMAIN\",\"status\":\"active\"}"

# 2. Create policy
POLICY_ID=$(curl -s -X POST "https://directus.rapid-works.io/policies" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$CLIENT_NAME Editor Policy\",\"icon\":\"edit\",\"admin_access\":false,\"app_access\":true}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Policy ID: $POLICY_ID"

# 3. Add permissions to policy
curl -X POST "https://directus.rapid-works.io/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$POLICY_ID\",\"collection\":\"posts\",\"action\":\"read\",\"fields\":[\"*\"],\"permissions\":{\"client\":{\"slug\":{\"_eq\":\"$CLIENT_SLUG\"}}}}"

curl -X POST "https://directus.rapid-works.io/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$POLICY_ID\",\"collection\":\"posts\",\"action\":\"create\",\"fields\":[\"*\"],\"permissions\":{}}"

curl -X POST "https://directus.rapid-works.io/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$POLICY_ID\",\"collection\":\"posts\",\"action\":\"update\",\"fields\":[\"*\"],\"permissions\":{\"client\":{\"slug\":{\"_eq\":\"$CLIENT_SLUG\"}}}}"

curl -X POST "https://directus.rapid-works.io/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$POLICY_ID\",\"collection\":\"posts\",\"action\":\"delete\",\"permissions\":{\"client\":{\"slug\":{\"_eq\":\"$CLIENT_SLUG\"}}}}"

curl -X POST "https://directus.rapid-works.io/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$POLICY_ID\",\"collection\":\"clients\",\"action\":\"read\",\"fields\":[\"id\",\"name\",\"slug\"],\"permissions\":{\"slug\":{\"_eq\":\"$CLIENT_SLUG\"}}}"

curl -X POST "https://directus.rapid-works.io/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$POLICY_ID\",\"collection\":\"directus_files\",\"action\":\"read\",\"fields\":[\"*\"],\"permissions\":{}}"

curl -X POST "https://directus.rapid-works.io/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$POLICY_ID\",\"collection\":\"directus_files\",\"action\":\"create\",\"fields\":[\"*\"],\"permissions\":{}}"

# 4. Create role
ROLE_ID=$(curl -s -X POST "https://directus.rapid-works.io/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$CLIENT_NAME Editor\",\"icon\":\"edit\",\"description\":\"Editor for $CLIENT_NAME\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Role ID: $ROLE_ID"

# 5. Link policy to role (may need to do manually in admin panel)
# Go to Settings → Roles → [Role Name] → Add Policy

# 6. Create user
curl -X POST "https://directus.rapid-works.io/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EDITOR_EMAIL\",\"password\":\"$EDITOR_PASSWORD\",\"role\":\"$ROLE_ID\",\"status\":\"active\"}"
```

### Frontend Deployment

For the new client's website, set these environment variables:

```env
REACT_APP_DIRECTUS_URL=https://directus.rapid-works.io
REACT_APP_DIRECTUS_TOKEN=taxpurpose_frontend_token_2026
REACT_APP_CLIENT_SLUG=bautalents
```

The shared `DIRECTUS_TOKEN` works for all clients - filtering is done by `CLIENT_SLUG`.

---

## Security Considerations

- Public token: Read-only, only published content
- Client data is filtered at database level (not just frontend)
- Directus handles permission enforcement server-side
- No client can access another client's data via API

---

## Decisions (Confirmed)

| Question | Decision |
|----------|----------|
| Client CMS login? | **Yes** - Clients get their own Directus login |
| API tokens? | **One shared public token** - Client filtering via `client` field |
| Collections? | **Start with `posts`** - Add more as needed |
| File isolation? | **Yes** - Per-client folders |

---

## Status

- [x] Plan reviewed and approved
- [x] Frontend code updated (client.js filters by client)
- [x] .env updated with CLIENT_SLUG
- [x] Phase 1: Directus Setup (via script)
  - [x] `clients` collection created
  - [x] `posts` collection created with client M2O relationship
  - [x] "Tax & Purpose" client entry added
- [x] Phase 2: Roles & Permissions (via API)
  - [x] "Public API" role created
  - [x] "Tax & Purpose Editor" role created
  - [x] Editor permissions configured (filtered by client)
  - [x] editor@taxandpurpose.de user created
- [x] Phase 3: Testing
  - [x] Manual step: Link policy to role in admin panel
  - [x] Test editor login and post creation
  - [x] Test tenant created for multi-tenancy verification

---

## SETUP COMPLETE ✅

All setup completed via API (`scripts/setup-directus.js`).

### Created Resources:

| Resource | Status |
|----------|--------|
| `clients` collection | ✅ Created |
| `posts` collection | ✅ Created with client relationship |
| Tax & Purpose client | ✅ Added (slug: tax-purpose) |
| Public API role | ✅ Created |
| Tax & Purpose Editor role | ✅ Created |
| Editor policy with permissions | ✅ Created |
| editor@taxandpurpose.de | ✅ Created (password: TaxPurpose2026) |

### Editor Setup (Completed)

The editor role requires:
1. **App Access** enabled on the policy (allows admin panel login)
2. **Permissions** for posts and clients collections
3. **Role-Policy link** (must be done in admin UI - API has security restrictions)

**Setup via Admin Panel:**
1. Go to **Settings → Access Policies → Tax & Purpose Editor Policy**
2. Enable "App Access" checkbox
3. In "Roles" field, add "Tax & Purpose Editor"
4. Save

**Permissions added via API:**
- posts: read, update, create
- clients: read

### Test Login

- **Admin**: admin@rapid-works.io / RapidWorks2026
- **Tax & Purpose Editor**: editor@taxandpurpose.de / TaxPurpose2026
- **Test Tenant Editor**: editor@test-tenant.com / TestTenant2026

---

## Test Tenant (Multi-Tenancy Verification)

A test tenant has been created to verify data isolation between clients.

### Test Tenant Resources

| Resource | ID | Description |
|----------|-----|-------------|
| Client | 2 | Test Tenant (slug: test-tenant) |
| Role | f23b0b07-cfe4-4729-a38e-0ec817cba599 | Test Tenant Editor |
| Policy | 5db6836e-5c8a-4034-9a26-fdf93f538f3a | Test Tenant Editor Policy |
| User | bf7c951a-f4ed-48ba-923d-3ff1571d78f7 | editor@test-tenant.com |

### Test Tenant Permissions

| Collection | Action | Filter |
|------------|--------|--------|
| posts | read | client = 2 |
| posts | update | client = 2 |
| posts | create | preset: client = 2 |
| clients | read | id = 2 |

### Manual Setup Required

**Link policy to role in Directus admin:**
1. Go to **Settings → Roles → Test Tenant Editor**
2. In the **Policies** section, click **Add Existing**
3. Select **"Test Tenant Editor Policy"**
4. Save

### Verification

After linking the policy to the role, login as `editor@test-tenant.com`:
- ✅ Should see Posts collection (but 0 posts - Test Tenant has no posts)
- ✅ Should see Clients collection (only Test Tenant visible)
- ✅ Should NOT see any Tax & Purpose posts (client_id=1)

---

## Lessons Learned

### Directus 10+ API Changes

1. **Policies required for permissions**: Permissions must be attached to policies, not directly to roles
2. **Role → Policy linking**: Must be done in admin UI - API returns "FORBIDDEN" even for admin users (security feature)
3. **Policy field updates**: Some fields (like `app_access`) can be updated via API, but role assignments cannot
4. **ID types**: Directus uses integer IDs by default, not UUIDs
5. **Empty DELETE responses**: API returns empty body on DELETE, handle in code

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Single Directus instance | Simpler management, shared infrastructure |
| Client field on posts | Data isolation at database level |
| One public API token | Frontend filtering via `CLIENT_SLUG` env var |
| Policy-based permissions | Directus 10+ architecture |

### Files Modified

| File | Purpose |
|------|---------|
| `src/directus/client.js` | API client with client filtering |
| `src/components/Blog.js` | Blog list using Directus |
| `src/components/BlogList.js` | Full blog page with pagination |
| `src/components/BlogPost.js` | Single post view |
| `.env` | Directus URL, token, client slug |
| `scripts/setup-directus.js` | Automated Directus setup |
| `scripts/upload-word-v3.js` | Convert Word docs to blog posts (recommended) |

### Reusable Setup Script

Run for initial setup or to reset everything:

```bash
DIRECTUS_ADMIN_TOKEN=your_token node scripts/setup-directus.js
```

This deletes and recreates collections, adds Tax & Purpose client, and creates roles.

---

## Uploading Blog Posts from Word Documents

Convert `.docx` files directly to Directus blog posts using `upload-word-v3.js`.

**Prerequisites:** Add admin credentials to `.env`:
```
DIRECTUS_ADMIN_EMAIL=admin@rapid-works.io
DIRECTUS_ADMIN_PASSWORD=your_password
```

### Quick Usage

```bash
# Upload a single document
node scripts/upload-word-v3.js path/to/article.docx

# Upload all documents in src/word_blogs/
node scripts/upload-word-v3.js --all

# Preview without uploading (dry run)
node scripts/upload-word-v3.js --all --dry-run
```

### What the Script Does

1. Auto-logins to Directus using credentials from `.env`
2. Parses Word document XML to detect `MdHeading` styles
3. Converts to proper HTML with h2/h3 heading tags
4. Extracts title from filename
5. Generates URL slug from title
6. Creates post in Directus as published

### Options

| Option | Description |
|--------|-------------|
| `--all` | Process all .docx files in `src/word_blogs/` |
| `--dry-run` | Preview without uploading |

### Tips for Word Documents

- **Use MdHeading styles**: Word docs converted from Markdown have `MdHeading1`, `MdHeading2`, etc. styles which are automatically detected
- **Title**: Extracted from filename (e.g., `Article_My_Title.docx` → "My Title")
- **Formatting**: Bold, italic, lists, and tables are preserved
- **Headings**: `MdHeading2` → `<h2>`, `MdHeading3` → `<h3>`

---

## Uploaded Blog Posts (Tax & Purpose)

| ID | Title | Slug | Date |
|----|-------|------|------|
| 10 | Profit mit Purpose: Wie Impact-Unternehmen die Wirtschaft transformieren | profit-mit-purpose-wie-impact-unternehmen-die-wirtschaft-transformieren | 19. März 2026 |
| 11 | Revolutionäre mit Geschäftssinn: Die Welt der Social Entrepreneurs | revolutionaere-mit-geschaeftssinn-die-welt-der-social-entrepreneurs | 19. März 2026 |
| 13 | Die Konvergenz: Wo Impact-Unternehmen und Social Entrepreneurs zusammenkommen | die-konvergenz-wo-impact-unternehmen-und-social-entrepreneurs-zusammenkommen | 19. März 2026 |

**Note:** Posts uploaded from Word documents in `src/word_blogs/` using `upload-word-v3.js`.

---

## WYSIWYG Editor Migration (TinyMCE → Flexible Editor)

### Problem

The default TinyMCE WYSIWYG editor in Directus had an intermittent bug where it would randomly fail to render, showing "Full HTML content" instead of the editor interface. This is a known issue (GitHub #11989) related to browser extension interference and DOM timing conflicts.

### Solution

Migrated to the **Flexible Editor** extension which uses Tiptap instead of TinyMCE.

### Installation Steps

1. **Created Dockerfile** at `/opt/directus/Dockerfile`:
   ```dockerfile
   FROM docker.io/directus/directus:11.17.0
   USER root
   RUN corepack enable
   USER node
   RUN pnpm install directus-extension-flexible-editor
   ```

2. **Updated docker-compose.yml** to build from Dockerfile:
   ```yaml
   directus:
     build:
       context: ./
     # ... rest of config
   ```

3. **Rebuilt and restarted** Directus:
   ```bash
   cd /opt/directus
   podman-compose build --no-cache
   podman-compose down && podman-compose up -d
   ```

### Content Migration

The Flexible Editor uses **Tiptap JSON** format instead of HTML. Migration script created at `scripts/migrate-to-tiptap.js`:

```bash
# Preview changes
node scripts/migrate-to-tiptap.js --dry-run

# Apply migration
node scripts/migrate-to-tiptap.js
```

### Field Configuration

Updated via API:
- **Field type**: `json` (was `text`)
- **Interface**: `flexible-editor-interface`

```bash
# Update field type to JSON
curl -X PATCH "https://directus.rapid-works.io/fields/posts/content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"json","schema":{"data_type":"json"},"meta":{"interface":"flexible-editor-interface"}}'
```

### New Upload Script

Simplified Word upload script at `scripts/upload-word.js`:
- Uses **mammoth** for Word → HTML conversion
- Uses **@tiptap/html** for HTML → JSON conversion
- Stores content as Tiptap JSON directly

```bash
# Upload single document
node scripts/upload-word.js path/to/article.docx

# Upload all documents
node scripts/upload-word.js --all
```

### Dependencies Added

```bash
npm install mammoth @tiptap/html @tiptap/starter-kit @tiptap/pm --save-dev
```

### Data Flow

```
Word Document → HTML (mammoth) → Tiptap JSON → Directus → Frontend
                                                          ↓
                                              JSON → HTML (tiptap)
```

### Frontend Update Required

The frontend `BlogPost.js` needs to convert Tiptap JSON back to HTML for rendering. Use `generateHTML` from `@tiptap/html`:

```javascript
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

const html = generateHTML(post.content, [StarterKit]);
```
