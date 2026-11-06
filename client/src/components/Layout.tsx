import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Feather, History, Shield, Users, Cpu, FileText, LogOut, CheckCircle2 } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col font-sans">
      {/* Top Banner */}
      <header className="bg-forest text-parchment shadow-md border-b border-forest/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-moss/40 rounded-full group-hover:bg-moss/60 transition">
              <Feather className="w-5 h-5 text-parchment" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight block">THE MIDNIGHT QUILL</span>
              <span className="text-[10px] uppercase tracking-widest text-sage block font-sans">Authenticity Desk</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3 text-xs sm:text-sm">
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-moss/30 border border-sage/40 text-sage font-medium">
                  Quota: {user.quotaRemaining} checks
                </span>
                <span className="font-medium text-parchment/90">{user.name}</span>
                <span className="px-2 py-0.5 text-[10px] rounded font-bold uppercase tracking-wider bg-sage text-forest">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-parchment/70 hover:text-parchment hover:bg-forest/50 rounded transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Tabs */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-white/60 backdrop-blur-sm border border-moss/20 rounded-xl p-3 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-moss font-serif">
              Editorial Desk
            </div>
            <Link
              to="/check"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive('/check')
                  ? 'bg-forest text-parchment shadow-sm'
                  : 'text-ink/80 hover:bg-moss/10 hover:text-forest'
              }`}
            >
              <Feather className="w-4 h-4" />
              <span>Submit Manuscript</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive('/history')
                  ? 'bg-forest text-parchment shadow-sm'
                  : 'text-ink/80 hover:bg-moss/10 hover:text-forest'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Ledger & History</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <>
                <div className="pt-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-amber font-serif">
                  Founder Overseer (Admin)
                </div>
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/dashboard')
                      ? 'bg-forest text-parchment shadow-sm'
                      : 'text-ink/80 hover:bg-moss/10 hover:text-forest'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Command Center</span>
                </Link>

                <Link
                  to="/admin/activity"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/activity')
                      ? 'bg-forest text-parchment shadow-sm'
                      : 'text-ink/80 hover:bg-moss/10 hover:text-forest'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>All Submissions</span>
                </Link>

                <Link
                  to="/admin/users"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/users')
                      ? 'bg-forest text-parchment shadow-sm'
                      : 'text-ink/80 hover:bg-moss/10 hover:text-forest'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Users & Quotas</span>
                </Link>

                <Link
                  to="/admin/detectors"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/detectors')
                      ? 'bg-forest text-parchment shadow-sm'
                      : 'text-ink/80 hover:bg-moss/10 hover:text-forest'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>Detector Tuning</span>
                </Link>

                <Link
                  to="/admin/audit"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/audit')
                      ? 'bg-forest text-parchment shadow-sm'
                      : 'text-ink/80 hover:bg-moss/10 hover:text-forest'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Forensic Audit Log</span>
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <footer className="border-t border-moss/10 py-6 text-center text-xs text-ink/60 font-serif">
        The Midnight Quill Authenticity Desk &copy; 2026 &mdash; Built with zero-AI writing screening standards.
      </footer>
    </div>
  );
};
