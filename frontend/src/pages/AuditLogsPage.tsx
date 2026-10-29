import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditEvent } from '../types';
import { FileText, ShieldAlert, CheckCircle, Search, Eye } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await api.getAuditLogs();
    setLogs(data);
  };

  const filtered = logs.filter((l) => {
    const matchesSearch = l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.actorEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = entityFilter === 'ALL' || l.entityName === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)' }}>
          Immutable Security & Operational Audit Log
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Real-time accountability trail recording every user action, authentication attempt, and AI decision override.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search audit trail by action or actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', padding: '8px 0', fontSize: '13px', outline: 'none' }}
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
        >
          <option value="ALL">All Entity Types</option>
          <option value="User">User</option>
          <option value="Case">Crisis Case / Incident</option>
          <option value="VolunteerTask">Volunteer Task</option>
          <option value="Donation">Donation</option>
          <option value="System">System Baseline</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Timestamp (UTC)</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Actor</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Action</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Entity Type</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>IP Address</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', color: '#475569', fontFamily: 'monospace', fontSize: '12px' }}>
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--color-navy)' }}>
                  {l.actorEmail}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700
                  }}>
                    {l.action}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', color: '#334155', fontWeight: 600 }}>
                  {l.entityName} {l.entityId && `(${l.entityId})`}
                </td>
                <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                  {l.ipAddress || '127.0.0.1'}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: l.status === 'Success' ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: '12px' }}>
                    {l.status === 'Success' ? <CheckCircle size={14} /> : <ShieldAlert size={14} />} {l.status}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedLog(l)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      backgroundColor: '#f1f5f9',
                      color: '#2563eb',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100
        }}>
          <div className="card" style={{ width: '560px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Audit Event Details</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div><strong>Event ID:</strong> {selectedLog.id}</div>
              <div><strong>Action:</strong> {selectedLog.action}</div>
              <div><strong>Actor:</strong> {selectedLog.actorEmail}</div>
              <div><strong>Entity:</strong> {selectedLog.entityName} {selectedLog.entityId}</div>
              <div><strong>Timestamp:</strong> {selectedLog.createdAt}</div>
              <div><strong>IP Address:</strong> {selectedLog.ipAddress}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Metadata Payload (JSON):</div>
              <pre style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                overflowX: 'auto'
              }}>
                {selectedLog.detailsJson}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ backgroundColor: 'var(--color-blue-primary)', color: '#fff', padding: '8px 18px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
