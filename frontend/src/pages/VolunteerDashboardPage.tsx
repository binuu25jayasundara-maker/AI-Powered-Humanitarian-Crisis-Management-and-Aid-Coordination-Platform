import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, ShieldCheck, HeartHandshake, MessageSquare, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DonationAndVolunteerOfficerDashboardContent } from './DonationAndVolunteerOfficerDashboardContent';

export const VolunteerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-blue">
            <Users size={13} /> Volunteer Emergency Response
          </span>
          <span className="badge badge-green">
            <ShieldCheck size={13} /> Active Volunteer
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Volunteer Operations Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.fullName || 'Volunteer'}</strong>!
          Register your specialized emergency response skills, choose preferred mobilization areas, and review your assigned shift schedules.
        </p>

        {/* Quick Action Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/volunteers')}
            style={{
              backgroundColor: '#0866C6',
              color: '#FFFFFF',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HeartHandshake size={15} /> Volunteer Roster &amp; Tasks
          </button>
          <button
            type="button"
            onClick={() => navigate('/communications')}
            style={{
              backgroundColor: '#7c3aed',
              color: '#FFFFFF',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MessageSquare size={15} /> Communication Center
          </button>
          <button
            type="button"
            onClick={() => navigate('/citizen/shelters')}
            style={{
              backgroundColor: '#0d9488',
              color: '#FFFFFF',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={15} /> Relief Shelters
          </button>
          <button
            type="button"
            onClick={() => navigate('/emergency-help')}
            style={{
              backgroundColor: 'var(--color-red-danger)',
              color: '#FFFFFF',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertTriangle size={15} /> Urgent Distress SOS
          </button>
        </div>
      </div>

      {/* Embedded Volunteering Operations Content */}
      <DonationAndVolunteerOfficerDashboardContent
        currentUserEmail={user?.email}
        currentUserName={user?.fullName}
      />
    </div>
  );
};
