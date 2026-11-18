import React, { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { citizenApi } from '../../services/citizenApi';
import { EmptyState, ErrorBox, Loading, PageHeader, formatDate, useAsync } from '../../components/citizen/ui';

type Tab = 'All' | 'Unread' | 'Requests' | 'Alerts';
const TABS: Tab[] = ['All', 'Unread', 'Requests', 'Alerts'];

export const NotificationsPage: React.FC = () => {
  const { data, setData, loading, error, reload } = useAsync(() => citizenApi.getNotifications());
  const [tab, setTab] = useState<Tab>('All');

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? 'Could not load notifications'} onRetry={reload} />;

  const unread = data.filter((n) => !n.read).length;
  const shown = data.filter((n) =>
    tab === 'All' ? true : tab === 'Unread' ? !n.read : tab === 'Requests' ? n.type === 'Request' : n.type === 'Alert');
  const count = (t: Tab) => (t === 'Unread' ? unread : t === 'All' ? data.length : data.filter((n) => n.type === (t === 'Requests' ? 'Request' : 'Alert')).length);

  const markRead = async (id?: string) => setData(await citizenApi.markNotificationRead(id));

  return (
    <div className="cz-page">
      <div className="cz-between">
        <PageHeader title="Notifications" subtitle="Updates about your requests and safety alerts."
          chips={unread > 0 ? <span className="badge badge-blue">{unread} unread</span> : undefined} />
        {unread > 0 && <button type="button" className="btn-secondary" onClick={() => markRead()}><CheckCheck size={16} /> Mark all as read</button>}
      </div>
      <div className="cz-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`cz-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{t} ({count(t)})</button>
        ))}
      </div>
      <div className="card">
        {shown.length === 0 ? <EmptyState title="Nothing here" text="You are all caught up." /> : shown.map((n) => (
          <div key={n.id} className={`cz-item ${n.read ? '' : 'unread'}`} style={{ cursor: 'default' }}>
            <div>
              <strong style={{ fontSize: 14 }}>{n.title}</strong>
              <div className="cz-muted">{n.message}</div>
              <div className="cz-row" style={{ marginTop: 6 }}>
                <span className="badge badge-navy">{n.channel}</span>
                <span className="cz-muted">{formatDate(n.createdAt)}</span>
              </div>
            </div>
            {!n.read && <button type="button" className="btn-secondary" onClick={() => markRead(n.id)}>Mark as read</button>}
          </div>
        ))}
      </div>
    </div>
  );
};
