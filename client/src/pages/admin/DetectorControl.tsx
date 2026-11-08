import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Cpu, Power, Sliders } from 'lucide-react';

export const DetectorControl: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/providers');
      setProviders(res.data.providers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggle = async (provider: any) => {
    await api.patch(`/admin/providers/${provider.id}`, { enabled: !provider.enabled });
    fetchProviders();
  };

  const handleWeightChange = async (provider: any, newWeight: number) => {
    await api.patch(`/admin/providers/${provider.id}`, { weight: newWeight });
    fetchProviders();
  };

  return (
    <div className="space-y-6">
      <div className="bg-tmq-surface border border-tmq-border rounded-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-tmq-text-strong">Detector Calibration & Weighting</h1>
        <p className="text-xs text-tmq-text-muted mt-1">Configure which external APIs participate in the combined authenticity score.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => (
          <div key={p.id} className="bg-tmq-surface border border-tmq-border rounded-card p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-tmq-text-strong">{p.name}</h3>
                <span className="text-[10px] uppercase font-bold text-tmq-brand">Health: {p.health}</span>
              </div>
              <button
                onClick={() => handleToggle(p)}
                className={`px-3 py-1.5 rounded-btn text-xs font-semibold flex items-center space-x-1.5 transition ${
                  p.enabled
                    ? 'bg-tmq-brand text-tmq-on-brand hover:opacity-90'
                    : 'bg-tmq-surface-2 text-tmq-text-muted hover:text-tmq-text'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{p.enabled ? 'ACTIVE' : 'DISABLED'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-tmq-border">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-tmq-text-muted font-medium">Ensemble Score Weight:</span>
                <span className="font-mono font-bold text-tmq-brand">{p.weight}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={p.weight}
                onChange={(e) => handleWeightChange(p, parseFloat(e.target.value))}
                className="w-full accent-tmq-brand cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-tmq-text-soft mt-1">
                <span>0.1x (Marginal)</span>
                <span>1.0x (Standard)</span>
                <span>3.0x (Dominant)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
