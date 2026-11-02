import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Droplets, Handshake, MapPin, Siren, Stethoscope, Tent, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { citizenApi } from '../services/citizenApi';
import { ActionCard, AlertBanner, CapacityBar, ErrorBox, Loading, PageHeader, StatCard, Stepper, useAsync } from '../components/citizen/ui';

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
        <ActionCard tone="navy" icon={<Handshake size={22} />} title="Volunteer / Donate" subtitle="Help others (coming soon)" onClick={() => alert('Volunteer and donation screens are built by Member 6 and will be linked later.')} />
      </div>

      <div className="cz-grid cz-grid-4 cz-mt">
        <StatCard label="Active requests" value={active.length} sub="Waiting for help" tone="amber" />
        <StatCard label="Delivered" value={delivered.length} sub="Completed requests" tone="green" />
        <StatCard label="Nearby shelters" value={shelters.length} sub="Within 10 km" tone="blue" />
        <StatCard label="Unread alerts" value={unread} sub="Notifications" tone="navy" />
      </div>

      <div className="cz-grid cz-grid-2 cz-mt">
        <div className="card">
          <h2 className="cz-h2">Live map</h2>
          <div className="cz-map">
            <div>
              <MapPin size={28} /><br />Map view is connected by Member 5.<br />
              <a href="https://www.google.com/maps/search/shelters+near+me" target="_blank" rel="noreferrer">Open shelters in Google Maps</a>
            </div>
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
        <div className="cz-between"><h2 className="cz-h2">Nearby shelters</h2><Link to="/citizen/shelters" style={{ fontSize: 13 }}>See all</Link></div>
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

      <button type="button" className="btn-primary" style={{ position: 'fixed', right: 20, bottom: 20, borderRadius: 999, minHeight: 48, zIndex: 40 }} onClick={() => setAiOpen(true)}>
        <Bot size={18} /> AI Assistant
      </button>
      {aiOpen && (
        <div className="cz-toast" style={{ background: 'var(--color-primary-dark)', bottom: 80 }} role="dialog" aria-label="AI Assistant">
          <div className="cz-row">
            <span>AI Assistant is connected by Member 4 later.</span>
            <button type="button" aria-label="Close" onClick={() => setAiOpen(false)} style={{ background: 'transparent', color: '#fff' }}><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
