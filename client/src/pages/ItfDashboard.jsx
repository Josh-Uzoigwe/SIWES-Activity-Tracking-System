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
  XCircle,
  GraduationCap,
  Globe,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import {
  COUNTRIES,
  NIGERIAN_STATES,
  INSTITUTION_CATEGORIES,
  ACCREDITED_INSTITUTIONS
} from '../data/nigerianInstitutions';

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
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL'); // 'ALL', 'PENDING', 'VERIFIED'
  const [placementFilter, setPlacementFilter] = useState('ALL'); // 'ALL', 'PLACED', 'UNPLACED'
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Onboard Institution Modal with Cascading Directory Selection
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Nigeria');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);

  const [onboardForm, setOnboardForm] = useState({
    name: '',
    code: '',
    state: '',
    coordinator_name: '',
    coordinator_email: '',
    password: ''
  });

  const resetOnboardForm = () => {
    setOnboardForm({
      name: '',
      code: '',
      state: '',
      coordinator_name: '',
      coordinator_email: '',
      password: ''
    });
    setSelectedCountry('Nigeria');
    setSelectedState('');
    setSelectedCategory('');
    setSelectedInstitution('');
    setIsManualEntry(false);
  };

  const filteredDirectoryInstitutions = ACCREDITED_INSTITUTIONS.filter(inst => {
    if (selectedState && inst.state !== selectedState) return false;
    if (selectedCategory && inst.category !== selectedCategory) return false;
    return true;
  });

  const selectedInstDetails = ACCREDITED_INSTITUTIONS.find(i => i.name === selectedInstitution);

  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    if (selectedInstitution && selectedInstitution !== 'CUSTOM') {
      const found = ACCREDITED_INSTITUTIONS.find(i => i.name === selectedInstitution);
      if (found && stateName && found.state !== stateName) {
        setSelectedInstitution('');
        setOnboardForm(prev => ({ ...prev, name: '', code: '', state: stateName }));
      } else if (stateName) {
        setOnboardForm(prev => ({ ...prev, state: stateName }));
      }
    } else if (stateName) {
      setOnboardForm(prev => ({ ...prev, state: stateName }));
    }
  };

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
    if (selectedInstitution && selectedInstitution !== 'CUSTOM') {
      const found = ACCREDITED_INSTITUTIONS.find(i => i.name === selectedInstitution);
      if (found && categoryName && found.category !== categoryName) {
        setSelectedInstitution('');
        setOnboardForm(prev => ({ ...prev, name: '', code: '' }));
      }
    }
  };

  const handleInstitutionSelect = (instName) => {
    setSelectedInstitution(instName);
    if (!instName) {
      setOnboardForm(prev => ({
        ...prev,
        name: '',
        code: '',
        state: selectedState || ''
      }));
      return;
    }
    if (instName === 'CUSTOM') {
      setIsManualEntry(true);
      setOnboardForm(prev => ({
        ...prev,
        name: '',
        code: '',
        state: selectedState || ''
      }));
      return;
    }

    const found = ACCREDITED_INSTITUTIONS.find(i => i.name === instName);
    if (found) {
      setIsManualEntry(false);
      if (found.state && (!selectedState || selectedState !== found.state)) {
        setSelectedState(found.state);
      }
      setOnboardForm(prev => ({
        ...prev,
        name: found.name,
        code: found.code,
        state: found.state,
        coordinator_email: (!prev.coordinator_email || prev.coordinator_email.includes('@')) 
          ? `coordinator@${found.domain}` 
          : prev.coordinator_email
      }));
    }
  };

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
      const payload = {
        ...onboardForm,
        password: onboardForm.password ? onboardForm.password : 'password123'
      };
      const res = await api.post('/institutions', payload);
      if (res.data.success) {
        setMessage({
          text: `Successfully accredited ${onboardForm.name} (${onboardForm.code.toUpperCase()}) and onboarded Coordinator ${onboardForm.coordinator_name}!`,
          type: 'success'
        });
        setShowOnboardModal(false);
        resetOnboardForm();
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
    const matchesPlacement = 
      placementFilter === 'ALL' ? true :
      placementFilter === 'PLACED' ? Boolean(s.placements && s.placements.length > 0) :
      Boolean(!s.placements || s.placements.length === 0);
    return matchesInst && matchesSearch && matchesPlacement;
  });

  const filteredReports = finalReports.filter(r => {
    const matchesInst = institutionFilter === 'ALL' || r.student?.institution === institutionFilter;
    const matchesSearch = 
      r.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student?.matric_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student?.institution?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      reportStatusFilter === 'ALL' ? true :
      reportStatusFilter === 'VERIFIED' ? Boolean(r.stipend_verified) :
      !r.stipend_verified;
    return matchesInst && matchesSearch && matchesStatus;
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
  const placedCount = students.filter(s => s.placements && s.placements.length > 0).length;
  const unplacedCount = students.length - placedCount;

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

      {/* Clickable KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* Card 1: Accredited Universities */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('institutions');
            setSearchQuery('');
            setInstitutionFilter('ALL');
          }}
          className="glass-panel stat-card-interactive"
          style={{
            padding: '20px',
            textAlign: 'left',
            border: activeTab === 'institutions' ? '2px solid #0f172a' : '1px solid var(--border-subtle)',
            backgroundColor: activeTab === 'institutions' ? 'var(--surface-hover)' : 'var(--bg-surface)',
          }}
          title="Click to view all accredited institutions"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Accredited Universities</span>
            <Building2 size={18} color="#0f172a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {institutionsList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Approved tertiary institutions</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
              View directory ➔
            </span>
            {activeTab === 'institutions' && (
              <span style={{ fontSize: '0.65rem', backgroundColor: '#0f172a', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                ACTIVE TAB
              </span>
            )}
          </div>
        </button>

        {/* Card 2: Nationwide Students */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('students');
            setPlacementFilter('ALL');
            setSearchQuery('');
            setInstitutionFilter('ALL');
          }}
          className="glass-panel stat-card-interactive"
          style={{
            padding: '20px',
            textAlign: 'left',
            border: (activeTab === 'students' && placementFilter === 'ALL') ? '2px solid #0f172a' : '1px solid var(--border-subtle)',
            backgroundColor: (activeTab === 'students' && placementFilter === 'ALL') ? 'var(--surface-hover)' : 'var(--bg-surface)',
          }}
          title="Click to view full nationwide student roster"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nationwide Students</span>
            <Users size={18} color="#0f172a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {analytics?.totalStudents ?? students.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across all institutions</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
              View roster ➔
            </span>
            {activeTab === 'students' && placementFilter === 'ALL' && (
              <span style={{ fontSize: '0.65rem', backgroundColor: '#0f172a', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                ACTIVE TAB
              </span>
            )}
          </div>
        </button>

        {/* Card 3: Total Placements */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('students');
            setPlacementFilter('PLACED');
            setSearchQuery('');
            setInstitutionFilter('ALL');
          }}
          className="glass-panel stat-card-interactive"
          style={{
            padding: '20px',
            textAlign: 'left',
            border: (activeTab === 'students' && placementFilter === 'PLACED') ? '2px solid #059669' : '1px solid var(--border-subtle)',
            backgroundColor: (activeTab === 'students' && placementFilter === 'PLACED') ? '#f0fdf4' : 'var(--bg-surface)',
          }}
          title="Click to view placed students with employer attachments"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Placements</span>
            <ShieldCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.03em' }}>
            {analytics?.totalPlacements ?? placedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Host company attachments</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>
              View placements ➔
            </span>
            {activeTab === 'students' && placementFilter === 'PLACED' && (
              <span style={{ fontSize: '0.65rem', backgroundColor: '#059669', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                PLACED ONLY
              </span>
            )}
          </div>
        </button>

        {/* Card 4: Pending Stipends */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('reports');
            setReportStatusFilter('PENDING');
            setSearchQuery('');
            setInstitutionFilter('ALL');
          }}
          className="glass-panel stat-card-interactive"
          style={{
            padding: '20px',
            textAlign: 'left',
            border: (activeTab === 'reports' && reportStatusFilter === 'PENDING') ? '2px solid #b45309' : '1px solid var(--border-subtle)',
            backgroundColor: (activeTab === 'reports' && reportStatusFilter === 'PENDING') ? '#fffbeb' : 'var(--bg-surface)',
          }}
          title="Click to view reports awaiting ITF stipend verification"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pending Stipends</span>
            <Clock size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b45309', letterSpacing: '-0.03em' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Awaiting ITF verification</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>
              Review queue ➔
            </span>
            {activeTab === 'reports' && reportStatusFilter === 'PENDING' && (
              <span style={{ fontSize: '0.65rem', backgroundColor: '#b45309', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                AUDIT QUEUE
              </span>
            )}
          </div>
        </button>

        {/* Card 5: Authorized for Stipend */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('reports');
            setReportStatusFilter('VERIFIED');
            setSearchQuery('');
            setInstitutionFilter('ALL');
          }}
          className="glass-panel stat-card-interactive"
          style={{
            padding: '20px',
            textAlign: 'left',
            border: (activeTab === 'reports' && reportStatusFilter === 'VERIFIED') ? '2px solid #15803d' : '1px solid var(--border-subtle)',
            backgroundColor: (activeTab === 'reports' && reportStatusFilter === 'VERIFIED') ? '#f0fdf4' : 'var(--bg-surface)',
          }}
          title="Click to view reports authorized for stipend disbursement"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Authorized for Stipend</span>
            <CheckCircle2 size={18} color="#15803d" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#15803d', letterSpacing: '-0.03em' }}>
            {verifiedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Ready for disbursement</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d' }}>
              View authorized ➔
            </span>
            {activeTab === 'reports' && reportStatusFilter === 'VERIFIED' && (
              <span style={{ fontSize: '0.65rem', backgroundColor: '#15803d', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                AUTHORIZED
              </span>
            )}
          </div>
        </button>
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
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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

          <div style={{ minWidth: '200px' }}>
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

          {/* Quick Sub-Filter Pills for Reports */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setReportStatusFilter('ALL')}
                className={reportStatusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              >
                All Reports ({finalReports.length})
              </button>
              <button
                type="button"
                onClick={() => setReportStatusFilter('PENDING')}
                className={reportStatusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderColor: reportStatusFilter === 'PENDING' ? '#b45309' : undefined,
                  backgroundColor: reportStatusFilter === 'PENDING' ? '#b45309' : undefined,
                  color: reportStatusFilter === 'PENDING' ? '#ffffff' : '#b45309'
                }}
              >
                Pending Audit ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setReportStatusFilter('VERIFIED')}
                className={reportStatusFilter === 'VERIFIED' ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderColor: reportStatusFilter === 'VERIFIED' ? '#15803d' : undefined,
                  backgroundColor: reportStatusFilter === 'VERIFIED' ? '#15803d' : undefined,
                  color: reportStatusFilter === 'VERIFIED' ? '#ffffff' : '#15803d'
                }}
              >
                Authorized ({verifiedCount})
              </button>
            </div>
          )}

          {/* Quick Sub-Filter Pills for Students */}
          {activeTab === 'students' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setPlacementFilter('ALL')}
                className={placementFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              >
                All Students ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setPlacementFilter('PLACED')}
                className={placementFilter === 'PLACED' ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderColor: placementFilter === 'PLACED' ? '#059669' : undefined,
                  backgroundColor: placementFilter === 'PLACED' ? '#059669' : undefined,
                  color: placementFilter === 'PLACED' ? '#ffffff' : '#059669'
                }}
              >
                Placed ({placedCount})
              </button>
              <button
                type="button"
                onClick={() => setPlacementFilter('UNPLACED')}
                className={placementFilter === 'UNPLACED' ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: placementFilter === 'UNPLACED' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Awaiting Placement ({unplacedCount})
              </button>
            </div>
          )}
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

      {/* MODAL: Onboard Institution & Coordinator with Cascading Hierarchy */}
      {showOnboardModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ backgroundColor: 'var(--primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ITF Accreditation Portal
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>National Directory Integration</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Onboard Accredited Institution</h3>
                <p style={{ fontSize: '0.84rem' }}>Select from accredited Nigerian tertiary institutions or enter unlisted parameters to provision coordinator credentials.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowOnboardModal(false); resetOnboardForm(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleOnboardInstitution}>
              {/* SECTION 1: Cascading Directory Filters */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={16} color="#059669" /> 1. Parameter Directory Selection
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualEntry(!isManualEntry);
                      if (!isManualEntry) {
                        setSelectedInstitution('CUSTOM');
                      } else {
                        setSelectedInstitution('');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isManualEntry ? '← Switch to Directory List' : 'Manual Entry (Unlisted)'}
                  </button>
                </div>

                {/* Country Filter */}
                <div className="input-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Country</label>
                  <select
                    className="select-field"
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      if (e.target.value !== 'Nigeria') {
                        setIsManualEntry(true);
                        setSelectedInstitution('CUSTOM');
                        setOnboardForm(prev => ({ ...prev, name: '', code: '', state: '' }));
                      } else {
                        setIsManualEntry(false);
                        setSelectedInstitution('');
                      }
                    }}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {selectedCountry === 'Nigeria' && (
                  <>
                    {/* State & Category Selectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>State (36 States + FCT)</label>
                        <select
                          className="select-field"
                          value={selectedState}
                          onChange={(e) => handleStateChange(e.target.value)}
                        >
                          <option value="">-- All States (37) --</option>
                          {NIGERIAN_STATES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Institution Type / Level</label>
                        <select
                          className="select-field"
                          value={selectedCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                          <option value="">-- All Categories --</option>
                          {INSTITUTION_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Filtered Institutions Dropdown */}
                    {!isManualEntry && (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Accredited Institutions Directory</label>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {filteredDirectoryInstitutions.length} institutions match filters
                          </span>
                        </div>
                        <select
                          className="select-field"
                          value={selectedInstitution}
                          onChange={(e) => handleInstitutionSelect(e.target.value)}
                        >
                          <option value="">
                            -- Select Institution ({filteredDirectoryInstitutions.length} available) --
                          </option>
                          {filteredDirectoryInstitutions.map(inst => (
                            <option key={`${inst.code}-${inst.name}`} value={inst.name}>
                              {inst.name} ({inst.code}) — {inst.category} [{inst.state}]
                            </option>
                          ))}
                          <option value="CUSTOM">➕ Other / Unlisted Institution (Enter Manually)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Selected Institution Pill */}
                {selectedInstDetails && !isManualEntry && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#166534' }}>
                        {selectedInstDetails.name} ({selectedInstDetails.code})
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#15803d', marginTop: '2px' }}>
                        {selectedInstDetails.category} • {selectedInstDetails.state} State • Domain: @{selectedInstDetails.domain}
                      </div>
                    </div>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                      Accredited
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 2: Verified Institution Parameters */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                  2. Institution Verification Details
                </h4>

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
                      onChange={(e) => setOnboardForm({ ...onboardForm, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="input-group">
                    <label>State / Region</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Osun"
                      value={onboardForm.state}
                      onChange={(e) => setOnboardForm({ ...onboardForm, state: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Coordinator Provisioning */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '16px 0', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} /> 3. Designated SIWES Coordinator Account
                </h4>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Coordinator Official Email *</label>
                    {selectedInstDetails?.domain && (
                      <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                        Domain: @{selectedInstDetails.domain}
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder={selectedInstDetails ? `coordinator@${selectedInstDetails.domain}` : "e.g. coordinator@oau.edu.ng"}
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
                  onClick={() => { setShowOnboardModal(false); resetOnboardForm(); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={onboardingLoading}
                >
                  {onboardingLoading ? 'Accrediting...' : 'Accredit & Provision'}
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
