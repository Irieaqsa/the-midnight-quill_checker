import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Feather, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/check');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@tmq.com');
      setPassword('admin123');
    } else {
      setEmail('user@tmq.com');
      setPassword('user123');
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-full bg-forest text-parchment mb-4 shadow-sm">
          <Feather className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-extrabold text-forest tracking-tight">THE MIDNIGHT QUILL</h2>
        <p className="mt-1 text-sm text-ink/70 font-sans tracking-wide uppercase">
          Authenticity Desk &bull; Sign In
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur border border-moss/20 py-8 px-6 shadow-sm rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-700 p-3 text-sm text-red-800 rounded">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink/40">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-moss/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest text-sm bg-parchment/30"
                  placeholder="editor@midnightquill.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink/40">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-moss/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest text-sm bg-parchment/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-parchment bg-forest hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest transition"
            >
              {loading ? 'Verifying...' : 'Access Desk'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-moss/20">
            <p className="text-xs text-center text-ink/60 font-serif mb-2">Quick Demo Access:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="flex-1 py-1.5 px-3 text-xs font-medium border border-forest/30 rounded bg-moss/10 hover:bg-moss/20 text-forest transition"
              >
                Founder Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('user')}
                className="flex-1 py-1.5 px-3 text-xs font-medium border border-forest/30 rounded bg-moss/10 hover:bg-moss/20 text-forest transition"
              >
                Literary Editor
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link to="/register" className="text-xs text-moss hover:text-forest underline font-medium">
              Don't have an authenticity desk key? Request account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
