import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Feather, History, Shield, Users, Cpu, FileText, LogOut, Sun, Moon } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-tmq-bg text-tmq-text flex flex-col font-sans selection:bg-tmq-brand-soft selection:text-tmq-brand">
      {/* 64px Header Bar per DESIGN.md */}
      <header className="h-16 bg-tmq-surface border-b border-tmq-border sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
          {/* TMQ Wordmark */}
          <Link to="/check" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-btn bg-tmq-brand-soft border border-tmq-border flex items-center justify-center text-tmq-brand group-hover:bg-tmq-brand group-hover:text-tmq-on-brand transition-colors">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[16px] tracking-tight text-tmq-text-strong block leading-none">
                The Midnight Quill
              </span>
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-tmq-text-soft block mt-0.5">
                AI Detector
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/check"
              className={`px-3 py-1.5 rounded-btn text-[14px] font-medium transition-colors ${
                isActive('/check')
                  ? 'bg-tmq-surface-2 text-tmq-text-strong'
                  : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
              }`}
            >
              Detector
            </Link>
            <Link
              to="/history"
              className={`px-3 py-1.5 rounded-btn text-[14px] font-medium transition-colors ${
                isActive('/history')
                  ? 'bg-tmq-surface-2 text-tmq-text-strong'
                  : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
              }`}
            >
              History
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className={`px-3 py-1.5 rounded-btn text-[14px] font-medium transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-tmq-surface-2 text-tmq-text-strong'
                    : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
                }`}
              >
                Overseer
              </Link>
            )}
          </nav>

          {/* Right Area: Theme Toggle + User Info + Action */}
          <div className="flex items-center space-x-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-btn text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2 border border-tmq-border transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-tmq-warning" /> : <Moon className="w-4 h-4 text-tmq-text" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-2.5">
                <span className="hidden sm:inline-block text-[12px] font-mono px-2.5 py-1 rounded-pill bg-tmq-surface-2 border border-tmq-border text-tmq-text-muted">
                  Quota: <strong className="text-tmq-text-strong">{user.quotaRemaining}</strong>
                </span>
                <span className="text-[13px] font-medium text-tmq-text-strong hidden md:inline">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-btn text-tmq-text-soft hover:text-tmq-danger hover:bg-tmq-surface-2 border border-transparent hover:border-tmq-border transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container - 1280px Page Width */}
      <div className="max-w-[1280px] mx-auto px-6 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-56 flex-shrink-0">
          <div className="bg-tmq-surface border border-tmq-border rounded-lg p-2.5 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-tmq-text-soft">
              Desk Menu
            </div>
            <Link
              to="/check"
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-btn text-[14px] font-medium transition-colors ${
                isActive('/check')
                  ? 'bg-tmq-surface-2 text-tmq-text-strong font-semibold'
                  : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
              }`}
            >
              <Feather className="w-4 h-4 text-tmq-brand" />
              <span>Analyse Writing</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-btn text-[14px] font-medium transition-colors ${
                isActive('/history')
                  ? 'bg-tmq-surface-2 text-tmq-text-strong font-semibold'
                  : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
              }`}
            >
              <History className="w-4 h-4 text-tmq-text-muted" />
              <span>Ledger History</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <>
                <div className="pt-3 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-tmq-warning">
                  Overseer Controls
                </div>
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-btn text-[14px] font-medium transition-colors ${
                    isActive('/admin/dashboard')
                      ? 'bg-tmq-surface-2 text-tmq-text-strong font-semibold'
                      : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
                  }`}
                >
                  <Shield className="w-4 h-4 text-tmq-brand" />
                  <span>Command Center</span>
                </Link>
                <Link
                  to="/admin/activity"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-btn text-[14px] font-medium transition-colors ${
                    isActive('/admin/activity')
                      ? 'bg-tmq-surface-2 text-tmq-text-strong font-semibold'
                      : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
                  }`}
                >
                  <FileText className="w-4 h-4 text-tmq-text-muted" />
                  <span>All Submissions</span>
                </Link>
                <Link
                  to="/admin/detectors"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-btn text-[14px] font-medium transition-colors ${
                    isActive('/admin/detectors')
                      ? 'bg-tmq-surface-2 text-tmq-text-strong font-semibold'
                      : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-tmq-text-muted" />
                  <span>Detector Tuning</span>
                </Link>
                <Link
                  to="/admin/users"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-btn text-[14px] font-medium transition-colors ${
                    isActive('/admin/users')
                      ? 'bg-tmq-surface-2 text-tmq-text-strong font-semibold'
                      : 'text-tmq-text-muted hover:text-tmq-text hover:bg-tmq-surface-2'
                  }`}
                >
                  <Users className="w-4 h-4 text-tmq-text-muted" />
                  <span>Users & Quotas</span>
                </Link>
              </>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer per DESIGN.md */}
      <footer className="border-t border-tmq-border py-6 bg-tmq-surface text-center text-[12px] text-tmq-text-soft">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>The Midnight Quill AI Detector &copy; 2026 &mdash; Built with literary authenticity standards.</span>
          <span className="font-mono text-[11px] text-tmq-text-faint">Probability, not proof. A human reviews every flag.</span>
        </div>
      </footer>
    </div>
  );
};
