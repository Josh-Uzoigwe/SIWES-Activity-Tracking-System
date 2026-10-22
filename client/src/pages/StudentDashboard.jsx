import React, { useState, useEffect, useContext } from 'react';
import api, { API_SERVER_URL } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  Upload, 
  Download, 
  ShieldCheck, 
  RotateCcw, 
  Paperclip, 
  ExternalLink,
  Award,
  AlertCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [finalReport, setFinalReport] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [studentProfile, setStudentProfile] = useState(user);
  const [loading, setLoading] = useState(true);

  // New Log Modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [resubmitLogId, setResubmitLogId] = useState(null);
  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    description: '',
    skills_acquired: '',
    evidence_url: ''
  });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Final Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, reportRes, placementRes, meRes] = await Promise.all([
        api.get('/logs').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/final/me').catch(() => ({ data: { success: false, data: null } })),
        api.get(`/placements/${user.id}`).catch(() => ({ data: { success: false, data: null } })),
        api.get('/auth/me').catch(() => ({ data: { success: false, data: null } }))
      ]);

      if (logsRes.data?.success) setLogs(logsRes.data.data);
      if (reportRes.data?.success) setFinalReport(reportRes.data.data);
      if (placementRes.data?.success) setPlacement(placementRes.data.data);
      if (meRes.data?.success) setStudentProfile(meRes.data.data);
    } catch (err) {
      console.error('Error fetching student data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewLogModal = (originalLog = null) => {
    if (originalLog) {
      setResubmitLogId(originalLog.activity_id);
      setLogForm({
        log_date: originalLog.log_date ? originalLog.log_date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: originalLog.description || '',
        skills_acquired: originalLog.skills_acquired || '',
        evidence_url: originalLog.evidence_url || ''
      });
    } else {
      setResubmitLogId(null);
      setLogForm({
        log_date: new Date().toISOString().split('T')[0],
        description: '',
        skills_acquired: '',
        evidence_url: ''
      });
    }
    setEvidenceFile(null);
    setShowLogModal(true);
  };

  const handleUploadEvidence = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEvidenceFile(file);

    try {
      setUploadingEvidence(true);
      const formData = new FormData();
      formData.append('evidence', file);
      const res = await api.post('/logs/upload-evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setLogForm(prev => ({ ...prev, evidence_url: res.data.file_url }));
      }
    } catch (err) {
      alert('Failed to upload evidence file. Only PDF, Word documents, and images are allowed.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...logForm,
        original_log_id: resubmitLogId || undefined
      };

      await api.post('/logs', payload);
      setMessage({
        text: resubmitLogId ? 'Log revision resubmitted successfully!' : 'Daily activity log submitted successfully!',
        type: 'success'
      });
      setShowLogModal(false);
      loadData();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to submit log entry',
        type: 'error'
      });
    }
  };

  const handleReportUpload = async (e) => {
    e.preventDefault();
    if (!reportFile) return;

    try {
      setUploadingReport(true);
      const formData = new FormData();
      formData.append('report', reportFile);
      const res = await api.post('/reports/final', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setMessage({ text: 'Final SIWES Technical Report submitted successfully!', type: 'success' });
        setShowReportModal(false);
        loadData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to upload report', type: 'error' });
    } finally {
      setUploadingReport(false);
    }
  };

  const downloadMyLogbook = async () => {
    try {
      const response = await api.get(`/reports/export/logbook/${user.id}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SIWES_Logbook_${user.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export logbook PDF');
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh', color: 'var(--text-muted)' }}>Loading logbook entries...</div>;
  }

  // Progress metrics calculation
  const totalLogs = logs.length;
  const approvedLogs = logs.filter(l => l.status === 'approved').length;
  const pendingLogs = logs.filter(l => l.status === 'pending').length;
  const rejectedLogs = logs.filter(l => l.status === 'rejected').length;

  // Calculate working days (Mon-Fri) from Placement dates set by Coordinator
  const calculateWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;
    let count = 0;
    let cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : null;
  };

  const computedWorkingDays = calculateWorkingDays(placement?.start_date, placement?.end_date);
  const targetDays = computedWorkingDays || 60; // Defaults to standard 12-week SIWES (60 working days)
  const progressPercentage = Math.min(100, Math.round((approvedLogs / targetDays) * 100));

  const currentStatus = studentProfile?.status || user?.status || 'cleared';
  const isPendingClearance = currentStatus === 'pending_clearance';
  const isRejected = currentStatus === 'rejected';

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>My SIWES Activity Logbook</h2>
          <p>
            {placement ? `${placement.company_name} — Industrial Attachment` : 'Submit and track daily verified workplace activities'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={downloadMyLogbook}>
            <Download size={16} style={{ marginRight: '6px' }} /> Download Logbook (PDF)
          </button>
          <button 
            className="btn-primary" 
            disabled={isPendingClearance || isRejected}
            onClick={() => {
              if (isPendingClearance) {
                setMessage({ text: 'Institutional clearance required: Please wait for your Coordinator to approve your SIWES clearance before submitting activity logs.', type: 'error' });
                return;
              }
              openNewLogModal();
            }}
            title={isPendingClearance ? 'Awaiting Coordinator Clearance' : 'New Entry'}
          >
            <Plus size={16} style={{ marginRight: '6px' }} /> New Entry
          </button>
        </div>
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

      {/* Institutional Clearance Status Banner */}
      {isPendingClearance && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          borderLeft: '4px solid #b45309',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <Clock size={22} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
              Institutional SIWES Clearance Pending Review
            </div>
            <div style={{ fontSize: '0.875rem', color: '#b45309', lineHeight: 1.5 }}>
              Your student registration is awaiting approval by your university SIWES Coordinator at <strong>{studentProfile?.institution || user?.institution || 'your institution'}</strong>. 
              Once your matriculation details are vetted, your daily activity log submission will be enabled.
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          borderLeft: '4px solid #b91c1c',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle size={22} color="#b91c1c" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>
              SIWES Clearance Flagged
            </div>
            <div style={{ fontSize: '0.875rem', color: '#b91c1c', lineHeight: 1.5 }}>
              Your institutional SIWES Coordinator has flagged your registration profile. Please consult your university SIWES Directorate or Coordinator to clear your status.
            </div>
          </div>
        </div>
      )}

      {/* SIWES Progress Bar & KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Completion</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>{progressPercentage}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({approvedLogs}/{targetDays} days)</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-hover)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: '#15803d', borderRadius: '3px', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {computedWorkingDays 
              ? `Duration: ${computedWorkingDays} working days assigned by Coordinator`
              : 'Standard SIWES: 60 working days (12 weeks)'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Approved Entries</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#15803d' }}>{approvedLogs}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign-off completed</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Pending Review</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#b45309' }}>{pendingLogs}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting supervisor</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Rejected / Revisions</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: rejectedLogs > 0 ? '#b91c1c' : 'var(--text-main)' }}>{rejectedLogs}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requires resubmission</span>
        </div>
      </div>

      {/* Placement & Final Report Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Placement Info */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} /> Workplace Placement Details
          </h3>
          {placement ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
              <div><strong>Host Firm:</strong> {placement.company_name}</div>
              <div><strong>Location:</strong> {placement.address}</div>
              <div><strong>Duration:</strong> {new Date(placement.start_date).toLocaleDateString()} to {new Date(placement.end_date).toLocaleDateString()}</div>
              <div><strong>School Supervisor:</strong> {placement.school_supervisor?.full_name || 'Pending assignment'}</div>
              <div><strong>Industry Supervisor:</strong> {placement.industry_supervisor?.full_name || 'Pending assignment'}</div>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem' }}>No company placement assigned yet. Please contact your SIWES Coordinator.</p>
          )}
        </div>

        {/* Final Report Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} /> Final Technical Report & ITF Stipend
            </h3>
            {finalReport?.stipend_verified ? (
              <span className="badge approved" style={{ fontSize: '0.75rem' }}>Stipend Approved</span>
            ) : finalReport ? (
              <span className="badge pending" style={{ fontSize: '0.75rem' }}>Under ITF Review</span>
            ) : (
              <span className="badge pending" style={{ fontSize: '0.75rem' }}>Not Submitted</span>
            )}
          </div>

          {finalReport ? (
            <div style={{ fontSize: '0.85rem' }}>
              <p style={{ marginBottom: '8px' }}>
                Uploaded on <strong>{new Date(finalReport.submitted_at).toLocaleDateString()}</strong>.
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                <a
                  href={`${API_SERVER_URL}${finalReport.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                  style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <FileText size={15} /> View Uploaded Document <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                Upload your completed SIWES technical report (PDF or Word) to qualify for official ITF stipend payment.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.825rem', padding: '6px 14px', gap: '6px' }}
                onClick={() => setShowReportModal(true)}
              >
                <Upload size={14} /> Upload Final Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logbook Entries Listing */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Activity Logbook Entries ({logs.length})</h3>
        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Entries are timestamped and locked against backdating per NUC/NBTE regulations.
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h3>No entries submitted yet</h3>
          <p style={{ marginBottom: '20px' }}>Record your daily engineering, business, or operational tasks to build your logbook.</p>
          <button className="btn-primary" onClick={() => openNewLogModal()}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Submit First Entry
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {logs.map(log => (
            <div key={log.activity_id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Calendar size={15} />
                  <span>{new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <span className={`badge ${log.status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {log.status === 'approved' && <CheckCircle size={12} />}
                  {log.status === 'pending' && <Clock size={12} />}
                  {log.status === 'rejected' && <XCircle size={12} />}
                  {log.status}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '0.925rem', marginBottom: '4px', color: 'var(--text-main)' }}>Task & Activity Description</h4>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-main)' }}>{log.description}</p>
              </div>

              {log.skills_acquired && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Skills & Knowledge Acquired</h4>
                  <div style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    {log.skills_acquired}
                  </div>
                </div>
              )}

              {/* Attached Evidence */}
              {log.evidence_url && (
                <div style={{ marginTop: '4px' }}>
                  <a
                    href={`${API_SERVER_URL}${log.evidence_url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-main)', textDecoration: 'underline' }}
                  >
                    <Paperclip size={13} /> Attached Evidence Document/Photo <ExternalLink size={11} />
                  </a>
                </div>
              )}

              {/* Endorsements & Supervisor Feedback */}
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {log.industry_endorsed && (
                  <div style={{ fontSize: '0.75rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <CheckCircle size={13} /> Industry Supervisor Endorsement Confirmed
                  </div>
                )}

                {log.supervisor_comment && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Academic Supervisor Comment:</span>
                    <p style={{ fontSize: '0.825rem', fontStyle: 'italic', marginTop: '2px', color: 'var(--text-main)' }}>"{log.supervisor_comment}"</p>
                  </div>
                )}

                {/* If rejected, allow resubmission */}
                {log.status === 'rejected' && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ width: '100%', fontSize: '0.8rem', padding: '6px', gap: '6px', borderColor: 'var(--error-border)', color: 'var(--error-text)' }}
                      onClick={() => openNewLogModal(log)}
                    >
                      <RotateCcw size={14} /> Resubmit Corrected Revision
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Submit Activity Log */}
      {showLogModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>{resubmitLogId ? 'Resubmit Corrected Log' : 'Daily SIWES Activity Entry'}</h3>
                <p style={{ fontSize: '0.8rem' }}>Server-enforced timestamping prevents backdating beyond 3 days.</p>
              </div>
              <button type="button" onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit}>
              <div className="input-group">
                <label>Log Activity Date *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={logForm.log_date}
                  onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Detailed Activity Description *</label>
                <textarea
                  required
                  className="input-field"
                  rows={4}
                  placeholder="Describe tools used, engineering tasks undertaken, software developed, or operational challenges resolved today..."
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Skills & Competencies Acquired (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. PLC programming, Soldering, React.js, Quality Assurance"
                  value={logForm.skills_acquired}
                  onChange={(e) => setLogForm({ ...logForm, skills_acquired: e.target.value })}
                />
              </div>

              {/* Evidence Upload */}
              <div className="input-group">
                <label>Supporting Evidence (Document or Photo)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleUploadEvidence}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {uploadingEvidence && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploading...</span>}
                </div>
                {logForm.evidence_url && (
                  <span style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '4px' }}>
                    ✓ Evidence attached successfully!
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={uploadingEvidence}>
                  {resubmitLogId ? 'Resubmit Entry' : 'Submit Activity Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Final Report Upload */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Upload Final SIWES Report</h3>
              <button type="button" onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleReportUpload}>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                Upload your comprehensive technical report (PDF or Word document, max 10MB). Upon submission, it will be transmitted to the Industrial Training Fund (ITF) for stipend clearance.
              </p>

              <div className="input-group">
                <label>Select Report File *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setReportFile(e.target.files[0])}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={uploadingReport || !reportFile}>
                  {uploadingReport ? 'Uploading...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
