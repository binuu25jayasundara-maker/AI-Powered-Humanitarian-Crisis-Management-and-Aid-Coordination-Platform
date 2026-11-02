import React, { useMemo, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { citizenApi } from '../../services/citizenApi';
import { CapacityBar, EmptyState, ErrorBox, Loading, PageHeader, useAsync } from '../../components/citizen/ui';

export const SheltersPage: React.FC = () => {
  const { data, loading, error, reload } = useAsync(() => citizenApi.getShelters());
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('All');
  const [spaceOnly, setSpaceOnly] = useState(false);

  const districts = useMemo(() => ['All', ...Array.from(new Set((data ?? []).map((s) => s.district)))], [data]);
  const list = useMemo(
    () => (data ?? [])
      .filter((s) => (district === 'All' || s.district === district)
        && (!spaceOnly || s.occupied < s.capacity * 0.9)
        && s.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => a.distanceKm - b.distanceKm),
    [data, district, spaceOnly, search]
  );

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? 'Could not load shelters'} onRetry={reload} />;

  return (
    <div className="cz-page">
      <PageHeader title="Map & Shelters" subtitle="Find a safe shelter with free space." />
      <div className="card">
        <div className="cz-map" style={{ marginBottom: 16 }}><div><MapPin size={28} /><br />Interactive map is added with Member 5's map component.</div></div>
        <div className="cz-row">
          <input className="cz-input" style={{ flex: 1, minWidth: 180 }} aria-label="Search shelters" placeholder="Search shelter name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="cz-input" style={{ width: 160 }} aria-label="District" value={district} onChange={(e) => setDistrict(e.target.value)}>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <label className="cz-row" style={{ fontSize: 13 }}><input type="checkbox" checked={spaceOnly} onChange={(e) => setSpaceOnly(e.target.checked)} /> Has free space</label>
        </div>
      </div>

      <div className="cz-mt">
        {list.length === 0 ? <div className="card"><EmptyState title="No shelters found" text="Try a different filter." /></div> : list.map((s) => (
          <div key={s.id} className="card" style={{ marginBottom: 12 }}>
            <div className="cz-between">
              <div>
                <strong>{s.name}</strong>
                <div className="cz-muted">{s.address} · {s.distanceKm} km away</div>
                <div className="cz-row" style={{ marginTop: 6 }}>{s.facilities.map((f) => <span key={f} className="badge badge-blue">{f}</span>)}</div>
              </div>
              <a className="btn-primary" style={{ textDecoration: 'none' }} target="_blank" rel="noreferrer"
                 href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.name + ' ' + s.address)}`}>
                <Navigation size={16} /> Get directions
              </a>
            </div>
            <div style={{ marginTop: 12 }}><CapacityBar occupied={s.occupied} capacity={s.capacity} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};
