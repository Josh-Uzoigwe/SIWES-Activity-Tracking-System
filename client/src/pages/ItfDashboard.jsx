import React, { useState, useEffect } from 'react';
import api, { API_SERVER_URL } from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  FileCheck2, 
  Download, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  FileText,
  AlertCircle,
  Plus,
  XCircle
} from 'lucide-react';

const ItfDashboard = () => {
  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'students', 'institutions', 'export'
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [finalReports, setFinalReports] = useState([]);
  const [institutionsList, setInstitutionsList] = useState([]);
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Onboard Institution Modal
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    code: '',
    state: '',
    coordinator_name: '',
    coordinator_email: '',
    password: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentsRes, reportsRes, instRes, supRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/students'),
        api.get('/reports/final'),
        api.get('/institutions').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/auth/supervisors').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (reportsRes.data.success) setFinalReports(reportsRes.data.data);
      if (instRes.data?.success) setInstitutionsList(instRes.data.data);
      if (supRes.data?.success) setSupervisorsList(supRes.data.data);
    } catch (err) {
      console.error('Failed to load ITF officer dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyStipend = async (reportId) => {
    try {
      setActionLoading(reportId);
      const res = await api.put(`/reports/final/${reportId}/verify`);
      if (res.data.success) {
        setMessage({ text: 'Stipend verified successfully! Student has been notified.', type: 'success' });
        // Refresh local state
        setFinalReports(prev => prev.map(r => r.report_id === reportId ? { ...r, stipend_verified: true, verified_at: new Date() } : r));
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to verify stipend', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOnboardInstitution = async (e) => {
    e.preventDefault();
    try {
      setOnboardingLoading(true);
      const res = await api.post('/institutions', onboardForm);
      if (res.data.success) {
        setMessage({
          text: `Successfully accredited ${onboardForm.name} (${onboardForm.code.toUpperCase()}) and onboarded Coordinator ${onboardForm.coordinator_name}!`,
          type: 'success'
        });
        setShowOnboardModal(false);
        setOnboardForm({
          name: '',
          code: '',
          state: '',
          coordinator_name: '',
          coordinator_email: '',
          password: ''
        });
        loadData();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to onboard institution and coordinator',
        type: 'error'
      });
    } finally {
      setOnboardingLoading(false);
    }
  };

  const downloadNationalReport = async (format) => {
    try {
      const response = await api.get(`/reports/export/itf-national?format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ITF_National_SIWES_Report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download ITF National Report');
    }
  };

  const institutions = ['ALL', ...new Set(students.map(s => s.institution).filter(Boolean))];

  const filteredStudents = students.filter(s => {
    const matchesInst = institutionFilter === 'ALL' || s.institution === institutionFilter;
    const matchesSearch = 
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matric_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesInst && matchesSearch;
  });

  const filteredReports = finalReports.filter(r => {
    const matchesInst = institutionFilter === 'ALL' || r.student?.institution === institutionFilter;
    const matchesSearch = 
      r.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student?.matric_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student?.institution?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesInst && matchesSearch;
  });

  const filteredInstitutions = institutionsList.filter(inst =>
    inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh', color: 'var(--text-muted)' }}>Loading ITF National records...</div>;
  }

  const verifiedCount = finalReports.filter(r => r.stipend_verified).length;
  const pendingCount = finalReports.filter(r => !r.stipend_verified).length;

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ backgroundColor: 'var(--primary)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              FEDERAL OVERVIEW
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Industrial Training Fund (ITF)</span>
          </div>
          <h2>National SIWES Compliance & Stipend Verification</h2>
          <p>Multi-institutional oversight, logbook auditing, and final stipend disbursement authorization.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => downloadNationalReport('csv')}>
            <Download size={16} style={{ marginRight: '6px' }} /> Export CSV
          </button>
          <button className="btn-secondary" onClick={() => downloadNationalReport('pdf')}>
            <Download size={16} style={{ marginRight: '6px' }} /> PDF Report
          </button>
          <button className="btn-primary" onClick={() => setShowOnboardModal(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Onboard Institution
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
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Accredited Universities</span>
            <Building2 size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {institutionsList.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved tertiary institutions</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Nationwide Students</span>
            <Users size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {analytics?.totalStudents ?? students.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across all institutions</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Placements</span>
            <ShieldCheck size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {analytics?.totalPlacements ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Host company attachments</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Pending Stipends</span>
            <Clock size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#b45309' }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting ITF verification</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Authorized for Stipend</span>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#15803d' }}>
            {verifiedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for disbursement</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', gap: '24px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'reports' ? 600 : 500,
            color: activeTab === 'reports' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'reports' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Final Reports & Stipends ({finalReports.length})
        </button>
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
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Cross-Institutional Students ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('institutions')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'institutions' ? 600 : 500,
            color: activeTab === 'institutions' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'institutions' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Accredited Institutions & Coordinators ({institutionsList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'export' ? 600 : 500,
            color: activeTab === 'export' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'export' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Audit & Exports
        </button>
      </div>

      {/* Filters Bar */}
      {activeTab !== 'export' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Filter by student, matric no, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>

          <div style={{ minWidth: '220px' }}>
            <select
              className="select-field"
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              {institutions.map(inst => (
                <option key={inst} value={inst}>
                  {inst === 'ALL' ? 'All Institutions' : inst}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* TAB 1: Final Reports & Stipend Eligibility */}
      {activeTab === 'reports' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Student</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Institution</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Submitted Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Report Document</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Stipend Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Authorization</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No final reports found for verification.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.report_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{report.student?.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{report.student?.matric_no}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                        {report.student?.institution || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        {new Date(report.submitted_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <a
                          href={`${API_SERVER_URL}${report.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--text-main)',
                            fontSize: '0.825rem',
                            textDecoration: 'underline'
                          }}
                        >
                          <FileText size={14} /> View Report <ExternalLink size={12} />
                        </a>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {report.stipend_verified ? (
                          <span className="badge approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Verified for Payment
                          </span>
                        ) : (
                          <span className="badge pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Pending Review
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {!report.stipend_verified ? (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem', backgroundColor: '#15803d', borderColor: '#15803d' }}
                            disabled={actionLoading === report.report_id}
                            onClick={() => handleVerifyStipend(report.report_id)}
                          >
                            {actionLoading === report.report_id ? 'Verifying...' : 'Authorize Stipend'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Verified on {report.verified_at ? new Date(report.verified_at).toLocaleDateString() : 'Record'}
                          </span>
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

      {/* TAB 2: Cross-Institutional Student Roster */}
      {activeTab === 'students' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Student</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Institution & Dept</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Host Company</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Activity Logs</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Final Report</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Audit Logbook</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const placement = s.placements?.[0];
                    const logsCount = s.activity_logs?.length || 0;
                    const approvedCount = s.activity_logs?.filter(l => l.status === 'approved').length || 0;
                    const hasReport = s.final_reports?.length > 0;

                    return (
                      <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.matric_no}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{s.institution}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.department} • {s.year_of_study}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {placement ? (
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{placement.company_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{placement.address || 'Address on file'}</div>
                            </div>
                          ) : (
                            <span className="badge pending" style={{ fontSize: '0.7rem' }}>No Placement</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{approvedCount}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {logsCount} verified</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {hasReport ? (
                            <span className="badge approved" style={{ fontSize: '0.7rem' }}>Submitted</span>
                          ) : (
                            <span className="badge pending" style={{ fontSize: '0.7rem' }}>Not Submitted</span>
                          )}
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

      {/* TAB: Accredited Institutions & Coordinators */}
      {activeTab === 'institutions' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search accredited institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filteredInstitutions.length} Accredited Tertiary Institution{filteredInstitutions.length === 1 ? '' : 's'}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Institution</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Code</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>State / Region</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Designated Coordinator</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Participating Students</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Accreditation Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstitutions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No institutions match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredInstitutions.map((inst) => {
                    const coord = supervisorsList.find(s => s.role === 'COORDINATOR' && s.institution === inst.name);
                    const studentCount = students.filter(s => s.institution === inst.name).length;

                    return (
                      <tr key={inst.institution_id || inst.code} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inst.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accredited for National SIWES</div>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                          <span style={{ backgroundColor: 'var(--surface-hover)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {inst.code}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                          {inst.state || 'Federal'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {coord ? (
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{coord.full_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{coord.email}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Liaison officer assigned on record
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{studentCount}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>enrolled students</div>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <span className="badge approved" style={{ fontSize: '0.75rem' }}>
                            <CheckCircle2 size={12} style={{ marginRight: '4px', display: 'inline' }} /> Accredited
                          </span>
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

      {/* TAB 3: National Reports & Audit Exports */}
      {activeTab === 'export' && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '8px' }}>National Industrial Training Fund Official Reports</h3>
          <p style={{ marginBottom: '24px' }}>
            Generate cross-institutional data extracts, student placement rosters, and stipend payment summaries for ministerial submission.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '700px' }}>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FileCheck2 size={24} color="var(--primary)" />
                <h4 style={{ fontSize: '1rem' }}>National PDF Audit Report</h4>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                Standardized printable document with institutional performance metrics, student attachment rates, and stipend verification totals.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', gap: '8px' }}
                onClick={() => downloadNationalReport('pdf')}
              >
                <Download size={16} /> Download National PDF
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FileText size={24} color="var(--primary)" />
                <h4 style={{ fontSize: '1rem' }}>National CSV Data Extract</h4>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                Comprehensive raw records for all participating students, company attachments, bank details, and stipend clearance status.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', gap: '8px' }}
                onClick={() => downloadNationalReport('csv')}
              >
                <Download size={16} /> Download National CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Onboard Institution & Coordinator */}
      {showOnboardModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Onboard Accredited Institution & Coordinator</h3>
                <p style={{ fontSize: '0.85rem' }}>Authorize a tertiary institution and designate their official SIWES Coordinator.</p>
              </div>
              <button type="button" onClick={() => setShowOnboardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleOnboardInstitution}>
              <div className="input-group">
                <label>Institution Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Obafemi Awolowo University"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Institutional Code *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. OAU"
                    value={onboardForm.code}
                    onChange={(e) => setOnboardForm({ ...onboardForm, code: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>State / Location</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Osun"
                    value={onboardForm.state}
                    onChange={(e) => setOnboardForm({ ...onboardForm, state: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '16px 0', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Designated SIWES Coordinator Account</h4>

                <div className="input-group">
                  <label>Coordinator Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Prof. Bola Johnson"
                    value={onboardForm.coordinator_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, coordinator_name: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Coordinator Official Email *</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="e.g. coordinator@oau.edu.ng"
                    value={onboardForm.coordinator_email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, coordinator_email: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Temporary Password (Defaults to password123)</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Leave blank for default (password123)"
                    value={onboardForm.password}
                    onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowOnboardModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={onboardingLoading}
                >
                  {onboardingLoading ? 'Onboarding...' : 'Accredit & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItfDashboard;
