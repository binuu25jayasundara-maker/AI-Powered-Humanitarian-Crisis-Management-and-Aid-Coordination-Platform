import React, { useEffect, useState } from 'react';
import { Handshake, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coordinationApi, formatDateTime } from '../../services/coordinationApi';
import { CrisisEvent, Partner, PartnerRequest, PartnerRequestStatus } from '../../types/coordination';
import { EmptyState, Field, PageHeader, Panel, useToast } from '../../components/coordination/ui';

const PRIORITIES: PartnerRequest['priority'][] = ['Urgent', 'High', 'Normal'];
const NEXT_STATUS: Partial<Record<PartnerRequestStatus, PartnerRequestStatus>> = {
  Pending: 'Accepted',
  Accepted: 'In Transit',
  'In Transit': 'Delivered'
};

const partnerStatusBadge = (s: Partner['status']) =>
  s === 'Available' ? 'badge-green' : s === 'Limited' ? 'badge-amber' : 'badge-red';

const requestStatusBadge = (s: PartnerRequestStatus) =>
  s === 'Delivered' ? 'badge-green' : s === 'Declined' ? 'badge-red' : s === 'Pending' ? 'badge-amber' : 'badge-blue';

const priorityBadge = (p: PartnerRequest['priority']) =>
  p === 'Urgent' ? 'badge-red' : p === 'High' ? 'badge-amber' : 'badge-navy';

export const PartnerCoordinationPage: React.FC = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [events, setEvents] = useState<CrisisEvent[]>([]);
  const [toast, showToast] = useToast();

  const [partnerId, setPartnerId] = useState('');
  const [eventId, setEventId] = useState('');
  const [resource, setResource] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState<PartnerRequest['priority']>('Normal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([coordinationApi.getPartners(), coordinationApi.getPartnerRequests(), coordinationApi.getEvents()]).then(
      ([p, r, e]) => {
        setPartners(p);
        setRequests(r);
        setEvents(e);
        if (p.length) setPartnerId(p[0].id);
        const firstOpen = e.find((x) => x.status !== 'Closed');
        if (firstOpen) setEventId(firstOpen.id);
        else if (e.length) setEventId(e[0].id);
      }
    );
  }, []);

  const selectedPartner = partners.find((p) => p.id === partnerId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!partnerId || !eventId || !resource.trim() || !Number.isFinite(qty) || qty <= 0) {
      setError('Choose a partner and event, name the resource and enter a quantity above zero.');
      return;
    }
    if (selectedPartner?.status === 'Unavailable') {
      setError(`${selectedPartner.name} is currently unavailable. Choose another partner.`);
      return;
    }
    await coordinationApi.createPartnerRequest({
      partnerId,
      eventId,
      resource: resource.trim(),
      quantity: Math.round(qty),
      priority,
      notes: notes.trim(),
      requestedBy: user?.fullName || 'Coordinator'
    });
    setRequests(await coordinationApi.getPartnerRequests());
    setResource('');
    setQuantity('');
    setNotes('');
    setPriority('Normal');
    setError('');
    showToast('Request sent to partner');
  };

  const advance = async (r: PartnerRequest) => {
    const next = NEXT_STATUS[r.status];
    if (!next) return;
    setRequests(await coordinationApi.updatePartnerRequestStatus(r.id, next));
    showToast(`Request marked ${next}`);
  };

  const decline = async (r: PartnerRequest) => {
    setRequests(await coordinationApi.updatePartnerRequestStatus(r.id, 'Declined'));
    showToast('Request marked Declined');
  };

  return (
    <div className="co-page">
      <PageHeader
        badges={<span className="badge badge-green"><Handshake size={13} /> Coordination</span>}
        title="Partner Coordination"
        subtitle="See partner capacity, send resource requests and track each request through to delivery."
      />

      <div className="co-grid co-grid-main co-mb">
        <Panel title="Partners" subtitle="Current capacity reported by each organisation">
          <div className="co-table-wrap">
            <table className="rq-table">
              <thead>
                <tr><th>Partner</th><th>Focus</th><th style={{ minWidth: 190 }}>Capacity</th><th>Status</th></tr>
              </thead>
              <tbody>
                {partners.map((p) => {
                  const pct = p.capacityTotal ? Math.round((p.capacityAvailable / p.capacityTotal) * 100) : 0;
                  const tone = pct < 15 ? 'red' : pct < 50 ? 'amber' : 'green';
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div className="co-small co-muted">{p.type} · {p.contact}</div>
                      </td>
                      <td className="co-small">{p.focus}</td>
                      <td>
                        <div className="co-small" style={{ marginBottom: 4 }}>
                          <strong>{p.capacityAvailable.toLocaleString()}</strong> / {p.capacityTotal.toLocaleString()} {p.capacityUnit}
                        </div>
                        <div className="progress-bar-track">
                          <div className={`progress-bar-fill co-bar-fill-${tone}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td><span className={`badge ${partnerStatusBadge(p.status)}`}>{p.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="New resource request" subtitle="Sent to the selected partner for acceptance">
          <form onSubmit={submit}>
            <div className="co-form-grid">
              <Field label="Partner" className="full">
                <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                  {partners.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </Field>
              <Field label="Crisis event" className="full">
                <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                  {events.map((ev) => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                </select>
              </Field>
              <Field label="Resource">
                <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="e.g. Water bowsers" />
              </Field>
              <Field label={`Quantity${selectedPartner ? ` (${selectedPartner.capacityUnit})` : ''}`}>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </Field>
              <Field label="Priority" className="full">
                <select value={priority} onChange={(e) => setPriority(e.target.value as PartnerRequest['priority'])}>
                  {PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </Field>
              <Field label="Notes" className="full">
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery location, contact on site..." />
              </Field>
            </div>
            {error && <div className="co-error">{error}</div>}
            <button type="submit" className="co-btn co-btn-green" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
              <Send size={15} /> Send request
            </button>
          </form>
        </Panel>
      </div>

      <Panel title="Request history" subtitle={`${requests.length} request${requests.length === 1 ? '' : 's'}`}>
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" message="Requests you send will be tracked here." />
        ) : (
          <div className="co-table-wrap">
            <table className="rq-table">
              <thead>
                <tr><th>Requested</th><th>Partner</th><th>Resource</th><th>Event</th><th>Priority</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="co-muted co-small">{formatDateTime(r.requestedAt)}<br />{r.requestedBy}</td>
                    <td style={{ fontWeight: 600 }}>{r.partnerName}</td>
                    <td>
                      {r.quantity.toLocaleString()} × {r.resource}
                      {r.notes && <div className="co-small co-muted">{r.notes}</div>}
                    </td>
                    <td className="co-small">{r.eventName}</td>
                    <td><span className={`badge ${priorityBadge(r.priority)}`}>{r.priority}</span></td>
                    <td><span className={`badge ${requestStatusBadge(r.status)}`}>{r.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {NEXT_STATUS[r.status] && (
                        <button className="co-btn co-btn-ghost co-btn-sm" onClick={() => advance(r)}>
                          Mark {NEXT_STATUS[r.status]}
                        </button>
                      )}
                      {r.status === 'Pending' && (
                        <button className="co-btn co-btn-ghost co-btn-sm" style={{ marginLeft: 6 }} onClick={() => decline(r)}>
                          Declined
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {toast}
    </div>
  );
};

export default PartnerCoordinationPage;
