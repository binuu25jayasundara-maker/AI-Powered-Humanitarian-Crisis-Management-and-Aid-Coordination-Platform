import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, LocateFixed, Send, Upload, WifiOff } from 'lucide-react';
import { citizenApi } from '../../services/citizenApi';
import { AidRequest, CATEGORIES, RequestCategory, URGENCIES, Urgency } from '../../types/citizen';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];

interface Props {
  initialCategory?: RequestCategory;
  requirePhone?: boolean;   // true for people who are not logged in
  showTrackLink?: boolean;  // true inside the citizen portal
}

type Errors = Partial<Record<'description' | 'location' | 'phone' | 'file', string>>;

export const EmergencyRequestForm: React.FC<Props> = ({ initialCategory, requirePhone = false, showTrackLink = false }) => {
  const [category, setCategory] = useState<RequestCategory>(initialCategory ?? 'Food & Water');
  const [urgency, setUrgency] = useState<Urgency>('High');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [gpsMsg, setGpsMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [done, setDone] = useState<AidRequest | null>(null);

  const useGps = () => {
    if (!navigator.geolocation) { setGpsMsg('GPS is not supported. Please type your location.'); return; }
    setGpsMsg('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocation((old) => old || `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGpsMsg('Location found.');
      },
      () => setGpsMsg('Could not get GPS. Please type your location.'),
      { timeout: 8000 }
    );
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) { setFile(null); return; }
    if (!ALLOWED.includes(f.type)) { setErrors((p) => ({ ...p, file: 'Only JPG, PNG or PDF files are allowed.' })); setFile(null); return; }
    if (f.size > MAX_BYTES) { setErrors((p) => ({ ...p, file: 'File is too big. Maximum size is 5 MB.' })); setFile(null); return; }
    setErrors((p) => ({ ...p, file: undefined }));
    setFile(f);
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (description.trim().length < 10) e.description = 'Please describe the problem (at least 10 characters).';
    if (location.trim().length < 3) e.location = 'Please enter your location or use GPS.';
    if (requirePhone && !/^\+?[0-9\s-]{9,15}$/.test(phone.trim())) e.phone = 'Enter a valid phone number so we can contact you.';
    if (errors.file) e.file = errors.file;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSendError('');
    if (!validate()) return;
    setSending(true);
    try {
      const req = await citizenApi.createRequest({
        category, urgency, description: description.trim(), location: location.trim(),
        lat: coords?.lat, lng: coords?.lng,
        contactPhone: phone.trim() || undefined, evidenceName: file?.name
      });
      setDone(req);
    } catch {
      setSendError('We could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
        {done.queued ? <WifiOff size={48} color="var(--color-amber-dark)" /> : <CheckCircle2 size={48} color="var(--color-primary-green)" />}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary-dark)', margin: '12px 0 6px' }}>
          {done.queued ? 'Saved. Will send when online' : 'Request received'}
        </h2>
        <p className="cz-muted" style={{ marginBottom: 16 }}>
          Your reference number is <strong>{done.reference}</strong>. Keep it safe.
        </p>
        <div className="cz-row" style={{ justifyContent: 'center' }}>
          {showTrackLink && <Link to="/citizen/requests" className="btn-primary" style={{ textDecoration: 'none' }}>Track my request</Link>}
          <button type="button" className="btn-secondary" onClick={() => { setDone(null); setDescription(''); setFile(null); }}>
            Send another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <div className="cz-field">
        <span className="cz-label" id="cat-label">What do you need?</span>
        <div className="cz-row" role="group" aria-labelledby="cat-label">
          {CATEGORIES.map((c) => (
            <button type="button" key={c} className={`cz-chipbtn ${category === c ? (c === 'Medical' || c === 'Rescue / Evacuation' ? 'on-red' : 'on') : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="cz-field">
        <span className="cz-label" id="urg-label">How urgent is it?</span>
        <div className="cz-row" role="group" aria-labelledby="urg-label">
          {URGENCIES.map((u) => (
            <button type="button" key={u} className={`cz-chipbtn ${urgency === u ? (u === 'Critical' ? 'on-red' : 'on') : ''}`} aria-pressed={urgency === u} onClick={() => setUrgency(u)}>{u}</button>
          ))}
        </div>
      </div>

      <div className="cz-field">
        <label className="cz-label" htmlFor="desc">Describe the problem</label>
        <textarea id="desc" className="cz-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Example: 4 adults and 2 children, no drinking water since yesterday." />
        {errors.description && <div className="cz-error">{errors.description}</div>}
      </div>

      <div className="cz-field">
        <label className="cz-label" htmlFor="loc">Your location</label>
        <div className="cz-row">
          <input id="loc" className="cz-input" style={{ flex: 1, minWidth: 200 }} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Village, town, nearby landmark" />
          <button type="button" className="btn-secondary" onClick={useGps}><LocateFixed size={16} /> Use GPS</button>
        </div>
        {gpsMsg && <div className="cz-muted" style={{ marginTop: 4 }}>{gpsMsg}</div>}
        {errors.location && <div className="cz-error">{errors.location}</div>}
      </div>

      {requirePhone && (
        <div className="cz-field">
          <label className="cz-label" htmlFor="phone">Phone number</label>
          <input id="phone" className="cz-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94 77 123 4567" />
          {errors.phone && <div className="cz-error">{errors.phone}</div>}
        </div>
      )}

      <div className="cz-field">
        <label className="cz-label" htmlFor="file"><Upload size={14} /> Photo or document (optional, max 5 MB)</label>
        <input id="file" className="cz-input" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFile} />
        {file && <div className="cz-muted" style={{ marginTop: 4 }}>Selected: {file.name}</div>}
        {errors.file && <div className="cz-error">{errors.file}</div>}
      </div>

      {sendError && <div className="cz-error" style={{ marginBottom: 12 }}>{sendError}</div>}
      <button type="submit" className="cz-btn-red" disabled={sending}>
        <Send size={16} /> {sending ? 'Sending...' : 'Send request'}
      </button>
    </form>
  );
};
