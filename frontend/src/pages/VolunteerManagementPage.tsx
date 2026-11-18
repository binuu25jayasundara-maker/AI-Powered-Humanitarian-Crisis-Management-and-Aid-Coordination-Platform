import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Volunteer, TaskMatchingRecommendation } from '../types';
import { Plus, CheckCircle2, MapPin, X } from 'lucide-react';

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

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#EDF6FF', minHeight: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: '#E8F9F2',
          border: '1px solid #12A86B',
          color: '#0D9665',
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <CheckCircle2 size={18} color="#12A86B" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              backgroundColor: '#0866C6',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              9
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#526784', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Volunteer Management
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#102B5C', letterSpacing: '-0.02em', margin: 0 }}>
            Volunteer Operations &amp; Task Allocation
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#12A86B',
            color: '#ffffff',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(18, 168, 107, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>Register</span>
        </button>
      </div>

      {/* Main Grid: Left Volunteers Table + Right Task Match (Exact Screenshot 9) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Volunteers List Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D5E4F3',
          padding: '24px 28px',
          boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#102B5C', margin: 0 }}>
              Volunteers
            </h3>
            <span
              onClick={() => setShowModal(true)}
              style={{ fontSize: '13px', fontWeight: 700, color: '#0866C6', cursor: 'pointer' }}
            >
              + Register
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EDF6FF', color: '#526784', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Skills</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #EDF6FF', fontSize: '13px' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600, color: '#102B5C' }}>Nimal P.</td>
                <td style={{ padding: '12px 10px', color: '#526784' }}>First aid, driving</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    backgroundColor: '#12A86B',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    Available
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #EDF6FF', fontSize: '13px' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600, color: '#102B5C' }}>Kavya S.</td>
                <td style={{ padding: '12px 10px', color: '#526784' }}>Translation</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    backgroundColor: '#0866C6',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    On Task
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #EDF6FF', fontSize: '13px' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600, color: '#102B5C' }}>Ruwan D.</td>
                <td style={{ padding: '12px 10px', color: '#526784' }}>Logistics</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    backgroundColor: '#12A86B',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    Available
                  </span>
                </td>
              </tr>
              <tr style={{ fontSize: '13px' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600, color: '#102B5C' }}>Amal T.</td>
                <td style={{ padding: '12px 10px', color: '#526784' }}>Medical</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    backgroundColor: '#FFB51B',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    On Leave
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right: Task Match Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D5E4F3',
          padding: '24px 28px',
          boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#102B5C' }}>Task match</span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 700, color: '#102B5C' }}>
              Distribute meals - Rivagama
            </div>
            <div style={{ fontSize: '13px', color: '#526784', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Seek: Ruwan D.</span>
              <span style={{
                backgroundColor: '#12A86B',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                67%
              </span>
            </div>

            {/* Match progress bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#EDF6FF',
              borderRadius: '9999px',
              overflow: 'hidden',
              margin: '18px 0 24px'
            }}>
              <div style={{
                width: '67%',
                height: '100%',
                backgroundColor: '#12A86B',
                borderRadius: '9999px'
              }} />
            </div>
          </div>

          <button
            onClick={handleAssign}
            disabled={isAssigned}
            style={{
              backgroundColor: isAssigned ? '#0D9665' : '#12A86B',
              color: '#ffffff',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: isAssigned ? 'default' : 'pointer',
              width: '100%',
              boxShadow: '0 4px 10px rgba(18, 168, 107, 0.25)'
            }}
          >
            {isAssigned ? 'Assigned' : 'Assign'}
          </button>
        </div>
      </div>

      {/* Availability This Week Chart (Exact Screenshot 9) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #D5E4F3',
        padding: '24px 28px',
        boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#102B5C', margin: '0 0 18px' }}>
          Availability this week
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px',
          alignItems: 'end',
          minHeight: '70px',
          paddingBottom: '8px'
        }}>
          {[
            { day: 'M', height: '24px', offset: false },
            { day: 'T', height: '36px', offset: true },
            { day: 'W', height: '20px', offset: false },
            { day: 'T', height: '42px', offset: true },
            { day: 'F', height: '24px', offset: false },
            { day: 'S', height: '16px', offset: false },
            { day: 'S', height: '18px', offset: false }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#102B5C' }}>{item.day}</span>
              <div style={{
                width: '100%',
                height: item.height,
                backgroundColor: '#12A86B',
                borderRadius: '8px',
                marginTop: item.offset ? '6px' : '0'
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Complete Volunteer Roster (Full Table for Data Preservation) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #D5E4F3',
        padding: '24px 28px',
        boxShadow: '0 2px 6px rgba(11, 59, 112, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#102B5C', margin: 0 }}>
              Full Volunteer Database
            </h3>
            <p style={{ fontSize: '13px', color: '#526784', margin: '4px 0 0' }}>
              Active and standby field volunteers registered in ResQnest.AI
            </p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #EDF6FF', color: '#526784', fontSize: '12px', textTransform: 'uppercase' }}>
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
              <tr key={v.id} style={{ borderBottom: '1px solid #EDF6FF', fontSize: '13px' }}>
                <td style={{ padding: '14px', fontWeight: 700, color: '#102B5C' }}>
                  {v.fullName}
                </td>
                <td style={{ padding: '14px', color: '#526784' }}>
                  <div>{v.phoneNumber}</div>
                  <div style={{ fontSize: '11px', color: '#526784' }}>{v.email}</div>
                </td>
                <td style={{ padding: '14px', color: '#102B5C' }}>
                  {v.skills}
                </td>
                <td style={{ padding: '14px' }}>
                  {v.status === 'Available' ? (
                    <span style={{
                      backgroundColor: '#E8F9F2',
                      color: '#0D9665',
                      border: '1px solid rgba(18,168,107,0.3)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      Available
                    </span>
                  ) : v.status === 'On Task' ? (
                    <span style={{
                      backgroundColor: '#EDF6FF',
                      color: '#0866C6',
                      border: '1px solid rgba(8,102,198,0.3)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      On Task
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#FFF8E6',
                      color: '#FFB51B',
                      border: '1px solid rgba(255,181,27,0.3)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      On Leave
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px', fontWeight: 700, color: '#102B5C' }}>
                  {v.totalHours} hrs
                </td>
                <td style={{ padding: '14px' }}>
                  <button style={{
                    backgroundColor: '#EDF6FF',
                    border: '1px solid #D5E4F3',
                    color: '#0866C6',
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
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
          backgroundColor: 'rgba(11, 59, 112, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '480px',
            padding: '28px',
            boxShadow: '0 20px 30px rgba(11, 59, 112, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#102B5C', margin: 0 }}>Register Volunteer</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#526784" />
              </button>
            </div>

            <form onSubmit={handleRegisterVolunteer}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. S. Jayawardena"
                  style={{ borderColor: '#D5E4F3' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="volunteer@resqnet.org"
                  style={{ borderColor: '#D5E4F3' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+94 77 000 0000"
                  style={{ borderColor: '#D5E4F3' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#102B5C', marginBottom: '6px' }}>
                  Skills &amp; Qualifications *
                </label>
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. First aid, Logistics, Water Rescue"
                  style={{ borderColor: '#D5E4F3' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: '#EDF6FF',
                    color: '#526784',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #D5E4F3',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#12A86B',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(18, 168, 107, 0.25)'
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
