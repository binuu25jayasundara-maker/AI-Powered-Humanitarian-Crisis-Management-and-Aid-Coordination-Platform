import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Download, AlertTriangle } from 'lucide-react';
import {
  computeCaseMetrics,
  computeOverrideStats,
  coordinationApi,
  downloadCsv,
  getDailyAISeries,
  isActive
} from '../../services/coordinationApi';
import { AIDecisionLogEntry, CaseStatus, CrisisCase, ResourceStock, Shelter } from '../../types/coordination';
import {
  BarChart,
  DonutChart,
  EmptyState,
  HBarChart,
  LineChart,
  PageHeader,
  Panel,
  STATUS_COLOR,
  useToast
} from '../../components/coordination/ui';

interface MetricRow {
  metric: string;
  value: string;
  target: string;
  ok: boolean;
}

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CrisisCase[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<ResourceStock[]>([]);
  const [log, setLog] = useState<AIDecisionLogEntry[]>([]);
  const [days, setDays] = useState<7 | 14>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  const isOffline = coordinationApi.isOffline();

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      coordinationApi.getCases(),
      coordinationApi.getShelters(),
      coordinationApi.getResources(),
      coordinationApi.getDecisionLog()
    ])
      .then(([c, s, r, l]) => {
        setCases(c);
        setShelters(s);
        setResources(r);
        setLog(l);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load report data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const m = useMemo(() => computeCaseMetrics(cases), [cases]);
  const override = useMemo(() => computeOverrideStats(log), [log]);
  const daily = useMemo(() => getDailyAISeries(days), [days]);

  const metricRows: MetricRow[] = useMemo(() => {
    const cap = shelters.reduce((s, x) => s + x.capacity, 0);
    const occ = shelters.reduce((s, x) => s + x.occupied, 0);
    const shelterPct = cap ? (occ / cap) * 100 : 0;
    const util = resources.length
      ? (resources.reduce((s, x) => s + x.allocated / Math.max(1, x.total), 0) / resources.length) * 100
      : 0;
    const resolutionRate = m.total ? (m.resolved / m.total) * 100 : 0;
    return [
      { metric: 'Total cases', value: String(m.total), target: '-', ok: true },
      { metric: 'Open cases', value: String(m.open), target: '-', ok: true },
      { metric: 'In-progress cases', value: String(m.inProgress), target: '-', ok: true },
      { metric: 'Resolved cases', value: String(m.resolved), target: '-', ok: true },
      { metric: 'Rejected cases', value: String(m.rejected), target: '-', ok: true },
      { metric: 'Escalated cases', value: String(m.escalated), target: '0', ok: m.escalated === 0 },
      { metric: 'Unresolved cases', value: String(m.unresolved), target: '0', ok: m.unresolved === 0 },
      { metric: 'Overdue cases', value: String(m.overdue), target: '0', ok: m.overdue === 0 },
      { metric: 'Average first response (min)', value: m.avgResponse.toFixed(1), target: '<= 30', ok: m.avgResponse <= 30 },
      { metric: 'Resolution rate (%)', value: resolutionRate.toFixed(1), target: '>= 60', ok: resolutionRate >= 60 },
      { metric: 'Shelter occupancy (%)', value: shelterPct.toFixed(1), target: '<= 90', ok: shelterPct <= 90 },
      { metric: 'Resource utilisation (%)', value: util.toFixed(1), target: '<= 85', ok: util <= 85 },
      { metric: 'AI override rate (%)', value: override.rate.toFixed(1), target: '<= 25', ok: override.rate <= 25 }
    ];
  }, [m, shelters, resources, override]);

  const workload = useMemo(() => {
    const map = new Map<string, number>();
    cases.filter(isActive).forEach((c) => {
      const key = c.assignedTo || 'Unassigned';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value, color: label === 'Unassigned' ? '#FFB51B' : '#0866C6' }))
      .sort((a, b) => b.value - a.value);
  }, [cases]);

  const statusData = [
    { label: 'Open', value: m.open, color: '#0866C6' },
    { label: 'In Progress', value: m.inProgress, color: '#0B3B70' },
    { label: 'Resolved', value: m.resolved, color: '#12A86B' },
    { label: 'Rejected', value: m.rejected, color: '#DC3545' }
  ];

  const exportCsv = () => {
    downloadCsv('coordination-metrics.csv', [
      ['Metric', 'Value', 'Target', 'On target'],
      ...metricRows.map((r) => [r.metric, r.value, r.target, r.ok ? 'Yes' : 'No']),
      [],
      ['Workload (active cases)', 'Count'],
      ...workload.map((w) => [w.label, w.value]),
      [],
      ['Status', 'Count'],
      ...statusData.map((s) => [s.label, s.value])
    ]);
    showToast('Report exported as CSV');
  };

  if (loading) {
    return <div className="co-page"><EmptyState title="Loading report..." /></div>;
  }

  if (error) {
    const isAuth = error.toLowerCase().includes('log in') || error.toLowerCase().includes('authentication') || error.includes('401');
    return (
      <div className="co-page">
        <Panel>
          <EmptyState title="Could not load report data" message={error} />
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
        badges={<span className="badge badge-navy"><BarChart3 size={13} /> Coordination</span>}
        title="Reports"
        subtitle="Operational performance, team workload and AI oversight trends."
        actions={
          <>
            <select className="co-select" value={days} onChange={(e) => setDays(Number(e.target.value) as 7 | 14)}>
              <option value={7}>AI trends: last 7 days</option>
              <option value={14}>AI trends: last 14 days</option>
            </select>
            <button className="co-btn co-btn-green" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </button>
          </>
        }
      />

      <Panel title="Key metrics" subtitle="Current values against operating targets" className="co-mb">
        <div className="co-table-wrap">
          <table className="rq-table">
            <thead>
              <tr><th>Metric</th><th>Value</th><th>Target</th><th>Status</th></tr>
            </thead>
            <tbody>
              {metricRows.map((r) => (
                <tr key={r.metric}>
                  <td style={{ fontWeight: 600 }}>{r.metric}</td>
                  <td style={{ fontWeight: 800 }}>{r.value}</td>
                  <td className="co-muted">{r.target}</td>
                  <td>
                    {r.target === '-' ? (
                      <span className="badge badge-navy">Info</span>
                    ) : (
                      <span className={`badge ${r.ok ? 'badge-green' : 'badge-amber'}`}>{r.ok ? 'On target' : 'Needs attention'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="co-grid co-grid-2 co-mb">
        <Panel title="Team workload" subtitle="Active cases per assignee">
          {workload.length ? <HBarChart data={workload} /> : <p className="co-muted">No active cases.</p>}
        </Panel>
        <Panel title="Case status" subtitle="All cases by current status">
          <DonutChart data={statusData} centerLabel="cases" />
        </Panel>
      </div>

      <div className="co-grid co-grid-2">
        <Panel title="AI recommendation trend" subtitle="Recommendations issued vs accepted per day">
          <LineChart
            labels={daily.map((d) => d.label)}
            series={[
              { name: 'Recommendations', color: '#0866C6', values: daily.map((d) => d.recommendations), area: true },
              { name: 'Accepted', color: '#12A86B', values: daily.map((d) => d.accepted) }
            ]}
            labelEvery={days === 14 ? 2 : 1}
          />
        </Panel>
        <Panel title="AI overrides per day" subtitle="Recommendations changed or rejected by coordinators">
          <BarChart data={daily.map((d) => ({ label: d.label.slice(0, 6), value: d.overridden }))} defaultColor="#FFB51B" />
        </Panel>
      </div>
      {toast}
    </div>
  );
};

export default ReportsPage;
