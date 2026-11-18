import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Plus, MapPin, AlertTriangle } from 'lucide-react';
import { coordinationApi, formatDateTime } from '../../services/coordinationApi';
import { AreaStatus, CrisisEvent, EventSeverity, EventStatus } from '../../types/coordination';
import { EmptyState, Field, Modal, PageHeader, Panel, useToast } from '../../components/coordination/ui';

const STATUSES: EventStatus[] = ['Planned', 'Active', 'Monitoring', 'Closed'];
const SEVERITIES: EventSeverity[] = ['Critical', 'High', 'Moderate', 'Low'];
const AREA_STATUSES: AreaStatus[] = ['Affected', 'Responding', 'Stabilised', 'Cleared'];
const EVENT_TYPES = ['Flood', 'Landslide', 'Cyclone', 'Drought', 'Fire', 'Epidemic', 'Other'];

const statusBadge = (s: EventStatus) =>
  s === 'Active' ? 'badge-red' : s === 'Monitoring' ? 'badge-amber' : s === 'Planned' ? 'badge-blue' : 'badge-green';
const severityBadge = (s: EventSeverity) =>
  s === 'Critical' ? 'badge-red' : s === 'High' ? 'badge-amber' : s === 'Moderate' ? 'badge-blue' : 'badge-green';
const areaBadge = (s: AreaStatus) =>
  s === 'Affected' ? 'badge-red' : s === 'Responding' ? 'badge-amber' : s === 'Stabilised' ? 'badge-blue' : 'badge-green';

const toLocalInput = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const CrisisEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CrisisEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [toast, showToast] = useToast();

  const isOffline = coordinationApi.isOffline();

  // create event form
  const [name, setName] = useState('');
  const [type, setType] = useState(EVENT_TYPES[0]);
  const [severity, setSeverity] = useState<EventSeverity>('High');
  const [startedAt, setStartedAt] = useState(toLocalInput(new Date()));
  const [description, setDescription] = useState('');
  const [eventError, setEventError] = useState('');

  // area form
  const [areaName, setAreaName] = useState('');
  const [areaDistrict, setAreaDistrict] = useState('');
  const [areaPop, setAreaPop] = useState('');
  const [areaStatus, setAreaStatus] = useState<AreaStatus>('Affected');
  const [areaError, setAreaError] = useState('');

  const loadData = () => {
    setLoading(true);
    setLoadError(null);
    coordinationApi.getEvents()
      .then((e) => {
        setEvents(e);
        if (e.length && !selectedId) setSelectedId(e[0].id);
      })
      .catch((err: any) => {
        setLoadError(err.message || 'Failed to load crisis events');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const selected = events.find((e) => e.id === selectedId) || null;

  const submitEvent = async () => {
    if (!name.trim()) {
      setEventError('Event name is required.');
      return;
    }
    try {
      const created = await coordinationApi.createEvent({
        name: name.trim(),
        type,
        severity,
        description: description.trim(),
        startedAt: new Date(startedAt).toISOString()
      });
      setEvents(await coordinationApi.getEvents());
      setSelectedId(created.id);
      setShowCreate(false);
      setName('');
      setDescription('');
      setEventError('');
      showToast('Crisis event created');
    } catch (err: any) {
      setEventError(err.message || 'Failed to create event');
    }
  };

  const changeStatus = async (status: EventStatus) => {
    if (!selected) return;
    try {
      setEvents(await coordinationApi.setEventStatus(selected.id, status));
      showToast(`Status changed to ${status}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to change status');
    }
  };

  const submitArea = async () => {
    if (!selected) return;
    const pop = Number(areaPop);
    if (!areaName.trim() || !areaDistrict.trim() || !Number.isFinite(pop) || pop < 0 || areaPop === '') {
      setAreaError('Name, district and a valid population are required.');
      return;
    }
    try {
      setEvents(
        await coordinationApi.addOperationalArea(selected.id, {
          name: areaName.trim(),
          district: areaDistrict.trim(),
          populationAtRisk: Math.round(pop),
          status: areaStatus
        })
      );
      setShowArea(false);
      setAreaName('');
      setAreaDistrict('');
      setAreaPop('');
      setAreaStatus('Affected');
      setAreaError('');
      showToast('Operational area added');
    } catch (err: any) {
      setAreaError(err.message || 'Failed to add area');
    }
  };

  if (loadError) {
    const isAuth = loadError.toLowerCase().includes('log in') || loadError.toLowerCase().includes('authentication') || loadError.includes('401');
    return (
      <div className="co-page">
        <Panel>
          <EmptyState title="Could not load crisis events" message={loadError} />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            {isAuth ? (
              <button className="co-btn co-btn-blue" onClick={() => navigate('/login')}>Go to Login</button>
            ) : (
              <button className="co-btn co-btn-blue" onClick={loadData}>Try again</button>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="co-page">
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
        badges={<span className="badge badge-amber"><CalendarClock size={13} /> Coordination</span>}
        title="Crisis Events"
        subtitle="Create crisis events, define the operational areas they cover and control their lifecycle."
        actions={
          <button className="co-btn co-btn-green" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create event
          </button>
        }
      />

      <div className="co-grid" style={{ gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 2fr)' }}>
        <Panel title="Events" subtitle={`${events.length} total`}>
          {events.length === 0 && <EmptyState title="No events yet" message="Create the first crisis event." />}
          {events.map((e) => (
            <div
              key={e.id}
              className={`co-event-item ${e.id === selectedId ? 'selected' : ''}`}
              onClick={() => setSelectedId(e.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-navy)' }}>{e.name}</div>
                <span className={`badge ${statusBadge(e.status)}`}>{e.status}</span>
              </div>
              <div className="co-small co-muted" style={{ marginTop: 6 }}>
                {e.type} · {e.areas.length} area{e.areas.length === 1 ? '' : 's'} · {formatDateTime(e.startedAt)}
              </div>
            </div>
          ))}
        </Panel>

        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Panel
              title={selected.name}
              subtitle={`${selected.type} · started ${formatDateTime(selected.startedAt)}`}
              action={<span className={`badge ${severityBadge(selected.severity)}`}>{selected.severity} severity</span>}
            >
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>{selected.description || 'No description provided.'}</p>
              <div className="co-label">Event status</div>
              <div className="co-tabs" style={{ marginBottom: 0 }}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`co-tab ${selected.status === s ? 'active' : ''}`}
                    onClick={() => selected.status !== s && changeStatus(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel
              title="Operational areas"
              subtitle="Districts and zones covered by this event"
              action={
                <button className="co-btn co-btn-blue co-btn-sm" onClick={() => setShowArea(true)}>
                  <Plus size={14} /> Add area
                </button>
              }
            >
              {selected.areas.length === 0 ? (
                <EmptyState title="No operational areas" message="Add the first area affected by this event." />
              ) : (
                <div className="co-table-wrap">
                  <table className="rq-table">
                    <thead>
                      <tr><th>Area</th><th>District</th><th>Population at risk</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {selected.areas.map((a) => (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 600 }}><MapPin size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} color="#0866C6" />{a.name}</td>
                          <td>{a.district}</td>
                          <td>{a.populationAtRisk.toLocaleString()}</td>
                          <td><span className={`badge ${areaBadge(a.status)}`}>{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        ) : (
          <Panel><EmptyState title="Select an event" message="Choose an event to see its operational areas." /></Panel>
        )}
      </div>

      {showCreate && (
        <Modal
          title="Create crisis event"
          subtitle="New events start in Planned status."
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="co-btn co-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="co-btn co-btn-green" onClick={submitEvent}>Create event</button>
            </>
          }
        >
          <div className="co-form-grid">
            <Field label="Event name" className="full">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Galle Coastal Flooding" />
            </Field>
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {EVENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </Field>
            <Field label="Severity">
              <select value={severity} onChange={(e) => setSeverity(e.target.value as EventSeverity)}>
                {SEVERITIES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </Field>
            <Field label="Start date and time" className="full">
              <input type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
            </Field>
            <Field label="Description" className="full">
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is happening and what is the response scope?" />
            </Field>
          </div>
          {eventError && <div className="co-error">{eventError}</div>}
        </Modal>
      )}

      {showArea && selected && (
        <Modal
          title="Add operational area"
          subtitle={`Adding to ${selected.name}`}
          onClose={() => setShowArea(false)}
          footer={
            <>
              <button className="co-btn co-btn-ghost" onClick={() => setShowArea(false)}>Cancel</button>
              <button className="co-btn co-btn-blue" onClick={submitArea}>Add area</button>
            </>
          }
        >
          <div className="co-form-grid">
            <Field label="Area name">
              <input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="e.g. Kaduwela" />
            </Field>
            <Field label="District">
              <input value={areaDistrict} onChange={(e) => setAreaDistrict(e.target.value)} placeholder="e.g. Colombo" />
            </Field>
            <Field label="Population at risk">
              <input type="number" min={0} value={areaPop} onChange={(e) => setAreaPop(e.target.value)} />
            </Field>
            <Field label="Status">
              <select value={areaStatus} onChange={(e) => setAreaStatus(e.target.value as AreaStatus)}>
                {AREA_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </Field>
          </div>
          {areaError && <div className="co-error">{areaError}</div>}
        </Modal>
      )}
      {toast}
    </div>
  );
};

export default CrisisEventsPage;
