import React, { useEffect, useMemo, useState } from 'react';
import { ScrollText, Search, Download } from 'lucide-react';
import { computeOverrideStats, coordinationApi, downloadCsv, formatDateTime } from '../../services/coordinationApi';
import { AIDecisionLogEntry, DecisionType } from '../../types/coordination';
import {
  ConfidenceBar,
  EmptyState,
  FallbackBadge,
  KpiCard,
  PageHeader,
  UrgencyBadge,
  useToast
} from '../../components/coordination/ui';

const decisionBadge = (d: DecisionType) =>
  d === 'Approved' ? 'badge-green' : d === 'Overridden' ? 'badge-amber' : 'badge-red';

export const AIDecisionLogPage: React.FC = () => {
  const [log, setLog] = useState<AIDecisionLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [decision, setDecision] = useState<'ALL' | DecisionType>('ALL');
  const [reviewer, setReviewer] = useState('ALL');
  const [fallbackOnly, setFallbackOnly] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    coordinationApi.getDecisionLog().then(setLog);
  }, []);

  const stats = useMemo(() => computeOverrideStats(log), [log]);
  const reviewers = useMemo(() => Array.from(new Set(log.map((l) => l.reviewer))).sort(), [log]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return log.filter(
      (l) =>
        (decision === 'ALL' || l.decision === decision) &&
        (reviewer === 'ALL' || l.reviewer === reviewer) &&
        (!fallbackOnly || l.fallback) &&
        (!q ||
          l.caseRef.toLowerCase().includes(q) ||
          l.aiRecommendation.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q))
    );
  }, [log, search, decision, reviewer, fallbackOnly]);

  const exportCsv = () => {
    downloadCsv('ai-decision-log.csv', [
      ['Timestamp', 'Case', 'Reviewer', 'AI recommendation', 'AI urgency', 'Final urgency', 'Confidence (%)', 'Fallback', 'Decision', 'Reason', 'Model version'],
      ...filtered.map((l) => [
        new Date(l.at).toISOString(),
        l.caseRef,
        l.reviewer,
        l.aiRecommendation,
        l.aiUrgency,
        l.finalUrgency,
        Math.round(l.confidence * 100),
        l.fallback ? 'Yes' : 'No',
        l.decision,
        l.reason,
        l.modelVersion
      ])
    ]);
    showToast(`Exported ${filtered.length} log entries`);
  };

  return (
    <div className="co-page">
      <PageHeader
        badges={<span className="badge badge-green"><ScrollText size={13} /> Governance</span>}
        title="AI Decision Log"
        subtitle="Audit trail of every human decision on an AI recommendation, including overrides and fallback results."
        actions={
          <button className="co-btn co-btn-green" onClick={exportCsv}>
            <Download size={16} /> Export CSV
          </button>
        }
      />

      <div className="co-grid co-grid-kpi">
        <KpiCard label="Total decisions" value={stats.total} icon={<ScrollText size={20} />} tone="blue" />
        <KpiCard label="Approved" value={stats.approved} hint={stats.total ? `${((stats.approved / stats.total) * 100).toFixed(0)}% of decisions` : undefined} icon={<ScrollText size={20} />} tone="green" />
        <KpiCard label="Overridden" value={stats.overridden} icon={<ScrollText size={20} />} tone="amber" />
        <KpiCard label="Rejected" value={stats.rejected} icon={<ScrollText size={20} />} tone="red" />
        <KpiCard label="Override rate" value={`${stats.rate.toFixed(1)}%`} hint="Overridden + rejected" icon={<ScrollText size={20} />} tone="navy" />
        <KpiCard label="Fallback override rate" value={`${stats.fallbackRate.toFixed(1)}%`} hint={`${stats.fallbackTotal} fallback results`} icon={<ScrollText size={20} />} tone="amber" />
      </div>

      <div className="card co-filters">
        <div className="co-search">
          <Search size={17} color="#526784" />
          <input
            type="text"
            placeholder="Search by case, recommendation or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="co-select" value={decision} onChange={(e) => setDecision(e.target.value as 'ALL' | DecisionType)}>
          <option value="ALL">All decisions</option>
          <option value="Approved">Approved</option>
          <option value="Overridden">Overridden</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select className="co-select" value={reviewer} onChange={(e) => setReviewer(e.target.value)}>
          <option value="ALL">All reviewers</option>
          {reviewers.map((r) => (<option key={r} value={r}>{r}</option>))}
        </select>
        <label className="co-check">
          <input type="checkbox" checked={fallbackOnly} onChange={(e) => setFallbackOnly(e.target.checked)} />
          Fallback only
        </label>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="co-table-wrap">
          <table className="rq-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Case</th>
                <th>AI recommendation</th>
                <th>Urgency (AI → final)</th>
                <th style={{ minWidth: 130 }}>Confidence</th>
                <th>Decision</th>
                <th>Reviewer</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="co-muted co-small" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(l.at)}</td>
                  <td><span className="co-ref">{l.caseRef}</span></td>
                  <td style={{ maxWidth: 240 }}>
                    {l.aiRecommendation}
                    {l.fallback && <div style={{ marginTop: 4 }}><FallbackBadge /></div>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <UrgencyBadge urgency={l.aiUrgency} />
                    {l.aiUrgency !== l.finalUrgency && (
                      <>
                        <span className="co-muted"> → </span>
                        <UrgencyBadge urgency={l.finalUrgency} />
                      </>
                    )}
                  </td>
                  <td><ConfidenceBar value={l.confidence} /></td>
                  <td><span className={`badge ${decisionBadge(l.decision)}`}>{l.decision}</span></td>
                  <td className="co-small">{l.reviewer}</td>
                  <td className="co-small" style={{ maxWidth: 260 }}>{l.reason || <span className="co-muted">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState title="No log entries match" message="Adjust the filters to see more decisions." />}
      </div>
      {toast}
    </div>
  );
};

export default AIDecisionLogPage;
