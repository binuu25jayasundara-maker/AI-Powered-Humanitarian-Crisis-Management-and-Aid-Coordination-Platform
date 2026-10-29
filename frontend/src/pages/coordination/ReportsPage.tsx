import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
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
  HBarChart,
  LineChart,
  PageHeader,
  Panel,
  STATUS_COLOR,
  useToast
} from '../../components/coordination/ui';

const STATUSES: CaseStatus[] = ['Open', 'In Progress', 'Escalated', 'Unresolved', 'Resolved'];

interface MetricRow {
  metric: string;
  value: string;
  target: string;
  ok: boolean;
}

export const ReportsPage: React.FC = () => {
  const [cases, setCases] = useState<CrisisCase[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<ResourceStock[]>([]);
  const [log, setLog] = useState<AIDecisionLogEntry[]>([]);
  const [days, setDays] = useState<7 | 14>(7);
  const [toast, showToast] = useToast();

  useEffect(() => {
    Promise.all([
      coordinationApi.getCases(),
      coordinationApi.getShelters(),
      coordinationApi.getResources(),
      coordinationApi.getDecisionLog()
    ]).then(([c, s, r, l]) => {
      setCases(c);
      setShelters(s);
      setResources(r);
      setLog(l);
    });
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
      { metric: 'Open cases (incl. in progress)', value: String(m.open), target: '-', ok: true },
      { metric: 'Escalated cases', value: String(m.escalated), target: '<= 3', ok: m.escalated <= 3 },
      { metric: 'Unresolved cases', value: String(m.unresolved), target: '<= 2', ok: m.unresolved <= 2 },
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

  const statusData = STATUSES.map((s) => ({
    label: s,
    value: cases.filter((c) => c.status === s).length,
    color: STATUS_COLOR[s]
  }));

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

  return (
    <div className="co-page">
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
