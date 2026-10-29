import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Check, Pencil, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coordinationApi, LOW_CONFIDENCE_THRESHOLD, timeAgo, URGENCY_ORDER } from '../../services/coordinationApi';
import { AIReviewItem, DecisionType, Urgency } from '../../types/coordination';
import {
  ConfidenceBar,
  EmptyState,
  FallbackBadge,
  Field,
  KpiCard,
  Modal,
  PageHeader,
  UrgencyBadge,
  useToast
} from '../../components/coordination/ui';

type Dialog = { item: AIReviewItem; mode: 'Overridden' | 'Rejected' } | null;

export const AIReviewQueuePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reviewer = user?.fullName || 'Coordinator';
  const [items, setItems] = useState<AIReviewItem[]>([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [finalUrgency, setFinalUrgency] = useState<Urgency>('High');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();

  const load = async () => setItems(await coordinationApi.getAIReviews());

  useEffect(() => {
    load();
  }, []);

  const pending = items.filter((i) => i.status === 'Pending');
  const lowCount = pending.filter((i) => i.confidence < LOW_CONFIDENCE_THRESHOLD).length;
  const fallbackCount = pending.filter((i) => i.fallback).length;
  const visible = pending
    .filter((i) => !lowOnly || i.confidence < LOW_CONFIDENCE_THRESHOLD)
    .sort((a, b) => a.confidence - b.confidence);

  const approve = async (item: AIReviewItem) => {
    await coordinationApi.reviewAIRecommendation(item.id, 'Approved', reviewer, { reason: '' });
    await load();
    showToast(`${item.caseRef}: recommendation approved`);
  };

  const openDialog = (item: AIReviewItem, mode: 'Overridden' | 'Rejected') => {
    setDialog({ item, mode });
    setFinalUrgency(item.currentUrgency);
    setReason('');
    setError('');
  };

  const submitDialog = async () => {
    if (!dialog) return;
    if (!reason.trim()) {
      setError('A reason is required so the decision can be audited.');
      return;
    }
    const decision: DecisionType = dialog.mode;
    await coordinationApi.reviewAIRecommendation(dialog.item.id, decision, reviewer, {
      finalUrgency: decision === 'Overridden' ? finalUrgency : undefined,
      reason: reason.trim()
    });
    setDialog(null);
    await load();
    showToast(`${dialog.item.caseRef}: ${decision.toLowerCase()} and logged`);
  };

  return (
    <div className="co-page">
      <PageHeader
        badges={<span className="badge badge-green"><BrainCircuit size={13} /> Governance</span>}
        title="AI Review Queue"
        subtitle="AI recommendations wait here for human approval. Every decision is written to the AI Decision Log."
      />

      <div className="co-grid co-grid-kpi">
        <KpiCard label="Pending review" value={pending.length} icon={<BrainCircuit size={20} />} tone="blue" />
        <KpiCard label="Low confidence" value={lowCount} hint={`Below ${Math.round(LOW_CONFIDENCE_THRESHOLD * 100)}%`} icon={<BrainCircuit size={20} />} tone="amber" />
        <KpiCard label="Fallback results" value={fallbackCount} hint="Rule-based, not model" icon={<BrainCircuit size={20} />} tone="red" />
      </div>

      <div className="card co-filters">
        <label className="co-check">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Show low-confidence only (below {Math.round(LOW_CONFIDENCE_THRESHOLD * 100)}%)
        </label>
        <span className="co-muted co-small" style={{ marginLeft: 'auto' }}>
          Sorted by lowest confidence first
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            title={pending.length === 0 ? 'Review queue is clear' : 'No low-confidence items'}
            message={pending.length === 0 ? 'All AI recommendations have been reviewed.' : 'Turn off the filter to see all pending items.'}
          />
        </div>
      ) : (
        visible.map((item) => {
          const low = item.confidence < LOW_CONFIDENCE_THRESHOLD;
          return (
            <div key={item.id} className={`card co-review-card ${item.fallback ? 'fallback' : low ? 'low' : ''}`}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <span
                    className="co-ref"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/coordination/cases/${item.caseId}`)}
                  >
                    {item.caseRef}
                  </span>
                  <strong style={{ fontSize: 14 }}>{item.caseTitle}</strong>
                  {item.fallback && <FallbackBadge />}
                  {low && <span className="badge badge-amber">Low confidence</span>}
                </div>

                <div className="co-info-label">AI recommendation</div>
                <div className="co-info-value" style={{ marginBottom: 12 }}>{item.recommendation}</div>

                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div className="co-info-label">Urgency</div>
                    <div className="co-urgency-shift">
                      <UrgencyBadge urgency={item.currentUrgency} />
                      {item.currentUrgency !== item.suggestedUrgency && (
                        <>
                          <ArrowRight size={14} color="#526784" />
                          <UrgencyBadge urgency={item.suggestedUrgency} />
                        </>
                      )}
                      {item.currentUrgency === item.suggestedUrgency && <span className="co-small co-muted">no change</span>}
                    </div>
                  </div>
                  <div style={{ minWidth: 200 }}>
                    <div className="co-info-label">Confidence</div>
                    <ConfidenceBar value={item.confidence} />
                  </div>
                </div>

                <div className="co-info-label">Rationale</div>
                <ul className="co-ai-list">
                  {item.rationale.map((r) => (<li key={r}>{r}</li>))}
                </ul>
                <div className="co-small co-muted" style={{ marginTop: 10 }}>
                  {item.modelVersion} · generated {timeAgo(item.createdAt)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                <button className="co-btn co-btn-green" style={{ justifyContent: 'center' }} onClick={() => approve(item)}>
                  <Check size={15} /> Approve
                </button>
                <button className="co-btn co-btn-ghost" style={{ justifyContent: 'center' }} onClick={() => openDialog(item, 'Overridden')}>
                  <Pencil size={15} /> Override
                </button>
                <button className="co-btn co-btn-ghost" style={{ justifyContent: 'center', color: '#DC3545' }} onClick={() => openDialog(item, 'Rejected')}>
                  <X size={15} /> Reject
                </button>
              </div>
            </div>
          );
        })
      )}

      {dialog && (
        <Modal
          title={dialog.mode === 'Overridden' ? 'Override AI recommendation' : 'Reject AI recommendation'}
          subtitle={`${dialog.item.caseRef} - ${dialog.item.recommendation}`}
          onClose={() => setDialog(null)}
          footer={
            <>
              <button className="co-btn co-btn-ghost" onClick={() => setDialog(null)}>Cancel</button>
              <button className={`co-btn ${dialog.mode === 'Rejected' ? 'co-btn-red' : 'co-btn-blue'}`} onClick={submitDialog}>
                {dialog.mode === 'Overridden' ? 'Save override' : 'Reject'}
              </button>
            </>
          }
        >
          {dialog.mode === 'Overridden' && (
            <Field label="Final urgency" className="co-mb">
              <select value={finalUrgency} onChange={(e) => setFinalUrgency(e.target.value as Urgency)}>
                {URGENCY_ORDER.map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </Field>
          )}
          <Field label="Reason (required)">
            <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why the AI recommendation is not being followed..." />
          </Field>
          {error && <div className="co-error">{error}</div>}
        </Modal>
      )}
      {toast}
    </div>
  );
};

export default AIReviewQueuePage;
