import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  ShieldCheck,
  FolderOpen,
  ArrowUpRight,
  HelpCircle,
  Timer,
  Home,
  Package,
  BrainCircuit,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coordinationApi, computeCaseMetrics, computeOverrideStats, isActive, isOverdue, priorityScore, slaLabel, URGENCY_ORDER } from '../../services/coordinationApi';
import { AIDecisionLogEntry, CrisisCase, ResourceStock, Shelter } from '../../types/coordination';
import {
  BarChart,
  EmptyState,
  KpiCard,
  LineChart,
  PageHeader,
  Panel,
  StatusBadge,
  UrgencyBadge,
  URGENCY_COLOR
} from '../../components/coordination/ui';
import { getRequestsPerHourSeries } from '../../services/coordinationApi';

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CrisisCase[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<ResourceStock[]>([]);
  const [log, setLog] = useState<AIDecisionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });
  }, []);

  const metrics = useMemo(() => computeCaseMetrics(cases), [cases]);
  const override = useMemo(() => computeOverrideStats(log), [log]);

  const shelterCapacity = shelters.reduce((s, x) => s + x.capacity, 0);
  const shelterOccupied = shelters.reduce((s, x) => s + x.occupied, 0);
  const shelterPct = shelterCapacity ? (shelterOccupied / shelterCapacity) * 100 : 0;

  const resTotal = resources.reduce((s, x) => s + x.allocated / Math.max(1, x.total), 0);
  const resourcePct = resources.length ? (resTotal / resources.length) * 100 : 0;

  const urgencyData = URGENCY_ORDER.map((u) => ({
    label: u,
    value: cases.filter((c) => isActive(c) && c.urgency === u).length,
    color: URGENCY_COLOR[u]
  }));

  const hourly = useMemo(() => getRequestsPerHourSeries(), []);

  const shortages = resources
    .map((r) => ({ ...r, gap: r.demand - r.total, coverage: r.total / Math.max(1, r.demand) }))
    .sort((a, b) => a.coverage - b.coverage);

  const topPriority = [...cases]
    .filter(isActive)
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 5);

  if (loading) {
    return <div className="co-page"><EmptyState title="Loading coordinator dashboard..." /></div>;
  }

  return (
    <div className="co-page">
      <PageHeader
        badges={
          <>
            <span className="badge badge-amber"><Radio size={13} /> Crisis Command</span>
            <span className="badge badge-green"><ShieldCheck size={13} /> Coordinator Access</span>
          </>
        }
        title="Coordinator Dashboard"
        subtitle={`Welcome back, ${user?.fullName || 'Coordinator'}. Live overview of open cases, capacity, resources and AI oversight across active crisis events.`}
        actions={
          <button className="co-btn co-btn-blue" onClick={() => navigate('/coordination/cases')}>
            <ClipboardList size={16} /> Open Case Queue
          </button>
        }
      />

      {/* 7 KPIs */}
      <div className="co-grid co-grid-kpi">
        <KpiCard label="Open cases" value={metrics.open} hint={`${metrics.overdue} overdue`} icon={<FolderOpen size={20} />} tone="blue" />
        <KpiCard label="Escalated" value={metrics.escalated} hint="Awaiting partner action" icon={<ArrowUpRight size={20} />} tone="red" />
        <KpiCard label="Unresolved" value={metrics.unresolved} hint="Blocked or no resource" icon={<HelpCircle size={20} />} tone="amber" />
        <KpiCard label="Avg response" value={`${Math.round(metrics.avgResponse)} min`} hint="Time to first action" icon={<Timer size={20} />} tone="navy" />
        <KpiCard label="Shelter occupancy" value={`${Math.round(shelterPct)}%`} hint={`${shelterOccupied} / ${shelterCapacity} beds`} icon={<Home size={20} />} tone={shelterPct > 90 ? 'red' : 'green'} />
        <KpiCard label="Resource utilisation" value={`${Math.round(resourcePct)}%`} hint="Allocated vs total stock" icon={<Package size={20} />} tone="green" />
        <KpiCard label="AI override rate" value={`${override.rate.toFixed(1)}%`} hint={`${override.overridden + override.rejected} of ${override.total} decisions`} icon={<BrainCircuit size={20} />} tone={override.rate > 30 ? 'amber' : 'blue'} />
      </div>

      {/* Charts */}
      <div className="co-grid co-grid-2 co-mb">
        <Panel title="Active cases by urgency" subtitle="Cases not yet resolved">
          <BarChart data={urgencyData} />
        </Panel>
        <Panel title="Requests per hour" subtitle="Incoming help requests, last 24 hours">
          <LineChart
            labels={hourly.map((h) => h.label)}
            series={[{ name: 'Requests', color: '#0866C6', values: hourly.map((h) => h.value), area: true }]}
            labelEvery={3}
          />
        </Panel>
      </div>

      {/* Shortages + priority queue */}
      <div className="co-grid co-grid-main">
        <Panel
          title="Top 5 priority queue"
          subtitle="Ranked by urgency, escalation, SLA breach and people affected"
          action={<button className="co-btn co-btn-ghost co-btn-sm" onClick={() => navigate('/coordination/cases')}>View all</button>}
        >
          {topPriority.length === 0 ? (
            <EmptyState title="No active cases" message="All cases are resolved." />
          ) : (
            topPriority.map((c, i) => (
              <div key={c.id} className="co-priority-item" onClick={() => navigate(`/coordination/cases/${c.id}`)}>
                <div className="co-rank">{i + 1}</div>
                <div className="co-priority-main">
                  <div className="co-priority-title">
                    <span className="co-ref">{c.ref}</span> &nbsp;{c.title}
                  </div>
                  <div className="co-priority-meta">
                    {c.location} · {c.peopleAffected} affected ·{' '}
                    <span className={isOverdue(c) ? 'co-overdue' : 'co-ontime'}>{slaLabel(c)}</span>
                  </div>
                </div>
                <UrgencyBadge urgency={c.urgency} />
                <StatusBadge status={c.status} />
              </div>
            ))
          )}
        </Panel>

        <Panel
          title="Shortage panel"
          subtitle="Stock coverage against current demand"
          action={<AlertTriangle size={18} color="#E0930A" />}
        >
          {shortages.map((r) => {
            const pct = Math.min(100, Math.round(r.coverage * 100));
            const tone = r.coverage < 0.8 ? 'red' : r.coverage < 1 ? 'amber' : 'green';
            return (
              <div key={r.id} className="co-shortage">
                <div className="co-shortage-head">
                  <span>{r.name}</span>
                  <span className={r.gap > 0 ? 'co-overdue' : 'co-muted'}>
                    {r.gap > 0 ? `Short ${r.gap.toLocaleString()} ${r.unit}` : 'Covered'}
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className={`progress-bar-fill co-bar-fill-${tone}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
