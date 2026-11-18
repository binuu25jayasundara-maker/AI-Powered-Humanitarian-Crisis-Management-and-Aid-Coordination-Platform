import React, { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit,
  Check,
  Edit,
  X,
  MoreHorizontal,
  AlertTriangle,
  Copy,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { aiApi } from '../../services/aiApi';
import { coordinationApi } from '../../services/coordinationApi';
import { AiRecommendation, CaseReview } from '../../types/ai';
import { CrisisCase } from '../../types/coordination';

interface AiRecommendationCardProps {
  caseItem: CrisisCase;
  onDecisionMade?: (action: string, note: string) => void;
  onAiCaseLinked?: (aiCaseNumber: string) => void;
  reviewerEmail?: string;
}

const CORE_TO_M4_CATEGORY: Record<string, string> = {
  'Food & Water': 'Food & Water',
  'Shelter': 'Shelter',
  'Medical': 'Emergency Medical',
  'Rescue / Evacuation': 'Search & Rescue',
  'Other': 'Disaster Relief'
};

export const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({
  caseItem,
  onDecisionMade,
  onAiCaseLinked,
  reviewerEmail = 'coordinator@resqnet.org'
}) => {
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [activeCaseNumber, setActiveCaseNumber] = useState<string | null>(caseItem.aiCaseNumber || null);
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [caseReviewData, setCaseReviewData] = useState<CaseReview | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);

  // Modal states
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Form states
  const [modCategory, setModCategory] = useState('Disaster Relief');
  const [modUrgency, setModUrgency] = useState('High - immediate assistance needed.');
  const [modJustification, setModJustification] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Update activeCaseNumber if caseItem changes
  useEffect(() => {
    if (caseItem.aiCaseNumber) {
      setActiveCaseNumber(caseItem.aiCaseNumber);
    }
  }, [caseItem.aiCaseNumber]);

  // Load existing recommendation if aiCaseNumber is present
  const loadExistingCase = useCallback(async (caseNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const review = await aiApi.getCaseLive(caseNumber);
      setCaseReviewData(review);
      if (review.recommendation) {
        setRecommendation(review.recommendation);
        setModCategory(review.recommendation.category);
        setModUrgency(review.recommendation.urgency);
      }
      setIsDemoData(false);
    } catch (err: any) {
      setError(err.message || 'AI API unreachable. Could not load recommendation.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeCaseNumber) {
      loadExistingCase(activeCaseNumber);
    } else {
      setRecommendation(null);
      setCaseReviewData(null);
    }
  }, [activeCaseNumber, loadExistingCase]);

  // Handler: "Get AI recommendation"
  const handleGetAiRecommendation = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLinkError(null);
    setDecisionError(null);

    // Map Category (Core -> Member4)
    const rawCategory = caseItem.category || (caseItem.needType === 'Rescue' ? 'Rescue / Evacuation' : caseItem.needType);
    const m4Category = CORE_TO_M4_CATEGORY[rawCategory] || 'Disaster Relief';

    // Description (must be 10-1000 characters)
    let desc = caseItem.description?.trim() || '';
    if (desc.length < 10) {
      desc = `${caseItem.title || 'Assistance request'}: emergency assistance needed at location.`;
    }
    if (desc.length > 1000) {
      desc = desc.substring(0, 1000);
    }

    // Location (send only description and location)
    const loc = caseItem.location?.trim() || caseItem.district?.trim() || 'Central Province';

    try {
      const created = await aiApi.createCase(desc, loc, m4Category);
      const caseNum = created.caseNumber;
      setActiveCaseNumber(caseNum);
      setRecommendation(created.recommendation);
      setModCategory(created.recommendation.category);
      setModUrgency(created.recommendation.urgency);
      setIsDemoData(false);

      // Link IMMEDIATELY to Core request
      try {
        await coordinationApi.linkAiCase(caseItem.id, caseNum);
        onAiCaseLinked?.(caseNum);
      } catch (lErr: any) {
        setLinkError(lErr.message || 'Failed to link AI case to assistance request. You can retry linking below.');
      }

      // Fetch full case review to get possible-duplicate info
      try {
        const fullReview = await aiApi.getCaseLive(caseNum);
        setCaseReviewData(fullReview);
        if (fullReview.recommendation) {
          setRecommendation(fullReview.recommendation);
        }
      } catch {
        // Created recommendation already set from createCase response
      }
    } catch (err: any) {
      setError(err.message || 'AI service unreachable. Please ensure Member4 API is running at http://localhost:5157.');
    } finally {
      setLoading(false);
    }
  };

  // Retry linking without creating a new case
  const handleRetryLink = async (caseNum: string) => {
    setLinking(true);
    setLinkError(null);
    try {
      await coordinationApi.linkAiCase(caseItem.id, caseNum);
      onAiCaseLinked?.(caseNum);
      setActionSuccess(`Successfully linked AI Case ${caseNum} to request.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setLinkError(err.message || 'Retry failed. Ensure Core API is reachable.');
    } finally {
      setLinking(false);
    }
  };

  // Offline demo fallback
  const handleLoadDemoData = () => {
    setIsDemoData(true);
    setError(null);
    setRecommendation({
      id: 'rec-demo-2341',
      category: 'Disaster Relief',
      urgency: 'High - immediate assistance needed.',
      view: 'Provide shelter, food supplies, medical aid.',
      suggest: 'Coordinate with local authorities and NGOs.',
      priorityScore: 88,
      confidence: 0.94,
      rationale: 'Simulated heuristic demo data. Member4 API was offline when request was evaluated.',
      providerStrategy: 'RuleBasedStrategy (Deterministic Fallback)',
      fallback: true
    });
    setCaseReviewData({
      id: 'demo-2341',
      caseNumber: '#2341',
      title: 'Flood, Kandyyva (Demo)',
      location: caseItem.location,
      requestDetails: caseItem.description,
      evidence: '',
      status: 'Assessed - awaiting approval',
      assignedAgency: 'DMC-LK',
      possibleDuplicate: '#2187 - Flood (Kandy)',
      duplicateRiskLevel: 'Medium'
    });
  };

  // Submit human decisions
  const handleApprove = async () => {
    const targetCaseNum = activeCaseNumber || '#2341';
    setDecisionError(null);
    try {
      await aiApi.submitHumanDecision(
        targetCaseNum,
        'Approve',
        'Approved without modifications by Authorized Coordinator.',
        undefined,
        undefined,
        reviewerEmail
      );
      setActionSuccess(`AI Recommendation APPROVED for ${targetCaseNum}. Recorded in audit log.`);
      onDecisionMade?.('Approved', 'Approved AI recommendation without modification');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setDecisionError(err.message || 'Failed to submit decision.');
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modJustification.trim()) {
      alert('A justification note is required for human overrides.');
      return;
    }
    const targetCaseNum = activeCaseNumber || '#2341';
    setDecisionError(null);
    try {
      await aiApi.submitHumanDecision(
        targetCaseNum,
        'Modify',
        modJustification.trim(),
        modCategory,
        modUrgency,
        reviewerEmail
      );
      setShowModifyModal(false);
      if (recommendation) {
        setRecommendation({
          ...recommendation,
          category: modCategory,
          urgency: modUrgency
        });
      }
      setActionSuccess(`AI Recommendation MODIFIED and APPROVED for ${targetCaseNum}.`);
      onDecisionMade?.('Modified & Approved', `Modified category to ${modCategory}, urgency to ${modUrgency}. Justification: ${modJustification}`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setDecisionError(err.message || 'Failed to submit modification.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('An explanation is required to reject an AI recommendation.');
      return;
    }
    const targetCaseNum = activeCaseNumber || '#2341';
    setDecisionError(null);
    try {
      await aiApi.submitHumanDecision(
        targetCaseNum,
        'Reject',
        rejectReason.trim(),
        undefined,
        undefined,
        reviewerEmail
      );
      setShowRejectModal(false);
      setActionSuccess(`AI Recommendation REJECTED for ${targetCaseNum}. Recorded in audit log.`);
      onDecisionMade?.('Rejected', `Rejected recommendation. Reason: ${rejectReason}`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setDecisionError(err.message || 'Failed to reject recommendation.');
    }
  };

  const handleDefer = async () => {
    const targetCaseNum = activeCaseNumber || '#2341';
    setDecisionError(null);
    setShowMoreMenu(false);
    try {
      await aiApi.submitHumanDecision(
        targetCaseNum,
        'Defer',
        'Deferred for ground-truth verification by local Grama Niladhari.',
        undefined,
        undefined,
        reviewerEmail
      );
      setActionSuccess(`Case ${targetCaseNum} DEFERRED for ground-truth investigation.`);
      onDecisionMade?.('Deferred', 'Deferred for ground-truth verification by local Grama Niladhari');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setDecisionError(err.message || 'Failed to defer case.');
    }
  };

  // 1. Loading state (initial load of linked case)
  if (loading && !recommendation) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite', marginBottom: '12px' }}>
          <BrainCircuit size={28} color="#2563eb" />
        </div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
          AI Gateway evaluating case attributes...
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          Analyzing location, priority risk factors, and disaster classification signals.
        </div>
      </div>
    );
  }

  // 2. Idle State: no AI case has been created or loaded yet
  if (!activeCaseNumber && !recommendation) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '26px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '14px'
        }}
      >
        <div style={{ backgroundColor: '#f0fdf4', borderRadius: '50%', padding: '14px', display: 'grid', placeItems: 'center' }}>
          <BrainCircuit size={32} color="#16a34a" />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            AI Recommendation
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '320px', lineHeight: 1.5 }}>
            Request category triage, urgency assessment, priority score, and semantic duplicate check from Member4 AI Gateway.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#b91c1c', fontSize: '12.5px', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>AI Service Notice:</div>
            <div>{error}</div>
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <button
                className="co-btn co-btn-ghost co-btn-sm"
                onClick={handleLoadDemoData}
                style={{ fontSize: '11px', textDecoration: 'underline' }}
              >
                View demo data fallback (clearly labelled)
              </button>
            </div>
          </div>
        )}

        <button
          className="co-btn co-btn-blue"
          onClick={handleGetAiRecommendation}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                <RefreshCw size={16} />
              </div>
              Calling AI Gateway...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Get AI recommendation
            </>
          )}
        </button>

        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          AI recommendations are advisory and never alter case status automatically.
        </div>
      </div>
    );
  }

  // 3. Error state if linked case failed to load
  if (error && !recommendation) {
    return (
      <div className="card" style={{ padding: '24px', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 800 }}>
          <AlertTriangle size={20} />
          <span>AI Service Unavailable</span>
        </div>
        <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '8px 0 16px' }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="co-btn co-btn-blue co-btn-sm"
            onClick={() => activeCaseNumber && loadExistingCase(activeCaseNumber)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Retry AI Connection
          </button>
          <button
            className="co-btn co-btn-ghost co-btn-sm"
            onClick={handleLoadDemoData}
          >
            Show demo data
          </button>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  const confidencePct = Math.round((recommendation.confidence || 0.94) * 100);
  const isRuleFallback = Boolean(
    recommendation.fallback ||
    recommendation.providerStrategy?.toLowerCase().includes('fallback') ||
    recommendation.providerStrategy?.toLowerCase().includes('rule')
  );
  const providerLabel = isRuleFallback ? 'rule-based (fallback)' : 'simulated';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Demo data badge */}
      {isDemoData && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#b45309',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertTriangle size={15} />
          <span>[DEMO DATA - AI API UNREACHABLE] Showing simulated reference recommendation</span>
        </div>
      )}

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.15)'
          }}
        >
          <CheckCircle2 size={18} /> {actionSuccess}
        </div>
      )}

      {/* Decision error banner */}
      {decisionError && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={18} /> {decisionError}
        </div>
      )}

      {/* Link error banner with retry option */}
      {linkError && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#92400e',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div>
            <strong>Link Warning:</strong> {linkError}
          </div>
          <button
            className="co-btn co-btn-ghost co-btn-sm"
            onClick={() => activeCaseNumber && handleRetryLink(activeCaseNumber)}
            disabled={linking}
            style={{ whiteSpace: 'nowrap' }}
          >
            {linking ? 'Linking...' : 'Retry Link'}
          </button>
        </div>
      )}

      {/* Fallback Notice Banner if active */}
      {isRuleFallback && !isDemoData && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: '#92400e'
          }}
        >
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <strong>Rule-Based Heuristic Fallback Active.</strong> NLP classification derived via local deterministic engine. Cloud LLM endpoint was unreachable or bypassed.
          </div>
        </div>
      )}

      {/* Main AI Recommendation Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '26px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BrainCircuit size={20} color="#12A86B" /> AI recommendation
            {activeCaseNumber && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                ({activeCaseNumber})
              </span>
            )}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: confidencePct >= 80 ? '#16a34a' : '#d97706',
                backgroundColor: confidencePct >= 80 ? '#dcfce7' : '#fef3c7',
                padding: '4px 10px',
                borderRadius: '999px'
              }}
            >
              Confidence: {confidencePct}%
            </span>
            {recommendation.priorityScore !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  padding: '4px 10px',
                  borderRadius: '999px'
                }}
              >
                Score: {recommendation.priorityScore}/100
              </span>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
            Category
          </div>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            {recommendation.category || 'Disaster Relief'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
            Urgency
          </div>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            {recommendation.urgency || 'High - immediate assistance needed.'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
            View
          </div>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
            {recommendation.view || 'Provide shelter, food supplies, medical aid.'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
            Suggest
          </div>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
            {recommendation.suggest || 'Coordinate with local authorities and NGOs.'}
          </div>
        </div>

        {/* Provider Strategy row */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
            Provider
          </div>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            <span style={{ fontWeight: 600 }}>{providerLabel}</span>
            {recommendation.providerStrategy && (
              <span style={{ color: '#64748b', marginLeft: '6px' }}>
                ({recommendation.providerStrategy})
              </span>
            )}
          </div>
        </div>

        {recommendation.rationale && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#64748b'
            }}
          >
            <strong style={{ color: '#334155' }}>Rationale:</strong> {recommendation.rationale}
          </div>
        )}

        {/* Action Buttons Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '8px',
            position: 'relative'
          }}
        >
          {/* Approve Button */}
          <button
            onClick={handleApprove}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(22, 163, 74, 0.25)'
            }}
          >
            <Check size={16} strokeWidth={2.5} /> Approve
          </button>

          {/* Modify Button */}
          <button
            onClick={() => setShowModifyModal(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Edit size={15} /> Modify
          </button>

          {/* Reject Button */}
          <button
            onClick={() => setShowRejectModal(true)}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(220, 38, 38, 0.25)'
            }}
          >
            <X size={16} strokeWidth={2.5} /> Reject
          </button>

          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(15, 23, 42, 0.25)'
            }}
          >
            <MoreHorizontal size={16} /> More
          </button>

          {/* More Dropdown */}
          {showMoreMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: '100%',
                marginBottom: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                padding: '6px 0',
                width: '240px',
                zIndex: 30
              }}
            >
              <button
                onClick={handleDefer}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 14px',
                  fontSize: '12.5px',
                  color: '#334155',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Clock size={14} color="#d97706" /> Defer for Ground Verification
              </button>
              {activeCaseNumber && (
                <button
                  onClick={() => loadExistingCase(activeCaseNumber)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 14px',
                    fontSize: '12.5px',
                    color: '#334155',
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={14} color="#2563eb" /> Reload Recommendation
                </button>
              )}
            </div>
          )}
        </div>

        {/* Short hint under the decision buttons */}
        <div
          style={{
            fontSize: '11.5px',
            color: '#64748b',
            textAlign: 'center',
            marginTop: '4px',
            lineHeight: 1.4,
            padding: '6px 10px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px'
          }}
        >
          Advisory only: recording a decision does not change the request's status; use the status buttons above to advance the case.
        </div>
      </div>

      {/* Duplicate detection card from real data if present */}
      {caseReviewData?.possibleDuplicate && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Copy size={15} color="#d97706" /> Duplicate Detection Analysis
            </div>
            <span
              style={{
                backgroundColor: '#fef3c7',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '999px'
              }}
            >
              {caseReviewData.duplicateRiskLevel || 'Medium'} Risk
            </span>
          </div>

          <div style={{ fontSize: '12.5px', color: '#475569' }}>
            Suspected Overlap: <strong style={{ color: '#2563eb' }}>{caseReviewData.possibleDuplicate}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            Semantic and geographical overlap identified by AI Gateway duplicate analysis against recorded cases.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> Flagged for Review (Non-destructive - original case intact)
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {showModifyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Modify AI Recommendation
              </h3>
              <button
                onClick={() => setShowModifyModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Adjusted Category
                </label>
                <select
                  value={modCategory}
                  onChange={(e) => setModCategory(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="Disaster Relief">Disaster Relief</option>
                  <option value="Emergency Medical">Emergency Medical</option>
                  <option value="Shelter">Shelter</option>
                  <option value="Food & Water">Food &amp; Water</option>
                  <option value="Search & Rescue">Search &amp; Rescue</option>
                  <option value="Medical & Evacuation">Medical &amp; Evacuation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Adjusted Urgency
                </label>
                <select
                  value={modUrgency}
                  onChange={(e) => setModUrgency(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="Critical - life-safety intervention required">Critical - life-safety intervention required</option>
                  <option value="High - immediate assistance needed.">High - immediate assistance needed.</option>
                  <option value="Medium - dispatch within standard SLA">Medium - dispatch within standard SLA</option>
                  <option value="Low - advisory or ground monitoring">Low - advisory or ground monitoring</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Coordinator Justification Note (Required for Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={modJustification}
                  onChange={(e) => setModJustification(e.target.value)}
                  placeholder="Explain why category/urgency was modified by human review..."
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="co-btn co-btn-ghost"
                  onClick={() => setShowModifyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="co-btn co-btn-blue"
                  disabled={!modJustification.trim()}
                >
                  Save &amp; Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
                Reject AI Recommendation
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                Human rejection preserves this case in the audit trail without triggering automated agency dispatch.
              </p>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Formal Override Reason (Required)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State ground-truth rationale for rejecting this recommendation..."
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="co-btn co-btn-ghost"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="co-btn co-btn-red"
                  disabled={!rejectReason.trim()}
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
