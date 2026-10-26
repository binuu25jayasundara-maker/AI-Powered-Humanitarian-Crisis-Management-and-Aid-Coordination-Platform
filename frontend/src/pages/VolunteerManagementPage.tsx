import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Volunteer, TaskMatchingRecommendation } from '../types';
import { UserCheck, Calendar, Plus, CheckCircle2, MapPin, X } from 'lucide-react';

export const VolunteerManagementPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [recommendation, setRecommendation] = useState<TaskMatchingRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAssigned, setIsAssigned] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [volData, recData] = await Promise.all([
        api.getVolunteers(),
        api.getTaskMatchingRecommendation()
      ]);
      setVolunteers(volData);
      setRecommendation(recData);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!recommendation) return;
    try {
      await api.assignVolunteerToTask(recommendation.taskId, recommendation.candidateVolunteerId);
      setIsAssigned(true);
      setToastMessage(
        `Success: ${recommendation.candidateName} assigned to '${recommendation.taskTitle}'. Automated SMS and Email dispatched via Observer pattern!`
      );
      setTimeout(() => setToastMessage(null), 6000);
      await loadData();
    } catch {
      alert('Failed to assign volunteer');
    }
  };

  const handleRegisterVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerVolunteer({
        fullName,
        email,
        phoneNumber,
        skills
      });
      setShowModal(false);
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setSkills('');
      setToastMessage('Volunteer successfully registered and added to roster!');
      setTimeout(() => setToastMessage(null), 4000);
      await loadData();
    } catch {
      alert('Failed to register volunteer');
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '14px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Volunteer Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Assign roles, track deployment, and review volunteer availability
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            padding: '11px 20px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(29, 78, 216, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>Register Volunteer</span>
        </button>
      </div>

      {/* Task Match Recommendation Card (Screenshot 9 exact match) */}
      {recommendation && (
        <div className="card" style={{
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderLeft: '5px solid #1d4ed8',
          marginBottom: '28px',
          padding: '24px 28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#1d4ed8', letterSpacing: '0.04em' }}>
                  AI Task Recommendation
                </span>
                <span className="badge badge-blue">
                  {recommendation.category}
                </span>
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                Task: {recommendation.taskTitle}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                <MapPin size={15} />
                <span>{recommendation.location}</span>
              </div>
            </div>

            {/* Match Score Indicator */}
            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>
                  {recommendation.matchScorePercent}%
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                  Match Score
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${recommendation.matchScorePercent}%`,
                  height: '100%',
                  backgroundColor: '#16a34a',
                  borderRadius: '999px'
                }} />
              </div>
            </div>
          </div>

          {/* Candidate Profile Box & Assign Button */}
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '16px'
              }}>
                RD
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {recommendation.candidateName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Skills: <strong style={{ color: '#334155' }}>{recommendation.candidateSkills}</strong> • {recommendation.candidatePhone}
                </div>
              </div>
            </div>

            <button
              onClick={handleAssign}
              disabled={isAssigned}
              style={{
                backgroundColor: isAssigned ? '#10b981' : '#1d4ed8',
                color: '#ffffff',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isAssigned ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Assigned</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Assign Volunteer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Weekly Availability Schedule Matrix (Screenshot 9) */}
      <div className="card" style={{ marginBottom: '28px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <Calendar size={20} color="#1d4ed8" />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            Weekly Availability Schedule
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px'
        }}>
          {daysOfWeek.map((day) => {
            const availableVols = volunteers.filter(v => v.weeklyAvailability?.includes(day));
            return (
              <div key={day} style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1d4ed8',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '8px',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {availableVols.length > 0 ? (
                    availableVols.map(v => (
                      <div key={v.id} style={{
                        backgroundColor: '#dcfce7',
                        border: '1px solid #86efac',
                        color: '#166534',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textAlign: 'center'
                      }}>
                        {v.fullName}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                      No volunteers
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registered Volunteers Table (Screenshot 9) */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Volunteers Roster
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Active and standby field volunteers registered in ResQnet.AI
            </p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Volunteer Name</th>
              <th style={{ padding: '12px 14px' }}>Contact</th>
              <th style={{ padding: '12px 14px' }}>Skills</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Total Hours</th>
              <th style={{ padding: '12px 14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {v.fullName}
                </td>
                <td style={{ padding: '14px', color: '#475569' }}>
                  <div>{v.phoneNumber}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{v.email}</div>
                </td>
                <td style={{ padding: '14px', color: '#334155' }}>
                  {v.skills}
                </td>
                <td style={{ padding: '14px' }}>
                  {v.status === 'Available' ? (
                    <span className="badge badge-green">Available</span>
                  ) : v.status === 'On Task' ? (
                    <span className="badge badge-blue">On Task</span>
                  ) : (
                    <span className="badge badge-amber">On Leave</span>
                  )}
                </td>
                <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {v.totalHours} hrs
                </td>
                <td style={{ padding: '14px' }}>
                  <button style={{
                    backgroundColor: '#f1f5f9',
                    color: '#1d4ed8',
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '6px'
                  }}>
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Register Volunteer */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '480px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Register Volunteer</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleRegisterVolunteer}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. S. Jayawardena"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="volunteer@resqnet.org"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+94 77 000 0000"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Skills & Qualifications *
                </label>
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. First aid, Logistics, Water Rescue"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '10px 18px',
                    borderRadius: '8px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#1d4ed8',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 700
                  }}
                >
                  Register Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
