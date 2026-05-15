# SSO Setup Documentation - Tax & Purpose

This document contains all the configuration details for Single Sign-On (SSO) using Zitadel as the identity provider.

## Overview

```
                    ┌─────────────────┐
                    │     Zitadel     │
                    │  (Identity Provider)  │
                    │  zitadel.rapid-works.io  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐
      │    BOS    │   │  Directus │   │  Future   │
      │ Dashboard │   │    CMS    │   │   Apps    │
      └───────────┘   └───────────┘   └───────────┘
```

**One login → access to all applications**

---

## Zitadel Configuration

### Access Details

| Field | Value |
|-------|-------|
| **URL** | https://zitadel.rapid-works.io |
| **Console** | https://zitadel.rapid-works.io/ui/console |
| **Admin Username** | `admin@zitadel.zitadel.rapid-works.io` |
| **Admin Password** | `RapidWorks_2026_Secure!` |

### OIDC Endpoints

| Endpoint | URL |
|----------|-----|
| **Issuer** | `https://zitadel.rapid-works.io` |
| **Authorization** | `https://zitadel.rapid-works.io/oauth/v2/authorize` |
| **Token** | `https://zitadel.rapid-works.io/oauth/v2/token` |
| **UserInfo** | `https://zitadel.rapid-works.io/oidc/v1/userinfo` |
| **JWKS** | `https://zitadel.rapid-works.io/oauth/v2/keys` |
| **End Session** | `https://zitadel.rapid-works.io/oidc/v1/end_session` |
| **Discovery** | `https://zitadel.rapid-works.io/.well-known/openid-configuration` |

### Organization Details

| Field | Value |
|-------|-------|
| **Organization ID** | `362209227642569022` |
| **Organization Name** | `RapidWorks` |
| **Primary Domain** | `rapidworks.zitadel.rapid-works.io` |

---

## Project: Tax & Purpose

All Tax & Purpose applications are grouped under this project in Zitadel.

---

## Application 1: BOS Dashboard

The Business Operating System dashboard for Tax & Purpose.

### Application Details

| Field | Value |
|-------|-------|
| **Name** | BOS Dashboard |
| **Application ID** | `373087163203453263` |
| **Client ID** | `373087163203518799` |
| **Client Secret** | Not required (PKCE) |
| **Application Type** | User Agent (SPA) |
| **Authentication Method** | PKCE |

### OAuth Configuration

| Field | Value |
|-------|-------|
| **Grant Types** | Authorization Code |
| **Response Types** | Code |
| **Redirect URI** | `https://bos.taxandpurpose.rapid-works.io/auth/callback` |
| **Post Logout URI** | `https://bos.taxandpurpose.rapid-works.io` |
| **Development Mode** | Disabled |

### Environment Variables (for React App)

Add to `.env`:

```env
# Zitadel SSO Configuration
REACT_APP_ZITADEL_AUTHORITY=https://zitadel.rapid-works.io
REACT_APP_ZITADEL_CLIENT_ID=373087163203518799
```

### React Implementation Files

#### 1. Install Dependencies

```bash
npm install oidc-client-ts react-oidc-context
```

#### 2. Create `src/auth/config.js`

```javascript
// Zitadel OIDC Configuration
export const oidcConfig = {
  authority: process.env.REACT_APP_ZITADEL_AUTHORITY || 'https://zitadel.rapid-works.io',
  client_id: process.env.REACT_APP_ZITADEL_CLIENT_ID || '373087163203518799',
  redirect_uri: process.env.REACT_APP_ZITADEL_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: process.env.REACT_APP_ZITADEL_POST_LOGOUT_URI || window.location.origin,
  scope: 'openid profile email',
  response_type: 'code',
  // PKCE is automatic with oidc-client-ts
};

// Directus URL for iframe embedding
export const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
```

#### 3. Create `src/auth/AuthCallback.js`

```javascript
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Once authentication is complete, redirect to dashboard
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  if (auth.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-red-200">
          <h1 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-text/70">{auth.error.message}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-text/70">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
```

#### 4. Update `src/components/Dashboard.js`

```javascript
import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { FileUp, Database, Globe, LogOut, LogIn } from 'lucide-react';
import { DIRECTUS_URL } from '../auth/config';

const DIRECTUS_ADMIN_URL = `${DIRECTUS_URL}/admin`;
const UAT_URL = '/home';

const Dashboard = () => {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState('documents');

  const navItems = [
    { id: 'documents', label: 'Document Uploader', icon: <FileUp className="w-5 h-5" /> },
    { id: 'directus', label: 'Directus CMS', icon: <Database className="w-5 h-5" /> },
    { id: 'uat', label: 'UAT Site', icon: <Globe className="w-5 h-5" /> },
  ];

  // Handle login via Zitadel
  const handleLogin = () => {
    auth.signinRedirect();
  };

  // Handle logout
  const handleLogout = () => {
    auth.signoutRedirect();
  };

  // Loading state
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Login form (not authenticated)
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary/10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-text font-serif">Dashboard Login</h1>
              <p className="text-text/70 mt-2">Sign in with your organization account</p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Zitadel
            </button>

            <p className="text-center text-text/50 text-sm mt-6">
              Single Sign-On powered by Zitadel
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get user info from auth
  const userEmail = auth.user?.profile?.email || auth.user?.profile?.preferred_username || 'User';
  const userName = auth.user?.profile?.name || userEmail;

  // Authenticated dashboard
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-primary/10 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-primary/10">
          <h1 className="text-xl font-bold text-text font-serif">Business Operating System</h1>
          <p className="text-text/60 text-sm mt-1">tax & purpose</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                activeTab === item.id
                  ? 'bg-accent text-white'
                  : 'text-text/70 hover:bg-accent/10 hover:text-accent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-primary/10">
          <div className="text-sm font-medium text-text truncate">{userName}</div>
          <div className="text-xs text-text/60 truncate mb-2">{userEmail}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 w-full text-sm text-text/70 hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'documents' && (
          <iframe
            src="/word-uploader.html"
            title="Document Uploader"
            className="w-full h-full border-0"
            style={{ minHeight: '100vh' }}
          />
        )}
        {activeTab === 'directus' && (
          <iframe
            src={DIRECTUS_ADMIN_URL}
            title="Directus CMS"
            className="w-full h-full border-0"
            style={{ minHeight: '100vh' }}
          />
        )}
        {activeTab === 'uat' && (
          <iframe
            src={UAT_URL}
            title="UAT Site"
            className="w-full h-full border-0"
            style={{ minHeight: '100vh' }}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
```

#### 5. Update `src/App.js`

Add imports at the top:

```javascript
import { AuthProvider } from 'react-oidc-context';
import AuthCallback from "./auth/AuthCallback"
import { oidcConfig } from "./auth/config"
```

Wrap the Router with AuthProvider:

```javascript
return (
  <AuthProvider {...oidcConfig}>
    <Router>
      <AppContent ... />
    </Router>
  </AuthProvider>
)
```

Add the callback route:

```javascript
<Route path="/auth/callback" element={<AuthCallback />} />
```

---

## Application 2: Directus CMS

The headless CMS for content management.

### Application Details

| Field | Value |
|-------|-------|
| **Name** | Directus CMS |
| **Application ID** | `373087383135977807` |
| **Client ID** | `373087383136043343` |
| **Client Secret** | `IVO2umsGAxXIxcficQ4ekRINvIUfVVY8p8P6P2TDzpFf66g8LwwV2lpuM3SvXup0` |
| **Application Type** | Web |
| **Authentication Method** | Basic (Client Secret) |

### OAuth Configuration

| Field | Value |
|-------|-------|
| **Grant Types** | Authorization Code |
| **Response Types** | Code |
| **Redirect URI** | `https://directus.rapid-works.io/auth/login/zitadel/callback` |
| **Post Logout URI** | `https://directus.rapid-works.io/admin/logout` |
| **Development Mode** | Disabled |

### Environment Variables (for Directus)

Add these to `/opt/directus/docker-compose.yml` under the `environment` section:

```yaml
# Zitadel SSO Configuration
AUTH_PROVIDERS: "zitadel"
AUTH_ZITADEL_DRIVER: "openid"
AUTH_ZITADEL_CLIENT_ID: "string:373087383136043343"  # IMPORTANT: "string:" prefix required for numeric IDs
AUTH_ZITADEL_CLIENT_SECRET: "IVO2umsGAxXIxcficQ4ekRINvIUfVVY8p8P6P2TDzpFf66g8LwwV2lpuM3SvXup0"
AUTH_ZITADEL_ISSUER_URL: "https://zitadel.rapid-works.io/"
AUTH_ZITADEL_SCOPE: "openid profile email"
AUTH_ZITADEL_IDENTIFIER_KEY: "email"
AUTH_ZITADEL_ALLOW_PUBLIC_REGISTRATION: "false"
AUTH_ZITADEL_ICON: "account_circle"
AUTH_ZITADEL_LABEL: "Login with Zitadel"
```

> **Note:** The `string:` prefix on `CLIENT_ID` is required because Zitadel uses numeric-only client IDs. Without this prefix, Directus will fail with "client_id is required" error. See [GitHub Issue #23291](https://github.com/directus/directus/issues/23291).

### Directus Configuration Steps

1. SSH into server:
   ```bash
   ssh root@91.98.121.89
   ```

2. Edit Directus config:
   ```bash
   nano /opt/directus/docker-compose.yml
   ```

3. Add the environment variables above under the `directus` service `environment` section

4. Restart Directus:
   ```bash
   cd /opt/directus
   podman-compose down
   podman-compose up -d
   ```

5. Verify SSO is configured:
   ```bash
   curl -s "https://directus.rapid-works.io/auth" | python3 -m json.tool
   ```

   Should return:
   ```json
   {
       "data": [
           {
               "name": "zitadel",
               "label": "Login with Zitadel",
               "driver": "openid",
               "icon": "account_circle"
           }
       ],
       "disableDefault": false
   }
   ```

---

## Server Information

### Hetzner Server

| Field | Value |
|-------|-------|
| **IP Address** | `91.98.121.89` |
| **SSH User** | `root` |
| **Container Runtime** | Podman |

### Service Locations

| Service | Path | Container |
|---------|------|-----------|
| Zitadel | `/opt/zitadel/` | `zitadel`, `zitadel_login`, `zitadel_db` |
| Directus | `/opt/directus/` | `directus`, `directus_cache` |
| Tax & Purpose | `/opt/taxandpurpose/` | `taxandpurpose` |
| Traefik | - | `traefik` |

---

## User Mapping

When SSO is enabled, users need to exist in both Zitadel and Directus (matched by email).

### Requirements for SSO Users

For a user to successfully authenticate via SSO to Directus, they must have:

1. **Zitadel account** with:
   - Email address matching their Directus user
   - **Email must be VERIFIED** in Zitadel (critical!)
   - Active status

2. **Directus user** with:
   - Same email address as Zitadel account
   - **A role MUST be assigned** (critical! - users without a role cannot authenticate)
   - Active status

### Creating a New SSO User

1. **In Zitadel** (https://zitadel.rapid-works.io/ui/console):
   - Go to Users → + New
   - Fill in: Username, First Name, Last Name, Email
   - Set initial password or let user set via email
   - **Important**: After creating, verify the email is marked as "verified"
   - If email is not verified, use the workaround: Edit user → Change email → Set same email with "Set email verified" checked
   - User credentials for Leila: `leila.momen@taxandpurpose.com` / `TaxPurpose2026!`

2. **In Directus** (https://directus.rapid-works.io/admin):
   - Go to Users → + Create User
   - Fill in: First Name, Last Name, Email (must match Zitadel exactly)
   - **Critical**: Assign a Role (e.g., "Tax & Purpose Editor")
   - **Critical**: Set Provider to `zitadel` (under Admin Options)
   - **Critical**: Set External Identifier to the user's email (same as Email field)
   - Leave password blank (SSO users don't need local passwords)

   **Note**: If the Directus UI doesn't save these fields properly, use the API:
   ```bash
   # Get admin token
   TOKEN=$(curl -s "https://directus.rapid-works.io/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@rapid-works.io", "password": "YOUR_PASSWORD"}' \
     | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

   # Update user (replace USER_ID and EMAIL)
   curl -X PATCH "https://directus.rapid-works.io/users/USER_ID" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"provider": "zitadel", "external_identifier": "user@email.com"}'
   ```

### Current Zitadel Users

| Username | Email | Name |
|----------|-------|------|
| `samuel.donkor@rapid-works.io` | samuel.donkor@rapid-works.io | Samuel Donkor |
| `yannick.heeren@rapid-works.io` | yannick.heeren@rapid-works.io | Yannick Heeren |
| `marvelous.arku@rapid-works.io` | marvelous.arku@rapid-works.io | Marvelous Arku |
| `Admin` | admin@rapid-works.io | Admin Admin |
| `leila.momen` | leila.momen@taxandpurpose.com | Leila Momen |

### Directus Roles

| Role | Description |
|------|-------------|
| Administrator | Full access to all features |
| Tax & Purpose Editor | Content editing for Tax & Purpose |
| Test Tenant Editor | Content editing for test tenant |
| Public API | API access only (for frontend) |

### Directus Users to Create/Map

Ensure these email addresses exist in Directus with appropriate roles:
- `samuel.donkor@rapid-works.io` → Administrator
- `leila.momen@taxandpurpose.com` → Tax & Purpose Editor

---

## File Structure

After implementation, your project should have these SSO-related files:

```
src/
├── auth/
│   ├── config.js          # OIDC configuration
│   └── AuthCallback.js    # OAuth callback handler
├── components/
│   └── Dashboard.js       # Updated with useAuth hook
└── App.js                 # Wrapped with AuthProvider
```

---

## Testing the SSO Flow

### BOS Dashboard Flow

1. Go to https://bos.taxandpurpose.rapid-works.io/dashboard
2. Click "Sign in with Zitadel"
3. Login with Zitadel credentials (e.g., `samuel.donkor@rapid-works.io`)
4. You'll be redirected back to the dashboard (logged in)
5. Your name and email should appear in the sidebar

### Directus CMS Flow

1. Go to https://directus.rapid-works.io/admin/login
2. Click "Login with Zitadel" button
3. If already logged into Zitadel, you'll be automatically authenticated
4. If not, login with Zitadel credentials
5. You'll be redirected to Directus admin panel

### SSO Session Sharing

- Once logged into Zitadel, both Dashboard and Directus can use the same session
- Logging out from one app doesn't automatically log out from the other
- Zitadel session timeout is configured in Zitadel console

---

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check that redirect URIs in Zitadel match exactly (including trailing slashes)
   - BOS Dashboard: `https://bos.taxandpurpose.rapid-works.io/auth/callback`
   - Directus: `https://directus.rapid-works.io/auth/login/zitadel/callback`

2. **"User doesn't exist" / "User not found" in Directus**

   This error can have multiple causes:

   **a) User doesn't exist in Directus:**
   - Create user in Directus with matching email address
   - Directus identifies users by the `email` claim from Zitadel

   **b) User has no role assigned in Directus (COMMON!):**
   - Even if the user exists, they MUST have a role assigned
   - Go to Directus → Users → Select user → Assign a Role
   - Without a role, Directus treats the user as non-existent for authentication

   **c) Email not verified in Zitadel:**
   - Zitadel must have the user's email marked as "verified"
   - Check: Zitadel Console → Users → Select user → Email should show ✓
   - Workaround if unverified: Edit user → Change email → Re-enter same email with "Set email verified" checkbox

   **d) Provider not set to "zitadel" in Directus (COMMON!):**
   - The user's `provider` field must be set to `zitadel`, not `default`
   - The user's `external_identifier` must be set to their email address
   - The Directus UI may have bugs saving these fields - use the API instead (see "Creating a New SSO User" section)

3. **"CORS error"**
   - Ensure Directus CORS settings include the BOS domain
   - Check `CORS_ORIGIN` in Directus docker-compose.yml

4. **"Invalid client secret"**
   - Verify client secret hasn't been regenerated in Zitadel

5. **"client_id is required" error in Directus**
   - This happens when the Client ID is numeric-only (like Zitadel IDs)
   - Fix: Prefix the CLIENT_ID with `string:` in the env var
   - Example: `AUTH_ZITADEL_CLIENT_ID: "string:373087383136043343"`
   - See: https://github.com/directus/directus/issues/23291

6. **Dashboard shows loading forever**
   - Check browser console for OIDC errors
   - Verify redirect URI is correctly configured in Zitadel

7. **Email verification issues in Zitadel**
   - New users may not have verified emails by default
   - Verification emails may not be configured/sent
   - Workaround: Admin can manually verify by editing user → Change email → Set same email with "Set email verified" checked

### Logs

```bash
# Zitadel logs
podman logs zitadel

# Directus logs
podman logs directus

# Traefik logs
podman logs traefik

# Check Directus SSO provider status
curl -s "https://directus.rapid-works.io/auth"
```

---

## Security Notes

- **Client secrets** should never be committed to git
- **PKCE** is used for the SPA (BOS Dashboard) - no client secret needed
- **Basic auth** is used for Directus (server-side) - client secret required
- Consider using environment variables or secrets management for production
- The `.env` file containing Zitadel config should be in `.gitignore`

---

## Adding New Applications

To add a new application to the SSO:

1. Login to Zitadel Console: https://zitadel.rapid-works.io/ui/console
2. Go to Projects → Tax & Purpose
3. Click "New Application"
4. Choose application type:
   - **User Agent** for SPAs (browser apps) - uses PKCE, no client secret
   - **Web** for server-side apps - uses client secret
   - **Native** for mobile/desktop apps
5. Configure redirect URIs
6. Copy Client ID (and Secret if applicable)
7. Configure your application to use Zitadel OIDC

---

## Deployment

### Build and Deploy to Hetzner

```bash
# Build the React app
npm run build

# Deploy to Hetzner
scp -r build/* root@91.98.121.89:/opt/taxandpurpose/build/
```

### CI/CD (GitHub Actions)

The `.github/workflows/deploy-uat.yml` automatically deploys to Hetzner when pushing to `feature/courses` or `develop` branches.

---

## References

- [Zitadel Documentation](https://zitadel.com/docs)
- [Directus SSO Configuration](https://docs.directus.io/self-hosted/sso.html)
- [OIDC Client TS](https://github.com/authts/oidc-client-ts)
- [React OIDC Context](https://github.com/authts/react-oidc-context)
- [Directus Numeric Client ID Bug](https://github.com/directus/directus/issues/23291)

---

*Last updated: May 15, 2026*
