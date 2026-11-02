import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { citizenApi } from '../../services/citizenApi';
import { CitizenProfile } from '../../types/citizen';
import { ErrorBox, Loading, PageHeader, Toast, useAsync } from '../../components/citizen/ui';

const NEEDS = ['Wheelchair user', 'Visual impairment', 'Hearing impairment', 'Needs regular medicine', 'Elderly in household', 'Infant in household'];

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => citizenApi.getProfile(user?.fullName ?? ''));
  const [form, setForm] = useState<CitizenProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => { if (data) setForm(data); }, [data]);

  if (loading || !form) return error ? <ErrorBox message={error} onRetry={reload} /> : <Loading />;

  const set = <K extends keyof CitizenProfile>(k: K, v: CitizenProfile[K]) => setForm({ ...form, [k]: v });
  const toggleNeed = (n: string) => set('accessibility', form.accessibility.includes(n) ? form.accessibility.filter((x) => x !== n) : [...form.accessibility, n]);
  const addMember = () => set('household', [...form.household, { id: `m${Date.now()}`, name: '', age: 0, needs: '' }]);
  const updMember = (id: string, patch: Partial<CitizenProfile['household'][number]>) =>
    set('household', form.household.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) { setFormError('Please enter your full name.'); return; }
    if (form.phone && !/^\+?[0-9\s-]{9,15}$/.test(form.phone.trim())) { setFormError('Enter a valid phone number.'); return; }
    setFormError('');
    setSaving(true);
    await citizenApi.saveProfile(form);
    setSaving(false);
    setToast('Changes saved');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <form className="cz-page" style={{ maxWidth: 760 }} onSubmit={save} noValidate>
      <PageHeader title="Profile & Settings" subtitle="Keep your details up to date so help can reach you." />

      <div className="card">
        <h2 className="cz-h2">My details</h2>
        <div className="cz-grid cz-grid-eq">
          <div className="cz-field"><label className="cz-label" htmlFor="fn">Full name</label><input id="fn" className="cz-input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
          <div className="cz-field"><label className="cz-label" htmlFor="ph">Phone</label><input id="ph" type="tel" className="cz-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+94 77 123 4567" /></div>
        </div>
        <div className="cz-field"><label className="cz-label" htmlFor="ad">Home address</label><input id="ad" className="cz-input" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
        <div className="cz-field" style={{ maxWidth: 240 }}>
          <label className="cz-label" htmlFor="lg">Language</label>
          <select id="lg" className="cz-input" value={form.language} onChange={(e) => set('language', e.target.value as CitizenProfile['language'])}>
            <option value="EN">English</option><option value="SI">සිංහල (Sinhala)</option><option value="TA">தமிழ் (Tamil)</option>
          </select>
        </div>
      </div>

      <div className="card cz-mt">
        <div className="cz-between"><h2 className="cz-h2">Household members</h2><button type="button" className="btn-secondary" onClick={addMember}><Plus size={16} /> Add member</button></div>
        {form.household.length === 0 && <p className="cz-muted">No members added.</p>}
        {form.household.map((m) => (
          <div key={m.id} className="cz-row" style={{ marginBottom: 8 }}>
            <input className="cz-input" style={{ flex: 2, minWidth: 140 }} aria-label="Member name" placeholder="Name" value={m.name} onChange={(e) => updMember(m.id, { name: e.target.value })} />
            <input className="cz-input" style={{ width: 80 }} type="number" min={0} max={120} aria-label="Age" placeholder="Age" value={m.age || ''} onChange={(e) => updMember(m.id, { age: Number(e.target.value) })} />
            <input className="cz-input" style={{ flex: 2, minWidth: 140 }} aria-label="Special needs" placeholder="Special needs" value={m.needs} onChange={(e) => updMember(m.id, { needs: e.target.value })} />
            <button type="button" className="btn-secondary" aria-label="Remove member" onClick={() => set('household', form.household.filter((x) => x.id !== m.id))}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="card cz-mt">
        <h2 className="cz-h2">Accessibility needs</h2>
        <div className="cz-row">{NEEDS.map((n) => <button type="button" key={n} className={`cz-chipbtn ${form.accessibility.includes(n) ? 'on' : ''}`} aria-pressed={form.accessibility.includes(n)} onClick={() => toggleNeed(n)}>{n}</button>)}</div>
      </div>

      <div className="card cz-mt">
        <h2 className="cz-h2">Notification preferences</h2>
        {(['sms', 'email', 'push'] as const).map((k) => (
          <label key={k} className="cz-row" style={{ marginBottom: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.prefs[k]} onChange={(e) => set('prefs', { ...form.prefs, [k]: e.target.checked })} />
            {k === 'sms' ? 'SMS messages' : k === 'email' ? 'Email' : 'Push notifications'}
          </label>
        ))}
      </div>

      {formError && <div className="cz-error cz-mt">{formError}</div>}
      <button type="submit" className="btn-primary cz-mt" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save changes'}</button>
      <Toast message={toast} />
    </form>
  );
};
