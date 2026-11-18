import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Inbox, Info, Loader2, ShieldAlert } from 'lucide-react';
import { AlertLevel, REQUEST_STEPS, RequestStatus } from '../../types/citizen';

export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'navy';

/** Loads data from an async function. Gives loading + error state. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Something went wrong'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, setData, loading, error, reload };
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const PageHeader: React.FC<{ title: string; subtitle?: string; chips?: React.ReactNode }> = ({ title, subtitle, chips }) => (
  <div style={{ marginBottom: 24 }}>
    {chips && <div className="cz-chips">{chips}</div>}
    <h1 className="cz-title">{title}</h1>
    {subtitle && <p className="cz-sub">{subtitle}</p>}
  </div>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; sub: string; tone: Tone }> = ({ label, value, sub, tone }) => (
  <div className="stat-card">
    <div className="cz-stat-label">{label}</div>
    <div className={`cz-stat-value cz-tone-${tone}`}>{value}</div>
    <div className="cz-muted">{sub}</div>
  </div>
);

export const ActionCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; tone: Tone; onClick: () => void }> = ({ icon, title, subtitle, tone, onClick }) => (
  <button type="button" className="cz-action" onClick={onClick}>
    <span className={`cz-tile cz-tile-${tone}`}>{icon}</span>
    <span><strong>{title}</strong><span className="sub">{subtitle}</span></span>
  </button>
);

export const AlertBanner: React.FC<{ level: AlertLevel; title: string; message: string }> = ({ level, title, message }) => (
  <div className={`cz-banner cz-banner-${level}`} role="alert">
    {level === 'Info' ? <Info size={20} /> : level === 'Danger' ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
    <div><h3>{title}</h3><p>{message}</p></div>
  </div>
);

export const Stepper: React.FC<{ status: RequestStatus }> = ({ status }) => {
  const current = REQUEST_STEPS.indexOf(status);
  return (
    <div className="cz-stepper" aria-label={`Request status: ${status}`}>
      {REQUEST_STEPS.map((s, i) => (
        <div key={s} className={`cz-step ${i < current || status === 'Delivered' ? 'done' : ''} ${i === current && status !== 'Delivered' ? 'current' : ''}`}>
          <div className="cz-dot">{i <= current ? <Check size={14} /> : i + 1}</div>
          {s}
        </div>
      ))}
    </div>
  );
};

export const CapacityBar: React.FC<{ occupied: number; capacity: number }> = ({ occupied, capacity }) => {
  const pct = Math.min(100, Math.round((occupied / capacity) * 100));
  const level = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'green';
  return (
    <div>
      <div className={`cz-bar cz-bar-${level}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className="cz-muted" style={{ marginTop: 4 }}>{occupied}/{capacity} people ({pct}% full)</div>
    </div>
  );
};

export const Loading: React.FC = () => (
  <div className="cz-state"><Loader2 className="cz-spin" size={28} /><div>Loading...</div></div>
);

export const ErrorBox: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="cz-state">
    <AlertTriangle size={28} color="var(--color-error)" />
    <div style={{ margin: '8px 0 12px' }}>{message}</div>
    {onRetry && <button type="button" className="btn-secondary" onClick={onRetry}>Try again</button>}
  </div>
);

export const EmptyState: React.FC<{ title: string; text?: string }> = ({ title, text }) => (
  <div className="cz-state"><Inbox size={28} /><div style={{ fontWeight: 700, marginTop: 6 }}>{title}</div>{text && <div>{text}</div>}</div>
);

export const Toast: React.FC<{ message: string | null }> = ({ message }) =>
  message ? <div className="cz-toast" role="status">{message}</div> : null;
