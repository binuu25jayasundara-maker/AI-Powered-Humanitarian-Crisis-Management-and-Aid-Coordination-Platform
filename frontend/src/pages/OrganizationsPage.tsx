import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Organization } from '../types';
import { Building2, Plus, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('NGO');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    const data = await api.getOrganizations();
    setOrgs(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createOrganization({ name, code, type, contactEmail: email, contactPhone: phone, address });
    setShowModal(false);
    setName('');
    setCode('');
    setEmail('');
    setPhone('');
    setAddress('');
    loadOrgs();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)' }}>
            Partner Organizations & Agencies
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Multi-agency registry connecting Government ministries, Red Cross, and accredited NGOs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: 'var(--color-blue-primary)',
            color: '#fff',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}
        >
          <Plus size={16} /> Register Organization
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {orgs.map((o) => (
          <div key={o.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '6px' }}>{o.type}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{o.name}</h3>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>Code: {o.code}</div>
              </div>
              {o.isVerified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px', fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Verified
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#94a3b8" /> {o.contactEmail}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#94a3b8" /> {o.contactPhone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="#94a3b8" /> {o.address}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
              <span>Active Personnel: <strong>{o.memberCount} members</strong></span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Operational</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Creating Organization */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100
        }}>
          <div className="card" style={{ width: '480px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Register Organization</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                required
                placeholder="Organization Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                required
                placeholder="Code (e.g. DMC-LK, SLRC)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Government">Government Ministry / Department</option>
                <option value="NGO">Non-Governmental Organization (NGO)</option>
                <option value="International">International Agency (UN / WHO)</option>
                <option value="VolunteerGroup">Community Relief Coalition</option>
              </select>
              <input
                type="email"
                required
                placeholder="Contact Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="text"
                required
                placeholder="Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="text"
                required
                placeholder="Headquarters Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--color-blue-primary)', color: '#fff', padding: '8px 16px' }}
                >
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
