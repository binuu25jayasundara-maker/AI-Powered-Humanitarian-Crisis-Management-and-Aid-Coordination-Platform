import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Droplets, Handshake, MapPin, Siren, Stethoscope, Tent, X, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { citizenApi } from '../services/citizenApi';
import { ActionCard, AlertBanner, CapacityBar, ErrorBox, Loading, PageHeader, StatCard, Stepper, useAsync } from '../components/citizen/ui';
import { AiAssistantSlideOver } from '../components/ai/AiAssistantSlideOver';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const [requests, shelters, alerts, notifications] = await Promise.all([
      citizenApi.getRequests(), citizenApi.getShelters(), citizenApi.getAlerts(), citizenApi.getNotifications()
    ]);
    return { requests, shelters, alerts, notifications };
  });

  // When the phone comes back online, send requests that were saved offline.
  useEffect(() => {
    const onOnline = () => { citizenApi.flushQueue().then((n) => n > 0 && reload()); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [reload]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? 'Could not load dashboard'} onRetry={reload} />;

  const { requests, shelters, alerts, notifications } = data;
  const topAlert = alerts.find((a) => a.level !== 'Info');
  const active = requests.filter((r) => r.status !== 'Delivered');
  const delivered = requests.filter((r) => r.status === 'Delivered');
  const unread = notifications.filter((n) => !n.read).length;
  const nearby = [...shelters].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
  const latest = requests[0];
  const firstName = (user?.fullName ?? 'Citizen').split(' ')[0];

  return (
    <div className="cz-page">
      <PageHeader
        title="Citizen Dashboard"
        subtitle={`Welcome back, ${firstName}. Get help, track your requests and find safe places.`}
        chips={<span className="badge badge-blue">Public Crisis Support</span>}
      />

      {topAlert && <AlertBanner level={topAlert.level} title={topAlert.title} message={topAlert.message} />}

      <div className="cz-row" style={{ marginBottom: 20 }}>
        <button type="button" className="cz-sos" onClick={() => navigate('/citizen/request')}>
          <Siren size={24} /> SOS: I need emergency help
        </button>
      </div>

      <div className="cz-grid cz-grid-4">
        <ActionCard tone="blue" icon={<Droplets size={22} />} title="Food & Water" subtitle="Request supplies" onClick={() => navigate('/citizen/request?category=Food%20%26%20Water')} />
        <ActionCard tone="green" icon={<Tent size={22} />} title="Find Shelter" subtitle="Safe places near you" onClick={() => navigate('/citizen/shelters')} />
        <ActionCard tone="red" icon={<Stethoscope size={22} />} title="Medical / Evac" subtitle="Urgent medical help" onClick={() => navigate('/citizen/request?category=Medical')} />
        <ActionCard tone="navy" icon={<Handshake size={22} />} title="Public SOS Portal" subtitle="Direct emergency broadcast" onClick={() => navigate('/emergency-help')} />
      </div>

      <div className="cz-grid cz-grid-4 cz-mt">
        <StatCard label="Active requests" value={active.length} sub="Waiting for help" tone="amber" />
        <StatCard label="Delivered" value={delivered.length} sub="Completed requests" tone="green" />
        <StatCard label="Nearby shelters" value={shelters.length} sub="Within 10 km" tone="blue" />
        <StatCard label="Unread alerts" value={unread} sub="Notifications" tone="navy" />
      </div>

      <div className="cz-grid cz-grid-2 cz-mt">
        <div className="card">
          <div className="cz-between" style={{ marginBottom: 8 }}>
            <h2 className="cz-h2" style={{ margin: 0 }}>Map &amp; Shelters</h2>
            <Link to="/citizen/shelters" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Map size={14} /> View Map &amp; Shelters
            </Link>
          </div>
          <div className="cz-map" style={{ flexDirection: 'column', gap: 10 }}>
            <div>
              <MapPin size={28} color="var(--color-primary-blue)" style={{ margin: '0 auto 6px', display: 'block' }} />
              <strong>Interactive Map &amp; Shelters</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>Real-time shelter occupancy, capacity indicators, interactive markers, and directions.</div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: 12, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('/citizen/shelters')}
            >
              <Map size={14} /> Open Map &amp; Shelters
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="cz-h2">My request status</h2>
          {latest ? (
            <>
              <div className="cz-between">
                <strong>{latest.reference}</strong>
                <span className={`badge ${latest.status === 'Delivered' ? 'badge-green' : 'badge-amber'}`}>{latest.status}</span>
              </div>
              <div className="cz-muted">{latest.category}</div>
              <Stepper status={latest.status} />
              {latest.etaMinutes && <div className="cz-muted">ETA: about {latest.etaMinutes} min</div>}
              <Link to="/citizen/requests" style={{ display: 'inline-block', marginTop: 10, fontSize: 13 }}>View all requests</Link>
            </>
          ) : <div className="cz-muted">You have no requests yet.</div>}
        </div>
      </div>

      <div className="card cz-mt">
        <div className="cz-between">
          <h2 className="cz-h2">Nearby shelters</h2>
          <Link to="/citizen/shelters" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Explore All Shelters on Map
          </Link>
        </div>
        <div className="cz-grid cz-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {nearby.map((s) => (
            <div key={s.id} className="cz-item" style={{ display: 'block', cursor: 'default' }}>
              <strong style={{ fontSize: 14 }}>{s.name}</strong>
              <div className="cz-muted" style={{ marginBottom: 8 }}>{s.distanceKm} km away</div>
              <CapacityBar occupied={s.occupied} capacity={s.capacity} />
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn-primary" style={{ position: 'fixed', right: 20, bottom: 20, borderRadius: 999, minHeight: 48, zIndex: 40, boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }} onClick={() => setAiOpen(true)}>
        <Bot size={18} /> AI Assistant
      </button>
      <AiAssistantSlideOver isOpen={aiOpen} onClose={() => setAiOpen(false)} caseNumber="#CJ-101" />
    </div>
  );
};
