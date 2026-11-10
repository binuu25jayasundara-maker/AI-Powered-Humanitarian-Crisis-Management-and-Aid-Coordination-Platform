import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FastForward, Star } from 'lucide-react';
import { citizenApi } from '../../services/citizenApi';
import { EmptyState, Loading, PageHeader, Stepper, Toast, formatDate, useAsync } from '../../components/citizen/ui';

export const TrackerPage: React.FC = () => {
  const { data, setData, loading, error, reload } = useAsync(() => citizenApi.getRequests());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  if (loading) return <Loading />;
  if (error || !data) {
    const isAuth = error?.toLowerCase().includes('log in') || error?.toLowerCase().includes('authentication') || error?.includes('401');
    return (
      <div className="cz-page">
        <PageHeader title="My Requests" subtitle="Follow the progress of your help requests." />
        <div className="cz-state">
          <AlertTriangle size={28} color="var(--color-error)" />
          <div style={{ margin: '8px 0 12px' }}>{error ?? 'Could not load requests'}</div>
          {isAuth ? (
            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Log in again
            </Link>
          ) : (
            <button type="button" className="btn-secondary" onClick={reload}>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const isOffline = citizenApi.isOffline();
  const selected = data.find((r) => r.id === selectedId) ?? data[0];

  const advance = async () => { if (selected) setData(await citizenApi.advanceRequest(selected.id).then(() => citizenApi.getRequests())); };
  const sendRating = async () => {
    if (!selected || rating === 0) { notify('Please choose a star rating.'); return; }
    await citizenApi.rateRequest(selected.id, rating, feedback.trim());
    setData(await citizenApi.getRequests());
    setRating(0); setFeedback('');
    notify('Thank you for your feedback!');
  };

  return (
    <div className="cz-page">
      <PageHeader title="My Requests" subtitle="Follow the progress of your help requests." />

      {isOffline && (
        <div className="cz-banner cz-banner-Warning" style={{ marginBottom: 16 }}>
          <AlertTriangle size={20} />
          <div>
            <h3>Offline: showing demo data</h3>
            <p>Could not reach the Core API. Showing cached local or demo data.</p>
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="card"><EmptyState title="No requests yet" text="When you ask for help, it will appear here." /><div style={{ textAlign: 'center' }}><Link to="/citizen/request" className="btn-primary" style={{ textDecoration: 'none' }}>Request help</Link></div></div>
      ) : (
        <div className="cz-grid cz-grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div>
            {data.map((r) => (
              <button type="button" key={r.id} className={`cz-item ${selected?.id === r.id ? 'active' : ''}`} onClick={() => setSelectedId(r.id)}>
                <span><strong style={{ fontSize: 14 }}>{r.reference}</strong><br /><span className="cz-muted">{r.category} · {formatDate(r.createdAt)}</span></span>
                <span className={`badge ${r.status === 'Delivered' ? 'badge-green' : 'badge-amber'}`}>{r.queued ? 'Queued' : r.status}</span>
              </button>
            ))}
          </div>
          {selected && (
            <div className="card">
              <div className="cz-between">
                <h2 className="cz-h2" style={{ marginBottom: 0 }}>{selected.reference}</h2>
                <span className={`badge ${selected.urgency === 'Critical' ? 'badge-red' : 'badge-blue'}`}>{selected.urgency}</span>
              </div>
              <p className="cz-muted" style={{ margin: '6px 0' }}>{selected.category} · {selected.location}</p>
              <p style={{ fontSize: 14 }}>{selected.description}</p>
              {selected.queued && <div className="cz-banner cz-banner-Warning" style={{ marginTop: 12 }}><div><h3>Saved on this phone</h3><p>It will be sent when you are online.</p></div></div>}
              <Stepper status={selected.status} />
              {selected.etaMinutes && <p className="cz-muted">Estimated arrival: about {selected.etaMinutes} minutes</p>}

              {isOffline && selected.status !== 'Delivered' && (
                <button type="button" className="btn-secondary" style={{ marginTop: 12 }} onClick={advance}>
                  <FastForward size={16} /> Demo: move to next step
                </button>
              )}

              {selected.history && selected.history.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <h3 className="cz-h2" style={{ fontSize: 15, marginBottom: 8 }}>Status History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selected.history.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          fontSize: 13,
                          padding: '8px 12px',
                          background: 'var(--color-bg-subtle, #f8fafc)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <strong>{h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : h.newStatus}</strong>
                          <span className="cz-muted">{formatDate(h.timestamp)}</span>
                        </div>
                        {h.note && <div style={{ color: 'var(--color-text-muted)' }}>Note: {h.note}</div>}
                        {h.changedByEmail && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>By: {h.changedByEmail}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.status === 'Delivered' && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <h3 className="cz-h2">Rate this help</h3>
                  {selected.rating ? (
                    <p>You rated this {selected.rating}/5. {selected.feedback}</p>
                  ) : (
                    <>
                      <div role="radiogroup" aria-label="Rating">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star`} className={`cz-star ${n <= rating ? 'on' : ''}`} onClick={() => setRating(n)}><Star size={24} fill={n <= rating ? 'currentColor' : 'none'} /></button>
                        ))}
                      </div>
                      <textarea className="cz-input" rows={2} placeholder="Comment (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                      <button type="button" className="btn-primary" style={{ marginTop: 8 }} onClick={sendRating}>Submit rating</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
};
