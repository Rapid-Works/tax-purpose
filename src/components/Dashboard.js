import { useState, useEffect } from 'react';
import { FileUp, Database, Globe, LogOut } from 'lucide-react';

const DIRECTUS_API_URL = 'https://directus.rapid-works.io';
const DIRECTUS_ADMIN_URL = 'https://directus.rapid-works.io/admin';
const UAT_URL = '/home';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navItems = [
    { id: 'documents', label: 'Document Uploader', icon: <FileUp className="w-5 h-5" /> },
    { id: 'directus', label: 'Directus CMS', icon: <Database className="w-5 h-5" /> },
    { id: 'uat', label: 'UAT Site', icon: <Globe className="w-5 h-5" /> },
  ];

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('directus_token');
    const storedEmail = sessionStorage.getItem('directus_email');
    if (token && storedEmail) {
      setIsAuthenticated(true);
      setUserEmail(storedEmail);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${DIRECTUS_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Invalid credentials');
      }

      sessionStorage.setItem('directus_token', data.data.access_token);
      sessionStorage.setItem('directus_email', email);
      setIsAuthenticated(true);
      setUserEmail(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('directus_token');
    sessionStorage.removeItem('directus_email');
    setIsAuthenticated(false);
    setUserEmail('');
    setEmail('');
    setPassword('');
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary/10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-text font-serif">Dashboard Login</h1>
              <p className="text-text/70 mt-2">Sign in with your Directus credentials</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="text-sm text-text/60 truncate mb-2">{userEmail}</div>
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
