import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Gift, ShieldCheck, HeartHandshake, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DonationAndVolunteerOfficerDashboardContent } from './DonationAndVolunteerOfficerDashboardContent';

export const DonorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-green">
            <Gift size={13} /> Humanitarian Aid Portal
          </span>
          <span className="badge badge-blue">
            <ShieldCheck size={13} /> {user?.role === 'DonorAndVolunteer' ? 'Donor & Volunteer' : 'Verified Donor'}
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
          Humanitarian Donor Portal
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Welcome, <strong>{user?.fullName || 'Donor'}</strong>! Thank you for supporting disaster relief.
          Submit financial donations, pledge emergency relief goods, and track your aid contributions.
        </p>

        {/* Quick Action Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
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
            <BookOpen size={15} /> Active Relief Campaigns
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
            <HeartHandshake size={15} /> Emergency Shelters
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

      {/* Embedded Donation Operations Content */}
      <DonationAndVolunteerOfficerDashboardContent
        currentUserEmail={user?.email}
        currentUserName={user?.fullName}
      />
    </div>
  );
};
