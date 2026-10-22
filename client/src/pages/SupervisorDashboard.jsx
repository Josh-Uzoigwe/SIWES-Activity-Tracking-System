import React, { useState, useEffect, useContext } from 'react';
import api, { API_SERVER_URL } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  FileText, 
  Calendar, 
  Plus, 
  Clock, 
  Download, 
  ExternalLink,
  Paperclip,
  Building,
  Check,
  AlertCircle
} from 'lucide-react';

const SupervisorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'visits', 'students'
  const [logs, setLogs] = useState([]);
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'

  // Review modal
  const [reviewModal, setReviewModal] = useState({ show: false, log: null });
  const [feedback, setFeedback] = useState({ status: 'approved', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Visit scheduling modal
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({ placement_id: '', scheduled_date: '', notes: '' });

  const [message, setMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, visitsRes, studentsRes] = await Promise.all([
        api.get('/logs'),
        api.get('/visits'),
        api.get('/students').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (visitsRes.data.success) setVisits(visitsRes.data.data);
      if (studentsRes.data?.success) setStudents(studentsRes.data.data);
    } catch (error) {
      console.error('Error fetching supervisor data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReviewModal = (log) => {
    setReviewModal({ show: true, log });
    setFeedback({
      status: 'approved',
      comment: log.supervisor_comment || ''
    });
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      const logId = reviewModal.log.activity_id;

      if (user.role === 'INDUSTRY') {
        // Industry supervisor endorses the log
        await api.put(`/logs/${logId}/endorse`);
        setMessage({ text: 'Log endorsed successfully to confirm workplace activity!', type: 'success' });
      } else {
        // School supervisor reviews with status & comment
        await api.put(`/logs/${logId}/review`, {
          status: feedback.status,
          supervisor_comment: feedback.comment
        });
        setMessage({ text: `Log marked as ${feedback.status}! Student notified.`, type: 'success' });
      }

      setReviewModal({ show: false, log: null });
      loadData();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to review log', type: 'error' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visits', {
        placement_id: parseInt(visitForm.placement_id, 10),
        scheduled_date: visitForm.scheduled_date,
        notes: visitForm.notes
      });
      setMessage({ text: 'Supervisory visit scheduled! Student has been notified via email and in-app.', type: 'success' });
      setShowVisitModal(false);
      setVisitForm({ placement_id: '', scheduled_date: '', notes: '' });
      loadData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to schedule visit', type: 'error' });
    }
  };

  const handleCompleteVisit = async (visitId) => {
    try {
      await api.put(`/visits/${visitId}`, { status: 'completed' });
      setMessage({ text: 'Visit marked as completed!', type: 'success' });
      loadData();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update visit', type: 'error' });
    }
  };

  const isIndustry = user.role === 'INDUSTRY';

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSearch = 
      log.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.student?.matric_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.skills_acquired?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = logs.filter(l => l.status === 'pending').length;
  const approvedCount = logs.filter(l => l.status === 'approved').length;

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh', color: 'var(--text-muted)' }}>Loading supervisor records...</div>;
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ backgroundColor: 'var(--primary)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              {isIndustry ? 'INDUSTRY WORKPLACE SUPERVISOR' : 'SCHOOL ACADEMIC SUPERVISOR'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isIndustry ? user.company || 'Host Company' : user.institution || 'Academic Institution'}
            </span>
          </div>
          <h2>{isIndustry ? 'Industry Workplace Dashboard' : 'Academic Supervisor Dashboard'}</h2>
          <p>{isIndustry ? 'Endorse student attendance and workplace training entries' : 'Review student logbooks, provide academic feedback, and schedule physical inspection visits'}</p>
        </div>

        {!isIndustry && (
          <button className="btn-primary" onClick={() => setShowVisitModal(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Schedule Supervisory Visit
          </button>
        )}
      </div>

      {/* Messages */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: message.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
          color: message.type === 'success' ? 'var(--success-text)' : 'var(--error-text)',
          border: `1px solid ${message.type === 'success' ? 'var(--success-border)' : 'var(--error-border)'}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem'
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Pending Reviews</span>
            <Clock size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#b45309' }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require supervisor action</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Approved / Endorsed</span>
            <CheckCircle size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#15803d' }}>
            {approvedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successfully validated</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Assigned Trainees</span>
            <Building size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {students.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Students under your supervision</span>
        </div>

        {!isIndustry && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Supervisory Visits</span>
              <Calendar size={18} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {visits.length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled inspection visits</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', gap: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'logs' ? 600 : 500,
            color: activeTab === 'logs' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'logs' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Activity Logs Review ({logs.length})
        </button>

        {!isIndustry && (
          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 0',
              fontSize: '0.925rem',
              fontWeight: activeTab === 'visits' ? 600 : 500,
              color: activeTab === 'visits' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'visits' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Visit Scheduling ({visits.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'students' ? 600 : 500,
            color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'students' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Assigned Students ({students.length})
        </button>
      </div>

      {/* TAB 1: Activity Logs Review */}
      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Filter & Search Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search student or activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
              {['all', 'pending', 'approved', 'rejected'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className="btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                    backgroundColor: statusFilter === st ? 'var(--primary)' : 'transparent',
                    color: statusFilter === st ? '#ffffff' : 'var(--text-main)',
                    borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border-subtle)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Student</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Log Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Description & Skills</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Evidence</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No activity logs found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.activity_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {log.student?.full_name || `Student #${log.student_id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {log.student?.matric_no}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                        {new Date(log.log_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 18px', maxWidth: '320px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '4px', lineHeight: 1.4 }}>
                          {log.description}
                        </div>
                        {log.skills_acquired && (
                          <span style={{ fontSize: '0.725rem', backgroundColor: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                            {log.skills_acquired}
                          </span>
                        )}
                        {log.supervisor_comment && (
                          <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Comment: "{log.supervisor_comment}"
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {log.evidence_url ? (
                          <a
                            href={`${API_SERVER_URL}${log.evidence_url}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-main)', textDecoration: 'underline' }}
                          >
                            <Paperclip size={13} /> View File <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${log.status}`}>{log.status}</span>
                        {log.industry_endorsed && (
                          <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: '4px', fontWeight: 500 }}>
                            ✓ Endorsed
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {isIndustry ? (
                          !log.industry_endorsed ? (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#15803d', borderColor: '#15803d' }}
                              onClick={() => openReviewModal(log)}
                            >
                              Endorse Log
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Endorsed</span>
                          )
                        ) : (
                          <button
                            id="review-log-btn"
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => openReviewModal(log)}
                          >
                            {log.status === 'pending' ? 'Review Log' : 'Update Review'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Visit Scheduling (School Supervisor only) */}
      {!isIndustry && activeTab === 'visits' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Scheduled Supervisory Visits ({visits.length})
            </h3>
            <button className="btn-primary" style={{ fontSize: '0.825rem', padding: '6px 12px' }} onClick={() => setShowVisitModal(true)}>
              <Plus size={15} style={{ marginRight: '4px' }} /> Schedule Visit
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Scheduled Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Placement ID</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Visit Notes & Purpose</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No supervisory visits scheduled yet. Click "Schedule Visit" to plan a physical workplace check.
                    </td>
                  </tr>
                ) : (
                  visits.map(v => (
                    <tr key={v.visit_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-main)' }}>
                        {new Date(v.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        Placement #{v.placement_id}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                        {v.notes || 'Routine physical SIWES evaluation and logbook audit'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${v.status === 'completed' ? 'approved' : 'pending'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {v.status === 'scheduled' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.775rem' }}
                            onClick={() => handleCompleteVisit(v.visit_id)}
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Assigned Students */}
      {activeTab === 'students' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Student</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Department</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Company Placement</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Logbook Activity</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Official Logbook</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students currently assigned to your supervisor account.
                    </td>
                  </tr>
                ) : (
                  students.map(s => {
                    const placement = s.placements?.[0];
                    const logsCount = s.activity_logs?.length || 0;
                    const approvedCount = s.activity_logs?.filter(l => l.status === 'approved').length || 0;

                    return (
                      <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.matric_no} • {s.email}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div>{s.department}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.year_of_study}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{placement?.company_name || 'Host Company'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{placement?.address || 'Address on file'}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{approvedCount} / {logsCount}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>logs validated</span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <a
                            href={`${API_SERVER_URL}/api/v1/reports/export/logbook/${s.student_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <Download size={14} /> PDF Logbook
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModal.show && reviewModal.log && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>{isIndustry ? 'Endorse Workplace Activity' : 'Academic Supervisor Review'}</h3>
                <p style={{ fontSize: '0.85rem' }}>Student: <strong>{reviewModal.log.student?.full_name}</strong></p>
              </div>
              <button type="button" onClick={() => setReviewModal({ show: false, log: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--surface-hover)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                Date: {new Date(reviewModal.log.log_date).toLocaleDateString()}
              </div>
              <p style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>{reviewModal.log.description}</p>
            </div>

            <form onSubmit={handleReview}>
              {!isIndustry ? (
                <>
                  <div className="input-group">
                    <label>Evaluation Decision *</label>
                    <select
                      className="select-field"
                      value={feedback.status}
                      onChange={(e) => setFeedback({ ...feedback, status: e.target.value })}
                    >
                      <option value="approved">Approve Activity Entry</option>
                      <option value="rejected">Reject & Request Correction</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Academic Supervisor Comment / Feedback *</label>
                    <textarea
                      id="review-comment-textarea"
                      required
                      className="input-field"
                      rows={3}
                      placeholder="Enter specific feedback, corrections, or praise for the student..."
                      value={feedback.comment}
                      onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '20px', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  By clicking <strong>Confirm Endorsement</strong>, you officially verify as the Industry Workplace Supervisor that the student completed this assigned engineering/business task at your organization.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setReviewModal({ show: false, log: null })}>
                  Cancel
                </button>
                <button id="submit-review-modal-btn" type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : isIndustry ? 'Confirm Endorsement' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE VISIT MODAL */}
      {showVisitModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Schedule Supervisory Visit</h3>
              <button type="button" onClick={() => setShowVisitModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleScheduleVisit}>
              <div className="input-group">
                <label>Select Student / Placement *</label>
                <select
                  required
                  className="select-field"
                  value={visitForm.placement_id}
                  onChange={(e) => setVisitForm({ ...visitForm, placement_id: e.target.value })}
                >
                  <option value="">-- Choose Assigned Student --</option>
                  {students.map(s => {
                    const pl = s.placements?.[0];
                    if (!pl) return null;
                    return (
                      <option key={pl.placement_id} value={pl.placement_id}>
                        {s.full_name} ({s.matric_no}) — {pl.company_name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="input-group">
                <label>Proposed Visit Date *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={visitForm.scheduled_date}
                  onChange={(e) => setVisitForm({ ...visitForm, scheduled_date: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Inspection Notes / Purpose</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="e.g. Mid-term physical inspection, verification of logbook entries, interview with company supervisor..."
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowVisitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;
