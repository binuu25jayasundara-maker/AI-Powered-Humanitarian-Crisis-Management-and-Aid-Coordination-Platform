import React, { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { citizenApi } from '../../services/citizenApi';
import { AlertLevel } from '../../types/citizen';
import { EmptyState, ErrorBox, Loading, PageHeader, formatDate, useAsync } from '../../components/citizen/ui';

const FILTERS: Array<'All' | AlertLevel> = ['All', 'Danger', 'Warning', 'Info'];

export const AlertsPage: React.FC = () => {
  const { data, loading, error, reload } = useAsync(() => citizenApi.getAlerts());
  const [filter, setFilter] = useState<'All' | AlertLevel>('All');

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? 'Could not load alerts'} onRetry={reload} />;
  const list = data.filter((a) => filter === 'All' || a.level === filter);

  return (
    <div className="cz-page">
      <PageHeader title="Safety Alerts" subtitle="Official warnings and safety advice." />
      <div className="cz-tabs" role="tablist">
        {FILTERS.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} className={`cz-tab ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {list.length === 0 ? <div className="card"><EmptyState title="No alerts" /></div> : list.map((a) => (
        <div key={a.id} className={`cz-banner cz-banner-${a.level}`} style={{ flexDirection: 'column' }}>
          <div className="cz-between">
            <h3 style={{ fontSize: 15 }}>{a.title}</h3>
            <span className="cz-muted">{formatDate(a.issuedAt)}</span>
          </div>
          <p>{a.message}</p>
          <div className="cz-row" style={{ fontSize: 12 }}>
            {a.verified && <span className="badge badge-green"><BadgeCheck size={13} /> Verified</span>}
            <span className="cz-muted">Source: {a.source}</span>
          </div>
          <strong style={{ fontSize: 13, marginTop: 6 }}>What to do</strong>
          <ul style={{ paddingLeft: 18, fontSize: 13 }}>{a.guidance.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      ))}
    </div>
  );
};
