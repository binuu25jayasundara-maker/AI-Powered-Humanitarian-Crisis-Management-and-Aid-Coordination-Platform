import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  MapPin,
  Clock,
  Shield,
  Layers,
  Database,
  Trash2,
  Filter,
  BarChart2,
  Cpu
} from 'lucide-react';
import { aiApi } from '../services/aiApi';
import { AiServiceFailure, AiServiceHealth, DemandForecast } from '../types/ai';

export const AiStatusPage: React.FC = () => {
  const [health, setHealth] = useState<AiServiceHealth | null>(null);
  const [failures, setFailures] = useState<AiServiceFailure[]>([]);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [selectedDisasterFilter, setSelectedDisasterFilter] = useState('All');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [healthData, forecastData] = await Promise.all([
        aiApi.checkHealth(),
        aiApi.getForecasts()
      ]);
      setHealth(healthData);
      setForecasts(forecastData);
      setFailures(aiApi.getFailures());
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticPing = async () => {
    setPinging(true);
    try {
      const updated = await aiApi.checkHealth();
      setHealth(updated);
      setFailures(aiApi.getFailures());
      setStatusMessage(`Diagnostic ping finished: AI Gateway status is ${updated.status} (${updated.latencyMs}ms latency).`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setPinging(false);
    }
  };

  const handleToggleSimulatedOffline = async () => {
    const next = !aiApi.isSimulatedOffline();
    aiApi.setSimulatedOffline(next);
    const updated = await aiApi.checkHealth();
    setHealth(updated);
    setStatusMessage(next ? 'Simulated Offline Mode enabled. AI is operating in local heuristic fallback.' : 'Simulated Offline Mode disabled. Probing live AI gateway.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleClearFailures = () => {
    aiApi.clearFailures();
    setFailures([]);
    setStatusMessage('Recent AI service failure log cleared.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredForecasts = selectedDisasterFilter === 'All'
    ? forecasts
    : forecasts.filter((f) => f.disasterType.toLowerCase().includes(selectedDisasterFilter.toLowerCase()));

  const disasterTypes = ['All', ...Array.from(new Set(forecasts.map((f) => f.disasterType)))];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Online': return '#16a34a';
      case 'Degraded': return '#d97706';
      case 'Offline': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getStatusBg = (status?: string) => {
    switch (status) {
      case 'Online': return '#dcfce7';
      case 'Degraded': return '#fef3c7';
      case 'Offline': return '#fee2e2';
      default: return '#f1f5f9';
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', color: '#0f172a' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Cpu size={14} /> AI Governance &amp; Telemetry
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Role-Restricted: Coordinator / Admin</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px', letterSpacing: '-0.02em' }}>
            AI Service Status &amp; Telemetry
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Real-time health monitoring, gateway strategy fallback state, error diagnostics, and aid demand forecasting.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleToggleSimulatedOffline}
            style={{
              backgroundColor: health?.isFallback ? '#fef3c7' : '#1e293b',
              color: health?.isFallback ? '#b45309' : '#f8fafc',
              border: '1px solid #334155',
              padding: '9px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {health?.isFallback ? <WifiOff size={15} /> : <Wifi size={15} />}
            {health?.isFallback ? 'Disable Offline Sim' : 'Simulate Offline Fallback'}
          </button>

          <button
            onClick={handleDiagnosticPing}
            disabled={pinging}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: pinging ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
            }}
          >
            <RefreshCw size={14} className={pinging ? 'spin' : ''} />
            {pinging ? 'Probing...' : 'Run Diagnostic Ping'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={18} /> {statusMessage}
        </div>
      )}

      {/* KPI Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Service Health */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            AI Health Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(health?.status),
                boxShadow: `0 0 10px ${getStatusColor(health?.status)}`
              }}
            />
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {health?.status || 'Unknown'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Active Mode: <strong style={{ color: health?.isFallback ? '#d97706' : '#16a34a' }}>
              {health?.isFallback ? 'Fallback Mode (Rule-Based NLP)' : 'Normal AI Service (External LLM Gateway)'}
            </strong>
          </div>
        </div>

        {/* Latency */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Gateway Latency
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Timeout Threshold: <strong>2,500 ms</strong> (auto-fallback guard)
          </div>
        </div>

        {/* Uptime */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Service Availability
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>
            {health?.uptimePercent || 99.4}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Graceful degradation guaranteed across network interruptions
          </div>
        </div>

        {/* Recorded Failures */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Recorded Failures
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: failures.length > 0 ? '#dc2626' : '#16a34a' }}>
            {failures.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            {failures.length === 0 ? 'Zero active unresolved gateway faults' : 'Logged into runtime failure history'}
          </div>
        </div>
      </div>

      {/* Gateway Architecture & Strategy Card */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="#2563eb" /> AI Gateway &amp; Strategy Pattern Configuration
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Active AI Strategy
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {health?.activeStrategy || 'RuleBasedStrategy (Deterministic Fallback)'}
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', lineHeight: 1.5 }}>
              The system dynamically routes triage requests through <code>IAiGateway</code>, executing high-speed NLP keyword heuristic analysis when external cloud providers are absent or slow.
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Supported Languages &amp; Fallback
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">English (en)</span>
              <span className="badge badge-green">Sinhala (si)</span>
              <span className="badge badge-amber">Tamil (ta)</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.5 }}>
              Multilingual script detection identifies Unicode ranges automatically, providing localized emergency relief responses without manual language toggling.
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Provider Infrastructure
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {health?.providerName || 'Local Rule-Based Deterministic NLP Engine'}
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
              Last Verified: {health?.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : 'Just now'}
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Failures Log + Demand Forecasting */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Recent AI Failures */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#dc2626" /> Recent AI Service Failures
            </h2>
            {failures.length > 0 && (
              <button
                onClick={handleClearFailures}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={12} /> Clear Log
              </button>
            )}
          </div>

          {failures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                No AI Service Failures Recorded
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                All AI recommendation requests and chatbot queries have processed without uncaught service faults.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {failures.map((f) => (
                <div
                  key={f.id}
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: '#9f1239' }}>{f.errorCode}</span>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: '#881337', marginBottom: '4px' }}>
                    <strong>Endpoint:</strong> <code>{f.endpoint}</code>
                  </div>
                  <div style={{ color: '#475569', marginBottom: '6px' }}>
                    {f.errorSummary}
                  </div>
                  <div style={{ color: '#15803d', fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} /> Action: {f.fallbackAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Predictive Demand Forecasting Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#2563eb" /> Disaster Demand Forecasting
            </h2>

            {/* Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={12} color="#64748b" />
              <select
                value={selectedDisasterFilter}
                onChange={(e) => setSelectedDisasterFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  color: '#334155'
                }}
              >
                {disasterTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredForecasts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <BarChart2 size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                No Forecast Data Available
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                No historical or predicted disaster demands match the selected criteria.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredForecasts.map((f) => (
                <div
                  key={f.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                      <MapPin size={14} color="#2563eb" /> {f.region}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#16a34a',
                        backgroundColor: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '999px'
                      }}
                    >
                      {Math.round(f.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Disaster: <strong>{f.disasterType}</strong> • Horizon: <strong>{f.forecastPeriod}</strong>
                  </div>

                  {/* Quantity bar */}
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      <span style={{ color: '#334155' }}>Projected {f.resourceCategory}:</span>
                      <span style={{ color: '#2563eb' }}>
                        {f.projectedQuantity.toLocaleString()} {f.unit}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round((f.projectedQuantity / 25000) * 100))}%`,
                          height: '100%',
                          backgroundColor: '#2563eb',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiStatusPage;
