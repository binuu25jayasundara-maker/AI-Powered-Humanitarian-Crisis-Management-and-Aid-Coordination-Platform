/**
 * M4CaseReviewPage.tsx
 *
 * Member 4's standalone Case Review + AI Recommendation page.
 * Adapted from Member 4's CaseReviewPage.tsx for integration into
 * the Member 123456 merged project.
 *
 * Differences from Member 3's CaseDetailPage.tsx:
 * - Uses aiApi (Member 4's service layer) rather than coordinationApi
 * - Targets case #2341 (Kandyya flood demo scenario)
 * - Includes the inline AiAssistantSlideOver from the More dropdown
 * - Full Modify/Reject modals built directly into this page
 * - Does NOT require router params — acts as a self-contained demo view
 *
 * Access: /m4/case-review (EmergencyCoordinator, CaseManager, SystemAdmin)
 */

import React, { useState, useEffect } from 'react';
import { aiApi } from '../../services/aiApi';
import type { CaseReview } from '../../types/ai';
import {
  Check,
  Edit,
  X,
  MoreHorizontal,
  CheckCircle2,
  ShieldAlert,
  Bot,
  MapPin,
} from 'lucide-react';
import { AiAssistantSlideOver } from '../../components/ai/AiAssistantSlideOver';

export const M4CaseReviewPage: React.FC = () => {
  const [caseData, setCaseData] = useState<CaseReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modification form state
  const [modCategory, setModCategory] = useState('Disaster Relief');
  const [modUrgency, setModUrgency] = useState(
    'High - immediate assistance needed.'
  );
  const [modJustification, setModJustification] = useState('');

  useEffect(() => {
    loadCase();
  }, []);

  const loadCase = async () => {
    setLoading(true);
    const data = await aiApi.getCase('#2341');
    setCaseData(data);
    if (data.recommendation) {
      setModCategory(data.recommendation.category);
      setModUrgency(data.recommendation.urgency);
    }
    setLoading(false);
  };

  const notify = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4500);
  };

  const handleApprove = async () => {
    await aiApi.submitHumanDecision(
      '#2341',
      'Approve',
      'Approved without modifications by Authorized Coordinator.'
    );
    notify(
      'AI Recommendation APPROVED. Humanitarian case transitioned to dispatch queue.'
    );
    loadCase();
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await aiApi.submitHumanDecision(
      '#2341',
      'Modify',
      modJustification || 'Modified category/urgency by coordinator',
      modCategory,
      modUrgency
    );
    setShowModifyModal(false);
    notify('AI Recommendation MODIFIED and APPROVED. Audit record created.');
    loadCase();
  };

  const handleRejectSubmit = async () => {
    await aiApi.submitHumanDecision(
      '#2341',
      'Reject',
      'Rejected by authorized coordinator following duplicate verification.'
    );
    setShowRejectModal(false);
    notify('Case REJECTED by human decision. Preserved in audit trail.');
    loadCase();
  };

  const handleDefer = async () => {
    await aiApi.submitHumanDecision(
      '#2341',
      'Defer',
      'Deferred for ground-truth verification by local Grama Niladhari.'
    );
    setShowMoreMenu(false);
    notify('Case DEFERRED for ground-truth investigation.');
    loadCase();
  };

  if (loading)
    return (
      <div style={{ padding: '40px', color: '#64748b' }}>
        Loading case data...
      </div>
    );
  if (!caseData)
    return (
      <div style={{ padding: '40px', color: '#dc2626' }}>
        Failed to load case.
      </div>
    );

  return (
    <div style={{ position: 'relative' }}>
      {/* Page Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Case Review + AI Recommendation
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              marginTop: '4px',
            }}
          >
            Human-in-the-Loop decision interface for AI-assessed emergency cases.
          </p>
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--color-text-muted)',
          }}
        >
          Case:{' '}
          <span style={{ color: 'var(--color-blue-primary)' }}>
            {caseData.caseNumber}
          </span>
        </div>
      </div>

      {/* Action Success Banner */}
      {actionMessage && (
        <div
          style={{
            backgroundColor: 'var(--color-green-soft)',
            color: '#15803d',
            border: '1px solid #bbf7d0',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} /> {actionMessage}
        </div>
      )}

      {/* Main Split Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 1.15fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ── Left Card: Case Information ─────────────────────────────── */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '30px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              margin: 0,
            }}
          >
            Case {caseData.caseNumber} – {caseData.title}
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
            }}
          >
            <MapPin size={14} color="var(--color-blue-primary)" />
            {caseData.location}
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '4px',
              }}
            >
              Request
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              {caseData.requestDetails}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '4px',
              }}
            >
              Evidence
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              {caseData.evidence}
            </div>
          </div>

          {/* Possible Duplicate */}
          {caseData.possibleDuplicate && (
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--color-text-main)',
                  marginBottom: '6px',
                }}
              >
                Possible Duplicate
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#334155',
                    fontWeight: 600,
                  }}
                >
                  {caseData.possibleDuplicate}
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--color-amber-soft)',
                    color: 'var(--color-amber-dark)',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 14px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {caseData.duplicateRiskLevel || 'Medium'}
                </span>
              </div>
            </div>
          )}

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '4px',
              }}
            >
              Status
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: caseData.status === 'Approved' ? '#16a34a' : '#d97706',
              }}
            >
              {caseData.status}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '4px',
              }}
            >
              Assigned Agency
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              {caseData.assignedAgency}
            </div>
          </div>
        </div>

        {/* ── Right Card: AI Recommendation ───────────────────────────── */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '30px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                margin: 0,
              }}
            >
              AI Recommendation
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-blue-primary)',
                backgroundColor: 'var(--color-blue-soft)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Confidence:{' '}
              {Math.round(
                (caseData.recommendation?.confidence ?? 0.94) * 100
              )}
              %
            </span>
          </div>

          {/* Provider Strategy Badge */}
          {caseData.recommendation?.providerStrategy && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
              }}
            >
              Strategy: {caseData.recommendation.providerStrategy}
            </div>
          )}

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '3px',
              }}
            >
              Category
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              {caseData.recommendation?.category || 'Disaster Relief'}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '3px',
              }}
            >
              Urgency
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              {caseData.recommendation?.urgency ||
                'High - immediate assistance needed.'}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '3px',
              }}
            >
              View
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              {caseData.recommendation?.view ||
                'Provide shelter, food supplies, medical aid.'}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                marginBottom: '3px',
              }}
            >
              Suggested Action
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              {caseData.recommendation?.suggest ||
                'Coordinate with local authorities and NGOs.'}
            </div>
          </div>

          {/* Rationale */}
          {caseData.recommendation?.rationale && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              <strong
                style={{
                  display: 'block',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                  color: '#64748b',
                }}
              >
                AI Rationale
              </strong>
              {caseData.recommendation.rationale}
            </div>
          )}

          {/* ── HITL Action Buttons ──────────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '10px',
              position: 'relative',
            }}
          >
            {/* Approve */}
            <button
              onClick={handleApprove}
              style={{
                backgroundColor: 'var(--color-green-success)',
                color: '#ffffff',
                padding: '13px 18px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Check size={18} strokeWidth={2.5} /> Approve
            </button>

            {/* Modify */}
            <button
              onClick={() => setShowModifyModal(true)}
              style={{
                backgroundColor: 'var(--color-blue-primary)',
                color: '#ffffff',
                padding: '13px 18px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Edit size={16} /> Modify
            </button>

            {/* Reject */}
            <button
              onClick={() => setShowRejectModal(true)}
              style={{
                backgroundColor: 'var(--color-red-danger)',
                color: '#ffffff',
                padding: '13px 18px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 10px rgba(220, 38, 38, 0.25)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={18} strokeWidth={2.5} /> Reject
            </button>

            {/* More (Defer / Open AI Chat) */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              style={{
                backgroundColor: 'var(--color-navy)',
                color: '#ffffff',
                padding: '13px 18px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <MoreHorizontal size={18} /> More
            </button>

            {/* More dropdown */}
            {showMoreMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '100%',
                  marginBottom: '8px',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--color-border)',
                  padding: '8px 0',
                  width: '220px',
                  zIndex: 20,
                }}
              >
                <button
                  onClick={handleDefer}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    fontSize: '13px',
                    color: '#334155',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Defer for Local Verification
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setIsAssistantOpen(true);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    fontSize: '13px',
                    color: 'var(--color-blue-primary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Bot size={14} /> Open AI Chatbot Assistant
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Inline AI Assistant Slide-Over (from More menu) ─────────── */}
      <AiAssistantSlideOver
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        caseNumber={caseData.caseNumber}
      />

      {/* ── Modify Modal ─────────────────────────────────────────────── */}
      {showModifyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              width: '480px',
              maxWidth: '92vw',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 800,
                marginBottom: '16px',
                color: 'var(--color-text-main)',
              }}
            >
              Modify AI Recommendation (Human-in-the-Loop)
            </h3>
            <form
              onSubmit={handleModifySubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '4px',
                  }}
                >
                  Category
                </label>
                <select
                  value={modCategory}
                  onChange={(e) => setModCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option>Disaster Relief</option>
                  <option>Emergency Medical</option>
                  <option>Rescue / Evacuation</option>
                  <option>Food &amp; Water Relief</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '4px',
                  }}
                >
                  Urgency
                </label>
                <select
                  value={modUrgency}
                  onChange={(e) => setModUrgency(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option>High - immediate assistance needed.</option>
                  <option>Critical - Life Threatening</option>
                  <option>Medium - Assistance needed within 24 Hours</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '4px',
                  }}
                >
                  Coordinator Audit Justification
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why the AI recommendation was overridden..."
                  value={modJustification}
                  onChange={(e) => setModJustification(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModifyModal(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--color-blue-primary)',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save &amp; Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject Modal ─────────────────────────────────────────────── */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              width: '440px',
              maxWidth: '92vw',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--color-red-danger)',
                marginBottom: '14px',
              }}
            >
              <ShieldAlert size={24} />
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--color-text-main)',
                }}
              >
                Reject Case {caseData.caseNumber}?
              </h3>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}
            >
              Rejecting this case will log a formal coordinator override audit
              record and close the assistance ticket.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{
                  backgroundColor: 'var(--color-red-danger)',
                  color: '#ffffff',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
