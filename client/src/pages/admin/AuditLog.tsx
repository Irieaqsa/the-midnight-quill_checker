import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldAlert, Clock, Terminal } from 'lucide-react';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit');
        setLogs(res.data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white/70 backdrop-blur-sm border border-moss/20 rounded-xl p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-forest">Forensic Audit Log</h1>
        <p className="text-xs text-ink/70 mt-1">Immutable ledger tracking every administrator access to author manuscripts, exports, and calibrations.</p>
      </div>

      <div className="bg-white/90 border border-moss/20 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-moss/10 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-parchment/30 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Terminal className="w-4 h-4 text-moss flex-shrink-0" />
                <div>
                  <span className="font-bold text-forest mr-2">{log.action}</span>
                  {log.targetType && (
                    <span className="text-[11px] text-ink/70">
                      [{log.targetType}: {log.targetId}]
                    </span>
                  )}
                  <div className="text-[10px] text-ink/40 font-sans">
                    Executed by {log.admin?.name} ({log.admin?.email}) from IP {log.ip}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-ink/50 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
