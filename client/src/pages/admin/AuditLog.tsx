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
      <div className="bg-tmq-surface border border-tmq-border rounded-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-tmq-text-strong">Forensic Audit Log</h1>
        <p className="text-xs text-tmq-text-muted mt-1">Immutable ledger tracking every administrator access to author manuscripts, exports, and calibrations.</p>
      </div>

      <div className="bg-tmq-surface border border-tmq-border rounded-card shadow-sm overflow-hidden">
        <div className="divide-y divide-tmq-border font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-tmq-surface-2/60 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Terminal className="w-4 h-4 text-tmq-brand flex-shrink-0" />
                <div>
                  <span className="font-bold text-tmq-text-strong mr-2">{log.action}</span>
                  {log.targetType && (
                    <span className="text-[11px] text-tmq-text-muted">
                      [{log.targetType}: {log.targetId}]
                    </span>
                  )}
                  <div className="text-[10px] text-tmq-text-soft font-sans mt-0.5">
                    Executed by {log.admin?.name} ({log.admin?.email}) from IP {log.ip}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-tmq-text-muted whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
