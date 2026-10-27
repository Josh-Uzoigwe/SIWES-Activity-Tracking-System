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
  AlertCircle,
  Building,
  Landmark,
  CreditCard,
  Edit3,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { OFFICIAL_NIGERIAN_BANKS } from '../data/nigerianBanks';

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
  const [submittingLog, setSubmittingLog] = useState(false);
  const [logModalError, setLogModalError] = useState('');
  const [logSuccess, setLogSuccess] = useState(false);

  // Final Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  // Placement Self-Registration Modal state
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [submittingPlacement, setSubmittingPlacement] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    company_name: '',
    address: '',
    start_date: '',
    end_date: '',
    industry_supervisor_name: '',
    industry_supervisor_email: '',
    industry_supervisor_phone: ''
  });

  // Official Bank Details Modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [submittingBank, setSubmittingBank] = useState(false);
  const [bankModalError, setBankModalError] = useState('');
  const [placementModalError, setPlacementModalError] = useState('');
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });

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
    setLogModalError('');
    setLogSuccess(false);
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
    setLogModalError('');
    try {
      setSubmittingLog(true);
      const payload = {
        ...logForm,
        original_log_id: resubmitLogId || undefined
      };

      await api.post('/logs', payload);
      setLogSuccess(true);
      setMessage({
        text: resubmitLogId ? 'Log revision resubmitted successfully!' : 'Daily activity log submitted successfully!',
        type: 'success'
      });
      setTimeout(() => {
        setShowLogModal(false);
        setLogSuccess(false);
        loadData();
      }, 700);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit log entry';
      setLogModalError(errMsg);
      setMessage({
        text: errMsg,
        type: 'error'
      });
    } finally {
      setSubmittingLog(false);
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

  const openPlacementModal = () => {
    if (placement) {
      setPlacementForm({
        company_name: placement.company_name || '',
        address: placement.address || '',
        start_date: placement.start_date ? placement.start_date.split('T')[0] : '',
        end_date: placement.end_date ? placement.end_date.split('T')[0] : '',
        industry_supervisor_name: placement.industry_supervisor_name || placement.industry_supervisor?.full_name || '',
        industry_supervisor_email: placement.industry_supervisor_email || placement.industry_supervisor?.email || '',
        industry_supervisor_phone: placement.industry_supervisor_phone || ''
      });
    } else {
      setPlacementForm({
        company_name: '',
        address: '',
        start_date: '',
        end_date: '',
        industry_supervisor_name: '',
        industry_supervisor_email: '',
        industry_supervisor_phone: ''
      });
    }
    setPlacementModalError('');
    setShowPlacementModal(true);
  };

  const handleSavePlacement = async (e) => {
    e.preventDefault();
    setPlacementModalError('');
    try {
      setSubmittingPlacement(true);
      const res = await api.post('/placements', placementForm);
      if (res.data?.success) {
        setMessage({ text: 'Place of attachment details saved! Your coordinator can now allocate your institutional supervisor.', type: 'success' });
        setShowPlacementModal(false);
        loadData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save placement details';
      setPlacementModalError(errMsg);
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setSubmittingPlacement(false);
    }
  };

  const openBankModal = () => {
    const profile = studentProfile || user;
    setBankModalError('');
    setBankForm({
      bank_name: profile.bank_name || '',
      account_number: profile.account_number || '',
      account_name: profile.account_name || profile.full_name || user.name || ''
    });
    setShowBankModal(true);
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setBankModalError('');
    const cleanAccNo = String(bankForm.account_number).trim();
    if (!/^\d{10}$/.test(cleanAccNo)) {
      setBankModalError('Account number must be exactly 10 digits (NUBAN).');
      return;
    }
    if (!bankForm.bank_name) {
      setBankModalError('Please select your official commercial bank.');
      return;
    }
    try {
      setSubmittingBank(true);
      const res = await api.put('/students/bank-details', {
        ...bankForm,
        account_number: cleanAccNo
      });
      if (res.data?.success) {
        setMessage({ text: 'Official bank account details saved for ITF stipend disbursement!', type: 'success' });
        setShowBankModal(false);
        loadData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save bank details';
      setBankModalError(errMsg);
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setSubmittingBank(false);
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

      {/* Placement, Bank Account, & Final Report Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Workplace Placement Details */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} color="#0284c7" /> Place of Attachment
              </h3>
              {placement ? (
                <span className="badge approved" style={{ fontSize: '0.725rem' }}>Registered</span>
              ) : (
                <span className="badge pending" style={{ fontSize: '0.725rem' }}>Action Required</span>
              )}
            </div>

            {placement ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div><strong>Host Firm:</strong> {placement.company_name}</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-muted)' }}>
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{placement.address}</span>
                </div>
                <div><strong>Duration:</strong> {new Date(placement.start_date).toLocaleDateString()} – {new Date(placement.end_date).toLocaleDateString()}</div>
                
                <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Industry Supervisor (On-site):</div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {placement.industry_supervisor_name || placement.industry_supervisor?.full_name || 'Not provided'}
                    {placement.industry_supervisor_phone && ` • ${placement.industry_supervisor_phone}`}
                    {placement.industry_supervisor_email && ` • ${placement.industry_supervisor_email}`}
                  </div>
                </div>

                <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>School Supervisor (Institution):</div>
                  {placement.school_supervisor?.full_name ? (
                    <div style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <CheckCircle size={14} /> {placement.school_supervisor.full_name} ({placement.school_supervisor.department || 'Academic'})
                    </div>
                  ) : (
                    <div style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Pending allocation by Coordinator
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <p style={{ marginBottom: '10px' }}>
                  Have you secured an industrial attachment? Register your host company name, physical address, and on-site industry supervisor so your institution can assign your supervising lecturer.
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={placement ? 'btn-secondary' : 'btn-primary'}
              style={{ width: '100%', fontSize: '0.825rem', padding: '8px 14px', justifyContent: 'center' }}
              onClick={openPlacementModal}
            >
              {placement ? (
                <>
                  <Edit3 size={14} style={{ marginRight: '6px' }} /> Update Place of Attachment
                </>
              ) : (
                <>
                  <Plus size={14} style={{ marginRight: '6px' }} /> Register Place of Attachment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: ITF Stipend Bank Account Details */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={18} color="#15803d" /> ITF Stipend Bank Account
              </h3>
              {(studentProfile?.bank_name && studentProfile?.account_number) ? (
                <span className="badge approved" style={{ fontSize: '0.725rem' }}>Ready for Payment</span>
              ) : (
                <span className="badge pending" style={{ fontSize: '0.725rem' }}>Details Needed</span>
              )}
            </div>

            {(studentProfile?.bank_name && studentProfile?.account_number) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div><strong>Bank:</strong> {studentProfile.bank_name}</div>
                <div><strong>Account Number (NUBAN):</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.05em' }}>{studentProfile.account_number}</span></div>
                <div><strong>Account Name:</strong> {studentProfile.account_name || studentProfile.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Official CBN Commercial Bank on File
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <p style={{ marginBottom: '10px' }}>
                  The Industrial Training Fund (ITF) requires your official Nigerian commercial bank account details to disburse your SIWES monthly stipends upon report approval.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> Official commercial banks only (Access, GTBank, Zenith, First Bank, UBA, etc.)
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={(studentProfile?.bank_name && studentProfile?.account_number) ? 'btn-secondary' : 'btn-primary'}
              style={{ width: '100%', fontSize: '0.825rem', padding: '8px 14px', justifyContent: 'center' }}
              onClick={openBankModal}
            >
              {(studentProfile?.bank_name && studentProfile?.account_number) ? (
                <>
                  <CreditCard size={14} style={{ marginRight: '6px' }} /> Update Bank Account
                </>
              ) : (
                <>
                  <Plus size={14} style={{ marginRight: '6px' }} /> Add Bank Account Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 3: Final Report Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#b45309" /> Final Technical Report & Stipend
              </h3>
              {finalReport?.stipend_verified ? (
                <span className="badge approved" style={{ fontSize: '0.725rem' }}>Stipend Approved</span>
              ) : finalReport ? (
                <span className="badge pending" style={{ fontSize: '0.725rem' }}>Under ITF Review</span>
              ) : (
                <span className="badge pending" style={{ fontSize: '0.725rem' }}>Not Submitted</span>
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                  Upload your completed SIWES technical report (PDF or Word) at the conclusion of your training to qualify for federal ITF stipend authorization.
                </p>
              </div>
            )}
          </div>

          {!finalReport && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.825rem', padding: '8px 14px', justifyContent: 'center' }}
                onClick={() => setShowReportModal(true)}
              >
                <Upload size={14} style={{ marginRight: '6px' }} /> Upload Final Report
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
                  {log.status === 'rejected' ? 'Revision Needed' : log.status}
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
                {log.industry_endorsed && log.status !== 'rejected' && (
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
              {logModalError && (
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{logModalError}</span>
                </div>
              )}

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
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1,
                    backgroundColor: logSuccess ? '#15803d' : undefined,
                    borderColor: logSuccess ? '#15803d' : undefined
                  }}
                  disabled={uploadingEvidence || submittingLog || logSuccess}
                >
                  {logSuccess ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> Submitted Successfully!
                    </span>
                  ) : submittingLog ? (
                    'Submitting Entry...'
                  ) : resubmitLogId ? (
                    'Resubmit Corrected Entry'
                  ) : (
                    'Submit Activity Log'
                  )}
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

      {/* MODAL 3: Placement Registration */}
      {showPlacementModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>{placement ? 'Update Place of Attachment' : 'Register Place of Attachment'}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SIWES Form 8 / Host Firm Attachment Details</p>
              </div>
              <button type="button" onClick={() => setShowPlacementModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            {placementModalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#b91c1c' }}>
                {placementModalError}
              </div>
            )}

            <form onSubmit={handleSavePlacement}>
              <div className="input-group">
                <label>Host Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Chevron Nigeria Limited, Dangote Cement, Flutterwave"
                  value={placementForm.company_name}
                  onChange={(e) => setPlacementForm({ ...placementForm, company_name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Company Physical Address & Location *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Plot 12, Commercial Avenue, Ikeja, Lagos State"
                  value={placementForm.address}
                  onChange={(e) => setPlacementForm({ ...placementForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Training Start Date *</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={placementForm.start_date}
                    onChange={(e) => setPlacementForm({ ...placementForm, start_date: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Training End Date *</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={placementForm.end_date}
                    onChange={(e) => setPlacementForm({ ...placementForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  On-site Industry Supervisor Contact
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Provide the details of your workplace supervisor who endorses your activities.
                </p>

                <div className="input-group">
                  <label>Supervisor Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Engr. Tunde Adeleke"
                    value={placementForm.industry_supervisor_name}
                    onChange={(e) => setPlacementForm({ ...placementForm, industry_supervisor_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>Supervisor Email</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="supervisor@company.com"
                      value={placementForm.industry_supervisor_email}
                      onChange={(e) => setPlacementForm({ ...placementForm, industry_supervisor_email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Supervisor Phone</label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="e.g. 08031234567"
                      value={placementForm.industry_supervisor_phone}
                      onChange={(e) => setPlacementForm({ ...placementForm, industry_supervisor_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPlacementModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submittingPlacement}>
                  {submittingPlacement ? 'Saving...' : placement ? 'Update Details' : 'Register Attachment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Official Bank Details */}
      {showBankModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={20} color="#15803d" /> SIWES Stipend Account Details
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Federal Industrial Training Fund (ITF) Direct Disbursement</p>
              </div>
              <button type="button" onClick={() => setShowBankModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.785rem', color: '#166534' }}>
              <strong>Official CBN Commercial Banks Only:</strong> The Industrial Training Fund disburse allowances exclusively to verified Nigerian commercial bank accounts.
            </div>

            {bankModalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#b91c1c' }}>
                {bankModalError}
              </div>
            )}

            <form onSubmit={handleSaveBankDetails}>
              <div className="input-group">
                <label>Official Bank Name *</label>
                <select
                  required
                  className="select-field"
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                >
                  <option value="">-- Choose Commercial Bank ({OFFICIAL_NIGERIAN_BANKS.length}) --</option>
                  {OFFICIAL_NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>10-Digit Account Number (NUBAN) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  className="input-field"
                  placeholder="e.g. 0123456789"
                  value={bankForm.account_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setBankForm({ ...bankForm, account_number: val });
                  }}
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '0.08em' }}
                />
              </div>

              <div className="input-group">
                <label>Account Full Name (as registered with your bank) *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. JOHN CHUKWUEMEKA DOE"
                  value={bankForm.account_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value.toUpperCase() })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowBankModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submittingBank || bankForm.account_number.length !== 10 || !bankForm.bank_name}>
                  {submittingBank ? 'Saving...' : 'Save Bank Details'}
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
