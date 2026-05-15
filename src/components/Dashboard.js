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
