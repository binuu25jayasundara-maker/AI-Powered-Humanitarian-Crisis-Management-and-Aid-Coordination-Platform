import React from 'react';
import { Copy, AlertTriangle, ShieldCheck, Check, Layers, ArrowRight, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DUPLICATE_SAMPLES } from '../services/duplicateSamples';

export const DuplicatesPage: React.FC = () => {
  const navigate = useNavigate();

  // Member 12356 coordination-system cases (CS- prefix, with router links)
  const coordinationDuplicates = [
    {
      primaryCase: 'CS-2341 - Flood, Kandyyva',
      suspected: '#2187 - Flood (Kandy)',
      similarity: '74%',
      risk: 'Medium',
      rationale: 'High semantic and geographical overlap with #2187. Both cases request food and shelter aid within Kandy flood operational sector.',
      status: 'Flagged for Review (Non-destructive - original case intact)',
      caseId: 'c-2341'
    },
    {
      primaryCase: 'CS-2348 - River Overbank, Rivagama',
      suspected: '#2344 - Rivagama Bridge Flooding',
      similarity: '88%',
      risk: 'High',
      rationale: 'Identical caller contact coordinates and duplicate meal requests submitted 14 minutes apart.',
      status: 'Awaiting Coordinator Merge or Dismissal',
      caseId: 'c-2344'
    }
  ];

  // Member 4 AI-engine duplicate records (from duplicateSamples — same underlying data,
  // sourced from Member 4's standalone detection engine)
  const duplicates = coordinationDuplicates;

  // Member 4 AI Engine records for the supplementary panel
  const m4Records = DUPLICATE_SAMPLES;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Copy size={14} /> Semantic Triage Engine
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Non-Destructive Overlap Analysis</span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px' }}>
          Duplicate &amp; Near-Duplicate Detection Engine
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          Non-destructive similarity analysis flagging duplicate requests without deleting genuine assistance calls.
        </p>
      </div>

      {/* Coordination System Duplicates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {duplicates.map((d, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr 1fr auto',
              gap: '20px',
              alignItems: 'center',
              padding: '22px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Target Request</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{d.primaryCase}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Suspected Overlap</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>{d.suspected}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{d.rationale}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${d.risk === 'High' ? 'badge-amber' : 'badge-blue'}`} style={{ marginBottom: '8px' }}>
                {d.similarity} Match ({d.risk} Risk)
              </span>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                <Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {d.status}
              </div>
            </div>

            <div>
              <button
                className="co-btn co-btn-blue co-btn-sm"
                onClick={() => navigate(`/coordination/cases/${d.caseId}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Review Case <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Member 4 AI Engine Detection Panel ──────────────────────── */}
      <div style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Cpu size={16} color="#38bdf8" />
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
            Member 4 AI Engine — RuleBasedStrategy Detections
          </span>
          <span style={{
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            border: '1px solid #1e293b'
          }}>
            HITL Oversight Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {m4Records.map((d, idx) => (
            <div
              key={`m4-${idx}`}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '18px 22px',
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.2fr 1fr',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Primary Case
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#e2e8f0', marginTop: '3px' }}>
                  {d.primaryCase}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Suspected Overlap
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', marginTop: '3px' }}>
                  {d.suspected}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                  {d.rationale}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: d.risk === 'High' ? '#fef3c7' : '#eff6ff',
                  color: d.risk === 'High' ? '#b45309' : '#2563eb',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  marginBottom: '8px'
                }}>
                  {d.similarity} Match — {d.risk} Risk
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e' }}>
                  ✓ {d.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DuplicatesPage;
