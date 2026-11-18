import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, Copy, AlertTriangle } from 'lucide-react';
import { coordinationApi, isActive, isOverdue, NEED_TYPES, priorityScore, slaLabel, timeAgo, URGENCY_ORDER } from '../../services/coordinationApi';
import { CrisisCase, NeedType, Urgency } from '../../types/coordination';
import { EmptyState, PageHeader, Panel, StatusBadge, Tabs, UrgencyBadge } from '../../components/coordination/ui';

type TabKey = 'all' | 'open' | 'overdue' | 'escalated' | 'unresolved';

const matchesTab = (c: CrisisCase, tab: TabKey): boolean => {
  switch (tab) {
    case 'open':
      return isActive(c);
    case 'overdue':
      return isOverdue(c);
    case 'escalated':
      return c.status === 'Escalated' || c.status === 'Prioritised';
    case 'unresolved':
      return c.status === 'Unresolved' || c.status === 'Needs Information';
    default:
      return true;
  }
};

export const CaseQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CrisisCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [urgency, setUrgency] = useState<'ALL' | Urgency>('ALL');
  const [need, setNeed] = useState<'ALL' | NeedType>('ALL');

  const loadData = () => {
    setLoading(true);
    setError(null);
    coordinationApi.getCases()
      .then((data) => {
        setCases(data);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load cases');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const isOffline = coordinationApi.isOffline();

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'escalated', label: 'Escalated' },
    { key: 'unresolved', label: 'Unresolved' }
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases
      .filter((c) => matchesTab(c, tab))
      .filter((c) => urgency === 'ALL' || c.urgency === urgency)
      .filter((c) => need === 'ALL' || c.needType === need)
      .filter(
        (c) =>
          !q ||
          c.ref.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.reporter.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (isActive(a) !== isActive(b)) return isActive(a) ? -1 : 1;
        return priorityScore(b) - priorityScore(a);
      });
  }, [cases, tab, search, urgency, need]);

  if (error) {
    const isAuth = error.toLowerCase().includes('log in') || error.toLowerCase().includes('authentication') || error.includes('401');
    return (
      <div className="co-page">
        <PageHeader
          badges={<span className="badge badge-blue"><ClipboardList size={13} /> Coordination</span>}
          title="Case Queue"
          subtitle="All incoming help requests, ranked by priority."
        />
        <Panel>
          <EmptyState title="Could not load cases" message={error} />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            {isAuth ? (
              <button className="co-btn co-btn-blue" onClick={() => navigate('/login')}>Go to Login</button>
            ) : (
              <button className="co-btn co-btn-blue" onClick={loadData}>Try again</button>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="co-page">
      {isOffline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'var(--color-amber-soft)',
          border: '1px solid var(--color-amber-dark)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-amber-dark)',
          marginBottom: '16px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <AlertTriangle size={18} />
          <span>Offline: showing demo data (Core API unreachable)</span>
        </div>
      )}

      <PageHeader
        badges={<span className="badge badge-blue"><ClipboardList size={13} /> Coordination</span>}
        title="Case Queue"
        subtitle="All incoming help requests, ranked by priority. Open a case to review evidence, assign it or escalate."
      />

      <Tabs
        tabs={tabs.map((t) => ({ ...t, count: cases.filter((c) => matchesTab(c, t.key)).length }))}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      <div className="card co-filters">
        <div className="co-search">
          <Search size={17} color="#526784" />
          <input
            type="text"
            placeholder="Search by reference, title, location or reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="co-select" value={urgency} onChange={(e) => setUrgency(e.target.value as 'ALL' | Urgency)}>
          <option value="ALL">All urgency levels</option>
          {URGENCY_ORDER.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <select className="co-select" value={need} onChange={(e) => setNeed(e.target.value as 'ALL' | NeedType)}>
          <option value="ALL">All need types</option>
          {NEED_TYPES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="co-table-wrap">
          <table className="rq-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Need</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Assigned to</th>
                <th>Reported</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="co-row-link" onClick={() => navigate(`/coordination/cases/${c.id}`)}>
                  <td>
                    <div className="co-title-cell">
                      <span className="co-ref">{c.ref}</span> {c.title}
                      {c.duplicateOfId && (
                        <span className="badge badge-amber" style={{ marginLeft: 8 }}>
                          <Copy size={11} /> Possible duplicate
                        </span>
                      )}
                    </div>
                    <div className="co-small co-muted">{c.location}, {c.district}</div>
                  </td>
                  <td>{c.needType}</td>
                  <td><UrgencyBadge urgency={c.urgency} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>{c.assignedTo || <span className="co-muted">Unassigned</span>}</td>
                  <td className="co-muted">{timeAgo(c.createdAt)}</td>
                  <td className={isOverdue(c) ? 'co-overdue' : 'co-ontime'}>{slaLabel(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState title="No cases match these filters" message="Try another tab or clear the search." />}
      </div>
    </div>
  );
};

export default CaseQueuePage;
