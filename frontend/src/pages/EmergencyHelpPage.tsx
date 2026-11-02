import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Send, CheckCircle2, ArrowLeft } from 'lucide-react';

export const EmergencyHelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('Rescue / Evacuation');
  const [urgency, setUrgency] = useState('Critical - Immediate Danger');
  const [location, setLocation] = useState('Kandyya, Central Province, Sri Lanka');
  const [description, setDescription] = useState('Flood waters rising rapidly. 4 adults and 2 children stranded on rooftop.');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '640px', width: '100%' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'transparent',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 30px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '10px' }}>
              Emergency SOS Dispatched
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              Your distress signal has been prioritized by the ResQnet AI Gateway and escalated to the National Disaster Management Centre (DMC-LK) rescue dispatch queue.
            </p>
            <div style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              <div><strong>Reference Ticket:</strong> #SOS-2026-9941</div>
              <div><strong>Operational Area:</strong> {location}</div>
              <div><strong>Emergency Status:</strong> Triaged - Responder Team En Route</div>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              style={{ backgroundColor: 'var(--color-blue-primary)', color: '#fff', padding: '12px 24px' }}
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'grid',
                placeItems: 'center'
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                  Immediate Humanitarian Distress Call
                </h2>
                <p style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, margin: '2px 0 0' }}>
                  Public Direct SOS Channel (No Credentials Required)
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Aid Category
                </label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Rescue / Evacuation">Rescue / Evacuation</option>
                  <option value="Emergency Medical Assistance">Emergency Medical Assistance</option>
                  <option value="Drinking Water & Food Relief">Drinking Water & Food Relief</option>
                  <option value="Temporary Shelter Placement">Temporary Shelter Placement</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Perceived Urgency
                </label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  <option value="Critical - Immediate Danger">Critical - Immediate Danger (Life-threatening)</option>
                  <option value="High - Assistance Needed within 6 Hours">High - Assistance Needed within 6 Hours</option>
                  <option value="Medium - Supplies Needed within 24 Hours">Medium - Supplies Needed within 24 Hours</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Exact Location / Landmarks
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ paddingLeft: '34px' }}
                  />
                  <MapPin size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Distress Description & Number of Affected Persons
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  marginTop: '8px'
                }}
              >
                <Send size={16} /> Broadcast Emergency Distress Request
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
