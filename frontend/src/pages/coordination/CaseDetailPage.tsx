import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  ArrowUpRight,
  HelpCircle,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Copy,
  Paperclip,
  Image as ImageIcon,
  Mic,
  FileText,
  MapPin,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coordinationApi, formatDateTime, isOverdue, slaLabel } from '../../services/coordinationApi';
import {
  AIReviewItem,
  CaseEvidence,
  CrisisCase,
  ALLOWED_STATUS_TRANSITIONS,
  CoreCaseStatus,
  isNoteRequiredForStatus
} from '../../types/coordination';
import {
  ConfidenceBar,
  EmptyState,
  FallbackBadge,
  Field,
  Modal,
  PageHeader,
  Panel,
  StatusBadge,
  UrgencyBadge,
  useToast
} from '../../components/coordination/ui';
import { AiRecommendationCard } from '../../components/ai/AiRecommendationCard';
import { AlertTriangle } from 'lucide-react';

const STAFF = ['Chaminda Silva', 'Nadeesha Perera', 'Kasun Jayawardena'];

type ActionKind = 'assign' | 'escalate' | 'unresolved' | 'resolve' | 'reopen' | 'note';

const ACTION_COPY: Record<ActionKind, { title: string; sub: string; confirm: string; needsNote: boolean }> = {
  assign: { title: 'Assign case', sub: 'Choose who is responsible for the response.', confirm: 'Assign', needsNote: false },
  escalate: { title: 'Escalate case', sub: 'Explain why this needs higher-level or partner support.', confirm: 'Escalate', needsNote: true },
  unresolved: { title: 'Mark as unresolved', sub: 'Record what is blocking a resolution.', confirm: 'Mark unresolved', needsNote: true },
  resolve: { title: 'Resolve case', sub: 'Summarise how the need was met.', confirm: 'Resolve', needsNote: true },
  reopen: { title: 'Reopen case', sub: 'Say why the case needs more work.', confirm: 'Reopen', needsNote: true },
  note: { title: 'Add note', sub: 'Notes appear on the case timeline.', confirm: 'Add note', needsNote: true }
};

const evidenceIcon = (type: CaseEvidence['type']) => {
  switch (type) {
    case 'Photo': return <ImageIcon size={17} />;
    case 'Voice Note': return <Mic size={17} />;
    case 'Location Pin': return <MapPin size={17} />;
    default: return <FileText size={17} />;
  }
};

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const actor = user?.fullName || 'Coordinator';

  const [item, setItem] = useState<CrisisCase | null>(null);
  const [original, setOriginal] = useState<CrisisCase | null>(null);
  const [review, setReview] = useState<AIReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionKind | null>(null);
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState(STAFF[0]);
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();

  const isOffline = coordinationApi.isOffline();
  const [statusModal, setStatusModal] = useState<{ targetStatus: CoreCaseStatus } | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState('');

  const load = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoadError(null);
      const c = await coordinationApi.getCase(caseId);
      setItem(c);
      if (c?.duplicateOfId) {
        setOriginal(await coordinationApi.getCase(c.duplicateOfId));
      } else {
        setOriginal(null);
      }
      const reviews = await coordinationApi.getAIReviews();
      setReview(reviews.find((r) => r.caseId === caseId && r.status === 'Pending') || null);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitStatusChange = async () => {
    if (!item || !statusModal) return;
    const noteRequired = isNoteRequiredForStatus(statusModal.targetStatus);
    if (noteRequired && !statusNote.trim()) {
      setStatusError(`A note is required when transitioning to ${statusModal.targetStatus}.`);
      return;
    }
    try {
      setStatusError('');
      await coordinationApi.updateRequestStatus(item.id, statusModal.targetStatus, statusNote.trim());
      setStatusModal(null);
      setStatusNote('');
      await load();
      showToast(`Status updated to ${statusModal.targetStatus}`);
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update status');
    }
  };

  const openAction = (kind: ActionKind) => {
    setAction(kind);
    setNote('');
    setError('');
    if (item?.assignedTo && STAFF.includes(item.assignedTo)) setAssignee(item.assignedTo);
  };

  const submitAction = async () => {
    if (!item || !action) return;
    if (ACTION_COPY[action].needsNote && !note.trim()) {
      setError('A note is required for this action.');
      return;
    }
    switch (action) {
      case 'assign': await coordinationApi.assignCase(item.id, assignee, actor); break;
      case 'escalate': await coordinationApi.escalateCase(item.id, actor, note.trim()); break;
      case 'unresolved': await coordinationApi.markUnresolved(item.id, actor, note.trim()); break;
      case 'resolve': await coordinationApi.resolveCase(item.id, actor, note.trim()); break;
      case 'reopen': await coordinationApi.reopenCase(item.id, actor, note.trim()); break;
      case 'note': await coordinationApi.addCaseNote(item.id, actor, note.trim()); break;
    }
    setAction(null);
    await load();
    showToast(`${ACTION_COPY[action].title} - saved to timeline`);
  };

  const handleDuplicate = async (kind: 'merge' | 'dismiss') => {
    if (!item) return;
    if (kind === 'merge') await coordinationApi.mergeDuplicate(item.id, actor);
    else await coordinationApi.dismissDuplicate(item.id, actor);
    await load();
    showToast(kind === 'merge' ? 'Case merged into original' : 'Duplicate flag dismissed');
  };

  if (loading) return <div className="co-page"><EmptyState title="Loading case..." /></div>;
  if (loadError) {
    const isAuth = loadError.toLowerCase().includes('log in') || loadError.toLowerCase().includes('authentication') || loadError.includes('401');
    return (
      <div className="co-page">
        <Panel>
          <EmptyState title="Could not load case" message={loadError} />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            {isAuth ? (
              <button className="co-btn co-btn-blue" onClick={() => navigate('/login')}>Go to Login</button>
            ) : (
              <button className="co-btn co-btn-blue" onClick={load}>Try again</button>
            )}
          </div>
        </Panel>
      </div>
    );
  }
  if (!item) {
    return (
      <div className="co-page">
        <Panel>
          <EmptyState title="Case not found" message="It may have been removed." />
          <div style={{ textAlign: 'center' }}>
            <button className="co-btn co-btn-blue" onClick={() => navigate('/coordination/cases')}>Back to Case Queue</button>
          </div>
        </Panel>
      </div>
    );
  }

  const resolved = item.status === 'Resolved';
  const allowedNextStatuses = (ALLOWED_STATUS_TRANSITIONS[item.status] || []) as CoreCaseStatus[];

  return (
    <div className="co-page">
      <button className="co-btn co-btn-ghost co-btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/coordination/cases')}>
        <ArrowLeft size={14} /> Back to Case Queue
      </button>

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
        badges={
          <>
            <span className="badge badge-navy">{item.ref}</span>
            <UrgencyBadge urgency={item.urgency} />
            <StatusBadge status={item.status} />
            {isOverdue(item) && <span className="badge badge-red">SLA breached</span>}
          </>
        }
        title={item.title}
        subtitle={`${item.needType} need · ${item.location}, ${item.district} · reported ${formatDateTime(item.createdAt)}`}
      />

      {/* Action buttons */}
      <div className="card co-mb" style={{ padding: '16px 20px' }}>
        <div className="co-actions">
          {!isOffline ? (
            /* Connected to Core API: Show only real status change control */
            allowedNextStatuses.length > 0 ? (
              allowedNextStatuses.map((st) => (
                <button
                  key={st}
                  className={`co-btn ${st === 'Rejected' ? 'co-btn-red' : 'co-btn-blue'}`}
                  onClick={() => {
                    setStatusModal({ targetStatus: st });
                    setStatusNote('');
                    setStatusError('');
                  }}
                >
                  Change Status: {st}
                </button>
              ))
            ) : (
              <span className="badge badge-navy">Terminal Status: {item.status}</span>
            )
          ) : (
            /* Offline demo mode: keep existing mock actions */
            <>
              {!resolved && (
                <button className="co-btn co-btn-blue" onClick={() => openAction('assign')}>
                  <UserCheck size={16} /> {item.assignedTo ? 'Reassign' : 'Assign'}
                </button>
              )}
              {!resolved && item.status !== 'Escalated' && (
                <button className="co-btn co-btn-red" onClick={() => openAction('escalate')}>
                  <ArrowUpRight size={16} /> Escalate
                </button>
              )}
              {!resolved && item.status !== 'Unresolved' && (
                <button className="co-btn co-btn-amber" onClick={() => openAction('unresolved')}>
                  <HelpCircle size={16} /> Mark unresolved
                </button>
              )}
              {!resolved && (
                <button className="co-btn co-btn-green" onClick={() => openAction('resolve')}>
                  <CheckCircle2 size={16} /> Resolve
                </button>
              )}
              {resolved && (
                <button className="co-btn co-btn-ghost" onClick={() => openAction('reopen')}>
                  <RotateCcw size={16} /> Reopen
                </button>
              )}
              <button className="co-btn co-btn-ghost" onClick={() => openAction('note')}>
                <MessageSquare size={16} /> Add note
              </button>
            </>
          )}
        </div>
      </div>

      {/* Duplicate notice */}
      {item.duplicateOfId && (
        <div className="co-notice co-notice-amber">
          <Copy size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <strong>Possible duplicate detected.</strong> This case looks similar to{' '}
            {original ? (
              <a href={`/coordination/cases/${original.id}`} onClick={(e) => { e.preventDefault(); navigate(`/coordination/cases/${original.id}`); }}>
                {original.ref} - {original.title}
              </a>
            ) : (
              'an existing case'
            )}
            . Same location and description were matched by the AI.
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="co-btn co-btn-amber co-btn-sm" onClick={() => handleDuplicate('merge')}>Merge into original</button>
              <button className="co-btn co-btn-ghost co-btn-sm" onClick={() => handleDuplicate('dismiss')}>Not a duplicate</button>
            </div>
          </div>
        </div>
      )}

      <div className="co-grid co-grid-main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel title="Case information">
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>{item.description}</p>
            <div className="co-info-grid">
              <div><div className="co-info-label">Reporter</div><div className="co-info-value">{item.reporter}</div></div>
              <div><div className="co-info-label">Contact</div><div className="co-info-value">{item.contact}</div></div>
              <div><div className="co-info-label">People affected</div><div className="co-info-value">{item.peopleAffected}</div></div>
              <div><div className="co-info-label">Assigned to</div><div className="co-info-value">{item.assignedTo || 'Unassigned'}</div></div>
              <div><div className="co-info-label">Response SLA</div><div className={`co-info-value ${isOverdue(item) ? 'co-overdue' : ''}`}>{slaLabel(item)}</div></div>
              <div><div className="co-info-label">First response</div><div className="co-info-value">{item.firstResponseMinutes !== null ? `${item.firstResponseMinutes} min` : 'Not yet'}</div></div>
            </div>
          </Panel>

          <Panel title="Evidence" subtitle={`${item.evidence.length} attachment${item.evidence.length === 1 ? '' : 's'}`} action={<Paperclip size={17} color="#526784" />}>
            {item.evidence.length === 0 ? (
              <EmptyState title="No evidence attached" message="The reporter did not upload photos or documents." />
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {item.evidence.map((e) => (
                  <div key={e.id} className="co-evidence">
                    <div className="co-evidence-icon">{evidenceIcon(e.type)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{e.label}</div>
                      <div className="co-small co-muted">{e.type} · added {formatDateTime(e.addedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Timeline" subtitle="Every action on this case is recorded">
            <div className="co-timeline">
              {[...item.timeline].reverse().map((t) => (
                <div key={t.id} className={`co-timeline-item ${t.actor === 'AI Triage' ? 'ai' : ''}`}>
                  <span className="co-timeline-dot" />
                  <div className="co-timeline-action">{t.action}</div>
                  <div className="co-timeline-meta">{t.actor} · {formatDateTime(t.at)}</div>
                  {t.note && <div className="co-timeline-note">{t.note}</div>}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Member 4: AI Recommendation Cards & Human-in-the-Loop Governance */}
        <div>
          <AiRecommendationCard
            caseItem={item}
            reviewerEmail={user?.email || 'coordinator@resqnet.org'}
            onAiCaseLinked={(caseNum) => {
              setItem((prev) => (prev ? { ...prev, aiCaseNumber: caseNum } : prev));
            }}
            onDecisionMade={(actionName) => {
              load();
              showToast(`${item.ref}: ${actionName} - recorded in audit log`);
            }}
          />
        </div>
      </div>

      {statusModal && (
        <Modal
          title={`Update Status to ${statusModal.targetStatus}`}
          subtitle={`${item.ref} - ${isNoteRequiredForStatus(statusModal.targetStatus) ? 'A note is required for this transition' : 'Optional note for status change audit trail'}`}
          onClose={() => setStatusModal(null)}
          footer={
            <>
              <button className="co-btn co-btn-ghost" onClick={() => setStatusModal(null)}>Cancel</button>
              <button className="co-btn co-btn-blue" onClick={submitStatusChange}>Confirm Status Change</button>
            </>
          }
        >
          <Field label={isNoteRequiredForStatus(statusModal.targetStatus) ? 'Note (Required)' : 'Note (Optional)'}>
            <textarea
              rows={4}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Explain the reason for this transition..."
            />
          </Field>
          {statusError && <div className="co-error">{statusError}</div>}
        </Modal>
      )}

      {action && (
        <Modal
          title={ACTION_COPY[action].title}
          subtitle={`${item.ref} - ${ACTION_COPY[action].sub}`}
          onClose={() => setAction(null)}
          footer={
            <>
              <button className="co-btn co-btn-ghost" onClick={() => setAction(null)}>Cancel</button>
              <button className="co-btn co-btn-blue" onClick={submitAction}>{ACTION_COPY[action].confirm}</button>
            </>
          }
        >
          {action === 'assign' ? (
            <Field label="Assign to">
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {STAFF.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </Field>
          ) : (
            <Field label="Note">
              <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a short note for the audit trail..." />
            </Field>
          )}
          {error && <div className="co-error">{error}</div>}
        </Modal>
      )}
      {toast}
    </div>
  );
};

export default CaseDetailPage;
