import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Feather, Send, Mail, Phone, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const CheckText: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState(true);
  const [deliveryEmailAddress, setDeliveryEmailAddress] = useState(user?.email || '');
  const [deliveryWhatsapp, setDeliveryWhatsapp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live status tracking after submission
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED' | null>(null);
  const [detectorStatus, setDetectorStatus] = useState<Record<string, { status: string; score?: number }>>({});

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount === 0) {
      setError('Please provide text to evaluate.');
      return;
    }
    if (isOverLimit) {
      setError('Maximum 10,000 words limit exceeded.');
      return;
    }
    if (!deliveryEmail && !deliveryWhatsapp) {
      setError('Choose at least one report destination: Email or WhatsApp.');
      return;
    }

    setError(null);
    setSubmitting(true);
    setStatusState('QUEUED');

    try {
      const res = await api.post('/submissions', {
        text,
        deliveryEmail,
        deliveryEmailAddress,
        deliveryWhatsapp,
      });

      const submissionId = res.data.submissionId;
      setActiveSubmissionId(submissionId);

      // Initialize only the activated providers returned by server or fallback to active
      const activeList: string[] = res.data.activeProviders || ['TMQ_SPECIAL', 'SAPLING'];
      const initialMap: Record<string, { status: string; score?: number }> = {};
      activeList.forEach((provName: string) => {
        initialMap[provName] = { status: 'PENDING' };
      });
      setDetectorStatus(initialMap);

      // Start SSE listening with token
      const token = localStorage.getItem('tmq_token') || localStorage.getItem('tmq_access_token') || '';
      const apiBase = 'https://tmq-authenticity-api.onrender.com/api';
      const eventSource = new EventSource(`${apiBase}/submissions/${submissionId}/events?token=${encodeURIComponent(token)}`);

      let completed = false;

      // Active polling fallback in case SSE connection drops through Cloudflare/Render proxies
      const pollInterval = setInterval(async () => {
        if (completed) {
          clearInterval(pollInterval);
          return;
        }
        try {
          const checkRes = await api.get(`/submissions/${submissionId}`);
          const sub = checkRes.data?.submission;
          if (sub && (sub.status === 'COMPLETE' || sub.status === 'FAILED')) {
            completed = true;
            clearInterval(pollInterval);
            try { eventSource.close(); } catch (e) {}
            navigate(`/report/${submissionId}`);
          }
        } catch (e) {
          // ignore transient poll errors
        }
      }, 1200);

      // Hard timeout fallback: redirect after 25s if backend finished or stuck
      setTimeout(() => {
        if (!completed) {
          completed = true;
          clearInterval(pollInterval);
          try { eventSource.close(); } catch (e) {}
          navigate(`/report/${submissionId}`);
        }
      }, 25000);

      eventSource.addEventListener('status', (e: any) => {
        const data = JSON.parse(e.data);
        setStatusState(data.status);
        if (data.status === 'COMPLETE' || data.status === 'FAILED') {
          completed = true;
          clearInterval(pollInterval);
          try { eventSource.close(); } catch (e) {}
          setTimeout(() => {
            navigate(`/report/${submissionId}`);
          }, 500);
        }
      });

      eventSource.addEventListener('detector', (e: any) => {
        const data = JSON.parse(e.data);
        setDetectorStatus((prev) => ({
          ...prev,
          [data.provider]: { status: data.status, score: data.aiScore },
        }));
      });

      eventSource.onerror = () => {
        // SSE error, keep polling active to redirect once done
        eventSource.close();
      };
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed');
      setSubmitting(false);
      setStatusState(null);
    }
  };

  const handleSampleFill = () => {
    setText(
      `In the quiet hours just before dawn, the mist settled over the cobblestones like a forgotten secret. Oliver tightened the woolen scarf around his neck, listening to the muffled toll of the parish bell. For thirty years, the quill shop had opened at precisely six o'clock, regardless of rain, revolution, or the encroaching hum of steam engines from the city's modern quarter.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white/70 backdrop-blur-sm border border-moss/20 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-forest">Authenticity Inspection Desk</h1>
            <p className="text-xs text-ink/70 mt-1">
              Simultaneously scan your manuscript through GPTZero, Copyleaks, Sapling, Originality.ai & Winston AI.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSampleFill}
            className="self-start text-xs font-medium px-3 py-1.5 border border-moss/40 rounded-lg bg-sage/20 text-forest hover:bg-sage/40 transition"
          >
            Insert Sample Manuscript
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-700 p-4 rounded text-sm text-red-800 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm border border-moss/20 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs text-ink/60 font-medium">
            <span>PASTE TEXT OR CHAPTER DRAFT</span>
            <span className={isOverLimit ? 'text-red-700 font-bold' : 'text-moss'}>
              {wordCount.toLocaleString()} / 10,000 words
            </span>
          </div>

          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
            placeholder="Paste raw literary text, essay, or dialogue here for aggregate authenticity verification..."
            className="w-full p-4 border border-moss/30 rounded-lg font-serif text-sm bg-parchment/20 focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed placeholder:font-sans"
          />
        </div>

        {/* Delivery Options */}
        <div className="bg-white/80 backdrop-blur-sm border border-moss/20 rounded-xl p-5 shadow-sm">
          <h3 className="font-serif font-bold text-sm text-forest mb-3">Delivery of Forensic Report & PDF Certificate</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Option */}
            <div className="p-3 border border-moss/20 rounded-lg bg-parchment/20">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryEmail}
                  onChange={(e) => setDeliveryEmail(e.target.checked)}
                  className="rounded text-forest focus:ring-forest"
                />
                <Mail className="w-4 h-4 text-forest" />
                <span className="text-xs font-semibold text-ink">Deliver to Gmail / Email Inbox</span>
              </label>

              {deliveryEmail && (
                <input
                  type="email"
                  value={deliveryEmailAddress}
                  onChange={(e) => setDeliveryEmailAddress(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-2 w-full text-xs p-2 border border-moss/30 rounded bg-white"
                />
              )}
            </div>

            {/* WhatsApp Option */}
            <div className="p-3 border border-moss/20 rounded-lg bg-parchment/20">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryWhatsapp}
                  onChange={(e) => setDeliveryWhatsapp(e.target.checked)}
                  className="rounded text-forest focus:ring-forest"
                />
                <Phone className="w-4 h-4 text-moss" />
                <span className="text-xs font-semibold text-ink">Deliver to WhatsApp Number</span>
              </label>
              <p className="text-[11px] text-ink/60 mt-2">
                Sends concise verdict slip & downloadable PDF document via Meta Cloud API.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || isOverLimit || wordCount === 0}
            className="flex items-center space-x-2 px-8 py-3 bg-forest text-parchment font-serif font-bold rounded-xl shadow-md hover:bg-forest/90 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Aggregating Algorithms...' : 'Execute Authenticity Scan'}</span>
          </button>
        </div>
      </form>

      {/* Live Pipeline Monitor Modal/Section */}
      {submitting && (
        <div className="bg-forest text-parchment rounded-xl p-6 shadow-lg border border-sage/30 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-lg">Multi-Detector Engine Active</h3>
            <span className="text-xs px-2.5 py-1 bg-moss/50 border border-sage/30 rounded-full font-mono uppercase tracking-wider">
              Status: {statusState || 'PROCESSING'}
            </span>
          </div>

          <p className="text-xs text-sage mb-5">
            Your manuscript has fanned out across {Object.keys(detectorStatus).length || 2} active linguistic detection engines. Building aggregate report.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(detectorStatus).map(([name, info]) => (
              <div key={name} className="bg-black/20 p-3 rounded-lg border border-sage/10 text-center">
                <div className="text-xs font-bold text-sage">{name}</div>
                <div className="mt-2 flex items-center justify-center space-x-1">
                  {info.status === 'OK' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : info.status === 'RUNNING' ? (
                    <Clock className="w-4 h-4 text-amber animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-parchment/40" />
                  )}
                  <span className="text-[11px] font-mono">
                    {info.score !== undefined ? `${info.score}%` : info.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
