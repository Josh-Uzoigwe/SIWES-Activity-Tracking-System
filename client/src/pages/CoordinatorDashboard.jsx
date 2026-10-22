import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Users, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  Plus, 
  Search, 
  Download, 
  UserCheck, 
  Building, 
  Calendar,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

const CoordinatorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'supervisors', 'reports'
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [placementForm, setPlacementForm] = useState({
    company_name: '',
    address: '',
    start_date: '',
    end_date: '',
    school_supervisor_id: '',
    industry_supervisor_id: ''
  });

  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorForm, setSupervisorForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'SCHOOL',
    department: '',
    company: '',
    phone: ''
  });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    matric_no: '',
    email: '',
    password: '',
    department: '',
    year_of_study: '300L'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentsRes, supervisorsRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/students'),
        api.get('/auth/supervisors')
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (supervisorsRes.data.success) setSupervisors(supervisorsRes.data.data);
    } catch (err) {
      console.error('Error fetching coordinator data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Open Placement Modal
  const openPlacementModal = (student) => {
    setSelectedStudent(student);
    const existing = student.placements?.[0];
    if (existing) {
      setPlacementForm({
        placement_id: existing.placement_id,
        company_name: existing.company_name || '',
        address: existing.address || '',
        start_date: existing.start_date ? existing.start_date.split('T')[0] : '',
        end_date: existing.end_date ? existing.end_date.split('T')[0] : '',
        school_supervisor_id: existing.school_supervisor?.supervisor_id || '',
        industry_supervisor_id: existing.industry_supervisor?.supervisor_id || ''
      });
    } else {
      setPlacementForm({
        company_name: '',
        address: '',
        start_date: '',
        end_date: '',
        school_supervisor_id: '',
        industry_supervisor_id: ''
      });
    }
    clearMessages();
    setShowPlacementModal(true);
  };

  const handleSavePlacement = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const existing = selectedStudent.placements?.[0];
      let placementId = existing?.placement_id;

      if (!placementId) {
        // Create placement first
        const createRes = await api.post('/placements', {
          student_id: selectedStudent.student_id,
          company_name: placementForm.company_name,
          address: placementForm.address,
          start_date: placementForm.start_date,
          end_date: placementForm.end_date
        });
        placementId = createRes.data.data.placement_id;
      }

      // Assign supervisors if selected
      if (placementForm.school_supervisor_id || placementForm.industry_supervisor_id) {
        await api.put(`/placements/${placementId}`, {
          school_supervisor_id: placementForm.school_supervisor_id ? parseInt(placementForm.school_supervisor_id, 10) : undefined,
          industry_supervisor_id: placementForm.industry_supervisor_id ? parseInt(placementForm.industry_supervisor_id, 10) : undefined
        });
      }

      setSuccessMsg('Placement and supervisor assignments updated successfully!');
      setShowPlacementModal(false);
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save placement');
    }
  };

  const handleRegisterSupervisor = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post('/auth/register/supervisor', {
        ...supervisorForm,
        institution: user.institution || 'Federal University of Technology, Owerri'
      });
      setSuccessMsg('Supervisor registered successfully!');
      setShowSupervisorModal(false);
      setSupervisorForm({
        full_name: '',
        email: '',
        password: '',
        role: 'SCHOOL',
        department: '',
        company: '',
        phone: ''
      });
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register supervisor');
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post('/auth/register/student', {
        ...studentForm,
        institution: user.institution || 'Federal University of Technology, Owerri'
      });
      setSuccessMsg('Student registered for SIWES successfully!');
      setShowStudentModal(false);
      setStudentForm({
        full_name: '',
        matric_no: '',
        email: '',
        password: '',
        department: '',
        year_of_study: '300L'
      });
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register student');
    }
  };

  const downloadReport = async (format) => {
    try {
      const inst = encodeURIComponent(user.institution || 'FUTO');
      const response = await api.get(`/reports/export/institution/${inst}?format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `institutional_report_${inst}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate report export.');
    }
  };

  const handleClearStudent = async (studentId) => {
    try {
      clearMessages();
      const res = await api.put(`/students/${studentId}/clear`);
      if (res.data.success) {
        setSuccessMsg('Student cleared for SIWES successfully!');
        loadDashboardData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to clear student');
    }
  };

  const handleRejectStudent = async (studentId) => {
    const reason = window.prompt('Please provide a reason for flagging/rejecting this student (e.g. Matriculation number mismatch, unregistered department):');
    if (reason === null) return;
    try {
      clearMessages();
      const res = await api.put(`/students/${studentId}/reject`, { reason });
      if (res.data.success) {
        setSuccessMsg('Student clearance flagged.');
        loadDashboardData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to flag student');
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matric_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.placements?.[0]?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingClearanceStudents = students.filter(s => s.status === 'pending_clearance');
  const filteredClearanceQueue = pendingClearanceStudents.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matric_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const schoolSupervisors = supervisors.filter(s => s.role === 'SCHOOL');
  const industrySupervisors = supervisors.filter(s => s.role === 'INDUSTRY');

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh', color: 'var(--text-muted)' }}>Loading coordinator metrics...</div>;
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h2>Institutional SIWES Coordination</h2>
          <p>{user.institution || 'Institution'} — Supervise placements, supervisor mapping, and verification.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setShowSupervisorModal(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Add Supervisor
          </button>
          <button className="btn-primary" onClick={() => setShowStudentModal(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Register Student
          </button>
        </div>
      </div>

      {/* Global alert messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Analytics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Enrolled</span>
            <Users size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {analytics?.totalStudents ?? students.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered for SIWES</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: pendingClearanceStudents.length > 0 ? '3px solid #b45309' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: pendingClearanceStudents.length > 0 ? '#b45309' : 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pending Clearance</span>
            <Clock size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: pendingClearanceStudents.length > 0 ? '#b45309' : 'var(--text-main)' }}>
            {pendingClearanceStudents.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting vetting</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Active Placements</span>
            <Briefcase size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {analytics?.totalPlacements ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned to companies</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Activity Logs</span>
            <FileText size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {analytics?.totalLogs ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted by students</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Approved Logs</span>
            <CheckCircle size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {analytics?.approvedLogs ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Validated by supervisors</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', gap: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('clearance')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'clearance' ? 600 : 500,
            color: activeTab === 'clearance' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'clearance' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Clearance Queue</span>
          {pendingClearanceStudents.length > 0 && (
            <span style={{
              backgroundColor: '#b45309',
              color: '#ffffff',
              borderRadius: '9999px',
              padding: '1px 8px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              {pendingClearanceStudents.length}
            </span>
          )}
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
            cursor: 'pointer'
          }}
        >
          Students & Placements ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('supervisors')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'supervisors' ? 600 : 500,
            color: activeTab === 'supervisors' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'supervisors' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Supervisors Directory ({supervisors.length})
        </button>
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
            cursor: 'pointer'
          }}
        >
          Institutional Reports & Export
        </button>
      </div>

      {/* Tab 0: Student Clearance Queue */}
      {activeTab === 'clearance' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search clearance queue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {pendingClearanceStudents.length} student{pendingClearanceStudents.length === 1 ? '' : 's'} awaiting institutional clearance
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Student</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Matric No</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Department / Level</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Registered Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Vetting Decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredClearanceQueue.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCircle size={32} style={{ margin: '0 auto 8px', color: '#15803d', display: 'block' }} />
                      No students pending clearance! All registered students in {user.institution || 'your institution'} are cleared.
                    </td>
                  </tr>
                ) : (
                  filteredClearanceQueue.map((s) => (
                    <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {s.matric_no}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                        <div>{s.department}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.year_of_study}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className="badge pending" style={{ fontSize: '0.7rem' }}>Pending Clearance</span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#15803d', borderColor: '#15803d' }}
                            onClick={() => handleClearStudent(s.student_id)}
                          >
                            <UserCheck size={14} style={{ marginRight: '4px' }} /> Clear for SIWES
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#b91c1c' }}
                            onClick={() => handleRejectStudent(s.student_id)}
                          >
                            <XCircle size={14} style={{ marginRight: '4px' }} /> Flag
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Students & Placements */}
      {activeTab === 'students' && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search students, matric, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Student</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Department</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Company Placement</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Supervisors Assigned</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>Logs Progress</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const placement = s.placements?.[0];
                    const logsCount = s.activity_logs?.length || 0;
                    const approvedCount = s.activity_logs?.filter(l => l.status === 'approved').length || 0;

                    return (
                      <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.full_name}</span>
                            {s.status === 'pending_clearance' && (
                              <span className="badge pending" style={{ fontSize: '0.65rem' }}>Pending Clearance</span>
                            )}
                            {s.status === 'cleared' && (
                              <span className="badge approved" style={{ fontSize: '0.65rem' }}>Cleared</span>
                            )}
                            {s.status === 'rejected' && (
                              <span className="badge rejected" style={{ fontSize: '0.65rem' }}>Flagged</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.matric_no} • {s.email}</div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                          <div>{s.department}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.year_of_study}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {placement ? (
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{placement.company_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {placement.start_date ? new Date(placement.start_date).toLocaleDateString() : 'N/A'} - {placement.end_date ? new Date(placement.end_date).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="badge pending" style={{ fontSize: '0.7rem' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {placement ? (
                            <div style={{ fontSize: '0.775rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span><strong>School:</strong> {placement.school_supervisor?.full_name || 'Not assigned'}</span>
                              <span><strong>Industry:</strong> {placement.industry_supervisor?.full_name || 'Not assigned'}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No placement</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{approvedCount}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {logsCount} logs</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {s.status === 'pending_clearance' && (
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#15803d', borderColor: '#15803d' }}
                                onClick={() => handleClearStudent(s.student_id)}
                              >
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => openPlacementModal(s)}
                            >
                              {placement ? 'Edit Placement' : 'Assign Placement'}
                            </button>
                          </div>
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

      {/* Tab 2: Supervisors Directory */}
      {activeTab === 'supervisors' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* School Supervisors */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} /> Institutional Academic Supervisors ({schoolSupervisors.length})
              </h3>
            </div>
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {schoolSupervisors.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No school supervisors registered yet.
                </div>
              ) : (
                schoolSupervisors.map(sup => (
                  <div key={sup.supervisor_id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sup.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sup.email} • {sup.department || 'General'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sup.institution}</div>
                    </div>
                    <span className="badge approved" style={{ fontSize: '0.7rem' }}>Academic</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Industry Supervisors */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} /> Industry Workplace Supervisors ({industrySupervisors.length})
              </h3>
            </div>
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {industrySupervisors.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No industry supervisors registered yet.
                </div>
              ) : (
                industrySupervisors.map(sup => (
                  <div key={sup.supervisor_id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sup.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sup.email} • {sup.company || 'Host Company'}</div>
                    </div>
                    <span className="badge pending" style={{ fontSize: '0.7rem' }}>Workplace</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Institutional Reports & Export */}
      {activeTab === 'reports' && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '8px' }}>Generate Official SIWES Reports</h3>
          <p style={{ marginBottom: '24px' }}>
            Export comprehensive institutional placement summaries, student log statistics, and supervisor coverage for audit and national ITF compliance.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '700px' }}>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FileText size={22} color="var(--primary)" />
                <h4 style={{ fontSize: '1rem' }}>PDF Institutional Digest</h4>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                Formatted PDF document containing institutional student rosters, placement companies, and supervisor sign-offs.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', gap: '8px' }}
                onClick={() => downloadReport('pdf')}
              >
                <Download size={16} /> Download PDF Report
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FileText size={22} color="var(--primary)" />
                <h4 style={{ fontSize: '1rem' }}>CSV Spreadsheet Export</h4>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                Raw CSV dataset of all enrolled students, placement companies, and log completion counts for Excel analytics.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', gap: '8px' }}
                onClick={() => downloadReport('csv')}
              >
                <Download size={16} /> Download CSV Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Placement & Supervisor Assignment */}
      {showPlacementModal && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>SIWES Placement & Supervisors</h3>
                <p style={{ fontSize: '0.85rem' }}>Student: <strong>{selectedStudent.full_name}</strong> ({selectedStudent.matric_no})</p>
              </div>
              <button type="button" onClick={() => setShowPlacementModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSavePlacement}>
              <div className="input-group">
                <label>Host Company Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Chevron Nigeria Ltd"
                  value={placementForm.company_name}
                  onChange={(e) => setPlacementForm({ ...placementForm, company_name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Company Workplace Address *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Lekki Peninsula, Lagos"
                  value={placementForm.address}
                  onChange={(e) => setPlacementForm({ ...placementForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={placementForm.start_date}
                    onChange={(e) => setPlacementForm({ ...placementForm, start_date: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={placementForm.end_date}
                    onChange={(e) => setPlacementForm({ ...placementForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Assign School Supervisor (Academic)</label>
                <select
                  className="select-field"
                  value={placementForm.school_supervisor_id}
                  onChange={(e) => setPlacementForm({ ...placementForm, school_supervisor_id: e.target.value })}
                >
                  <option value="">-- Select School Supervisor --</option>
                  {schoolSupervisors.map(sup => (
                    <option key={sup.supervisor_id} value={sup.supervisor_id}>
                      {sup.full_name} ({sup.department || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Assign Industry Supervisor (Workplace)</label>
                <select
                  className="select-field"
                  value={placementForm.industry_supervisor_id}
                  onChange={(e) => setPlacementForm({ ...placementForm, industry_supervisor_id: e.target.value })}
                >
                  <option value="">-- Select Industry Supervisor --</option>
                  {industrySupervisors.map(sup => (
                    <option key={sup.supervisor_id} value={sup.supervisor_id}>
                      {sup.full_name} ({sup.company || 'Company'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPlacementModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Register Supervisor */}
      {showSupervisorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Register New Supervisor</h3>
              <button type="button" onClick={() => setShowSupervisorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleRegisterSupervisor}>
              <div className="input-group">
                <label>Supervisor Role *</label>
                <select
                  className="select-field"
                  value={supervisorForm.role}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, role: e.target.value })}
                >
                  <option value="SCHOOL">School Supervisor (Academic Staff)</option>
                  <option value="INDUSTRY">Industry Supervisor (Company Workplace)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Dr. Ngozi Okafor"
                  value={supervisorForm.full_name}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, full_name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Official Email Address *</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="e.g. n.okafor@institution.edu.ng"
                  value={supervisorForm.email}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={supervisorForm.password}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, password: e.target.value })}
                />
              </div>

              {supervisorForm.role === 'SCHOOL' ? (
                <div className="input-group">
                  <label>Academic Department *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Computer Science"
                    value={supervisorForm.department}
                    onChange={(e) => setSupervisorForm({ ...supervisorForm, department: e.target.value })}
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label>Host Company / Organization *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Shell Petroleum"
                    value={supervisorForm.company}
                    onChange={(e) => setSupervisorForm({ ...supervisorForm, company: e.target.value })}
                  />
                </div>
              )}

              <div className="input-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. +234 801 234 5678"
                  value={supervisorForm.phone}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSupervisorModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Register Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Register Student for SIWES */}
      {showStudentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Register Student for SIWES</h3>
              <button type="button" onClick={() => setShowStudentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent}>
              <div className="input-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Emmanuel Chukwuma"
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Matriculation Number *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. 2021/12345"
                  value={studentForm.matric_no}
                  onChange={(e) => setStudentForm({ ...studentForm, matric_no: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Student Email Address *</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="e.g. emmanuel@student.edu.ng"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Electrical Eng"
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Year of Study</label>
                  <select
                    className="select-field"
                    value={studentForm.year_of_study}
                    onChange={(e) => setStudentForm({ ...studentForm, year_of_study: e.target.value })}
                  >
                    <option value="300L">300 Level</option>
                    <option value="400L">400 Level</option>
                    <option value="500L">500 Level</option>
                    <option value="ND II">ND II</option>
                    <option value="HND I">HND I</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowStudentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;
