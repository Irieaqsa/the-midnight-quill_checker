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
    <div className="min-h-screen bg-parchment flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-full bg-forest text-parchment mb-4 shadow-sm">
          <Feather className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-extrabold text-forest tracking-tight">JOIN THE DESK</h2>
        <p className="mt-1 text-sm text-ink/70 font-sans tracking-wide uppercase">
          Register for The Midnight Quill AI Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur border border-moss/20 py-8 px-6 shadow-sm rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-700 p-3 text-sm text-red-800 rounded">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1">
                Full Name / Pen Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink/40">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-moss/30 rounded-lg focus:ring-2 focus:ring-forest text-sm bg-parchment/30"
                  placeholder="Arthur Penhaligon"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1">
                Email Address (For Reports)
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
                  className="block w-full pl-10 pr-3 py-2 border border-moss/30 rounded-lg focus:ring-2 focus:ring-forest text-sm bg-parchment/30"
                  placeholder="editor@midnightquill.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1">
                WhatsApp Phone (Optional)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink/40">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-moss/30 rounded-lg focus:ring-2 focus:ring-forest text-sm bg-parchment/30"
                  placeholder="+1234567890"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-moss/30 rounded-lg focus:ring-2 focus:ring-forest text-sm bg-parchment/30"
                />
              </div>
            </div>

            <div className="flex items-start mt-2">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="h-4 w-4 text-forest focus:ring-forest border-moss/40 rounded mt-0.5"
              />
              <label htmlFor="consent" className="ml-2 block text-xs text-ink/70">
                I understand that submitted text is processed through third-party AI forensic detectors and that platform administrators retain audit oversight.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-parchment bg-forest hover:bg-forest/90 focus:outline-none transition"
            >
              {loading ? 'Creating...' : 'Enroll Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-xs text-moss hover:text-forest underline font-medium">
              Already have credentials? Sign in &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
