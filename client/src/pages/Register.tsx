import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Feather, Lock, Mail, User, Phone } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('You must consent to multi-detector processing.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        email,
        name,
        password,
        whatsappNumber: whatsappNumber || undefined,
      });
      login(res.data.token, res.data.user);
      navigate('/check');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tmq-bg text-tmq-text flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-card bg-tmq-brand-soft border border-tmq-border text-tmq-brand mb-4 shadow-sm">
          <Feather className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-tmq-text-strong tracking-tight">JOIN THE DESK</h2>
        <p className="mt-1 text-xs text-tmq-text-muted uppercase tracking-widest font-mono">
          Register for The Midnight Quill AI Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-tmq-surface border border-tmq-border py-8 px-6 shadow-sm rounded-card sm:px-10">
          {error && (
            <div className="mb-4 bg-red-950/40 border-l-4 border-red-500 p-3 text-sm text-red-300 rounded">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-tmq-text-muted mb-1">
                Full Name / Pen Name
              </label>
              <div className="relative rounded-btn shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tmq-text-soft">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-tmq-border rounded-btn focus:outline-none focus:border-tmq-brand text-sm bg-tmq-surface-2 text-tmq-text-strong placeholder:text-tmq-text-soft"
                  placeholder="Arthur Penhaligon"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-tmq-text-muted mb-1">
                Email Address (For Reports)
              </label>
              <div className="relative rounded-btn shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tmq-text-soft">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-tmq-border rounded-btn focus:outline-none focus:border-tmq-brand text-sm bg-tmq-surface-2 text-tmq-text-strong placeholder:text-tmq-text-soft"
                  placeholder="editor@midnightquill.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-tmq-text-muted mb-1">
                WhatsApp Phone (Optional)
              </label>
              <div className="relative rounded-btn shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tmq-text-soft">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-tmq-border rounded-btn focus:outline-none focus:border-tmq-brand text-sm bg-tmq-surface-2 text-tmq-text-strong placeholder:text-tmq-text-soft"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-tmq-text-muted mb-1">
                Password
              </label>
              <div className="relative rounded-btn shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tmq-text-soft">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-tmq-border rounded-btn focus:outline-none focus:border-tmq-brand text-sm bg-tmq-surface-2 text-tmq-text-strong placeholder:text-tmq-text-soft"
                />
              </div>
            </div>

            <div className="flex items-start mt-2">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="h-4 w-4 accent-tmq-brand rounded mt-0.5 cursor-pointer"
              />
              <label htmlFor="consent" className="ml-2 block text-xs text-tmq-text-muted cursor-pointer">
                I understand that submitted text is processed through third-party AI forensic detectors and that platform administrators retain audit oversight.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center py-2.5 px-4 rounded-btn text-sm font-medium text-tmq-on-brand bg-tmq-brand hover:opacity-90 focus:outline-none transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Enroll Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-xs text-tmq-brand hover:underline font-medium">
              Already have credentials? Sign in &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
