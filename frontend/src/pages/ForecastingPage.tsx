import React, { useState, useEffect } from 'react';
import { aiApi } from '../services/aiApi';
import { DemandForecast } from '../types/ai';
import { TrendingUp, Package, ShieldCheck, MapPin, RefreshCw, BarChart3, Filter } from 'lucide-react';

export const ForecastingPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getForecasts();
      setForecasts(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'All'
    ? forecasts
    : forecasts.filter((f) => f.disasterType.toLowerCase().includes(filter.toLowerCase()));

  const disasterTypes = ['All', ...Array.from(new Set(forecasts.map((f) => f.disasterType)))];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
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
              <TrendingUp size={14} /> Predictive Analytics
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Operational Relief Planning</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px' }}>
            AI Aid Demand Forecasting &amp; Resource Planning
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Predictive machine learning models forecasting required medical, shelter, and food aid across operational flood sectors.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              backgroundColor: '#ffffff'
            }}
          >
            {disasterTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <button
            onClick={loadForecasts}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filtered.map((f) => (
          <div key={f.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge badge-blue">Period: {f.forecastPeriod}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                {Math.round(f.confidence * 100)}% Confidence
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>
              <MapPin size={18} color="#2563eb" /> {f.region}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Disaster Trigger: <strong>{f.disasterType}</strong>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginTop: 'auto'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Projected {f.resourceCategory} Demand
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {f.projectedQuantity.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{f.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastingPage;
