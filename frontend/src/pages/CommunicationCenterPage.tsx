import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationRecord, NotificationResult } from '../types';
import { Send, Shield, RefreshCw, Mail, MessageSquare, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export const CommunicationCenterPage: React.FC = () => {
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [channel, setChannel] = useState<'Email' | 'SMS' | 'Push'>('Email');
  const [recipient, setRecipient] = useState('coordinator@resqnet.org');
  const [subject, setSubject] = useState('Urgent Shelter Supply Dispatch');
  const [body, setBody] = useState('Flood Relief 2024 logistics center requires 200 tarpaulin units dispatched immediately.');
  const [idempotencyKey, setIdempotencyKey] = useState(`KEY-${Math.floor(100000 + Math.random() * 900000)}`);
  const [dispatchResult, setDispatchResult] = useState<NotificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await api.getNotificationHistory();
    setHistory(data);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.sendNotification({
        channel,
        recipient,
        subject,
        body,
        idempotencyKey
      });
      setDispatchResult(res);
      await loadHistory();
    } catch {
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const generateNewKey = () => {
    setIdempotencyKey(`KEY-${Math.floor(100000 + Math.random() * 900000)}`);
    setDispatchResult(null);
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Communication & Idempotency Center
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Factory Pattern Dispatcher (Email, SMS, Push) with Idempotency Key Duplicate Suppression
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', marginBottom: '28px' }}>
        {/* Dispatch Form Card */}
        <div className="card" style={{ padding: '26px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Send size={20} color="#1d4ed8" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Test Channel Factory Dispatch
            </h3>
          </div>

          <form onSubmit={handleSend}>
            {/* Channel Selection (Factory Pattern) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Notification Channel (Resolved via Factory Pattern)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setChannel('Email'); setRecipient('coordinator@resqnet.org'); }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: channel === 'Email' ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
                    backgroundColor: channel === 'Email' ? '#eff6ff' : '#ffffff',
                    color: channel === 'Email' ? '#1d4ed8' : '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Mail size={18} />
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setChannel('SMS'); setRecipient('+94 77 333 4444'); }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: channel === 'SMS' ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
                    backgroundColor: channel === 'SMS' ? '#eff6ff' : '#ffffff',
                    color: channel === 'SMS' ? '#1d4ed8' : '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquare size={18} />
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setChannel('Push'); setRecipient('device_token_app_field_992'); }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: channel === 'Push' ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
                    backgroundColor: channel === 'Push' ? '#eff6ff' : '#ffffff',
                    color: channel === 'Push' ? '#1d4ed8' : '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Bell size={18} />
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Push Alert</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Recipient Address / Number / Token *
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Subject / Title *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Notification Message Body *
              </label>
              <textarea
                rows={3}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* Idempotency Key Feature */}
            <div style={{
              marginBottom: '20px',
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Idempotency Key (Deduplication Protection)
                </span>
                <button
                  type="button"
                  onClick={generateNewKey}
                  style={{
                    background: 'none',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Generate New Key</span>
                </button>
              </div>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#ffffff' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Tip: Click "Dispatch Notification" once, then click it again with the same key to verify duplicate suppression!
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              {loading ? 'Dispatching...' : 'Dispatch Notification via Factory'}
            </button>
          </form>
        </div>

        {/* Results & Architecture Explanation Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live Result Feedback */}
          {dispatchResult && (
            <div className="card" style={{
              padding: '22px',
              borderLeft: dispatchResult.wasDuplicateSuppressed ? '5px solid #d97706' : '5px solid #16a34a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {dispatchResult.wasDuplicateSuppressed ? (
                  <>
                    <AlertCircle size={20} color="#d97706" />
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#d97706' }}>
                      Duplicate Request Suppressed!
                    </h4>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} color="#16a34a" />
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>
                      Notification Dispatched Successfully!
                    </h4>
                  </>
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                <div><strong>Channel Factory Resolved:</strong> {dispatchResult.channelUsed}Channel</div>
                <div><strong>Recipient:</strong> {dispatchResult.recipient}</div>
                <div><strong>Status:</strong> {dispatchResult.wasDuplicateSuppressed ? 'Suppressed (Cached Idempotent OK)' : 'Delivered to Gateway'}</div>
                {dispatchResult.errorMessage && (
                  <div style={{ color: '#d97706', marginTop: '4px' }}>{dispatchResult.errorMessage}</div>
                )}
              </div>
            </div>
          )}

          {/* Architecture Card */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Shield size={20} color="#1d4ed8" />
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Architectural Patterns Active
              </h4>
            </div>
            <ul style={{ fontSize: '13px', color: '#475569', paddingLeft: '18px', lineHeight: '1.8' }}>
              <li>
                <strong>Factory Pattern:</strong> <code>INotificationChannelFactory</code> decouples SMS, Email, and Push providers, allowing dynamic routing.
              </li>
              <li>
                <strong>Observer Pattern:</strong> <code>IDomainEventDispatcher</code> automatically triggers volunteer and donor alerts upon database writes.
              </li>
              <li>
                <strong>Idempotency Outbox:</strong> SHA/unique keys prevent duplicated SMS and email transmissions during network retries.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Outbox / History Table */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Notification Outbox Audit Trail
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Recipient</th>
              <th style={{ padding: '12px 14px' }}>Channel</th>
              <th style={{ padding: '12px 14px' }}>Subject</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Dispatched At</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {h.recipient}
                </td>
                <td style={{ padding: '14px' }}>
                  <span className="badge badge-blue">{h.channel}</span>
                </td>
                <td style={{ padding: '14px', color: '#475569' }}>
                  {h.subject}
                </td>
                <td style={{ padding: '14px' }}>
                  <span className="badge badge-green">{h.status}</span>
                </td>
                <td style={{ padding: '14px', color: '#64748b', fontSize: '12px' }}>
                  {new Date(h.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
