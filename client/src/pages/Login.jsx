import React, { useState, useContext } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { XCircle, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const roles = [
  { id: 'student', label: 'Student', type: 'student', role: 'STUDENT' },
  { id: 'school', label: 'School Supervisor', type: 'supervisor', role: 'SCHOOL' },
  { id: 'industry', label: 'Industry Supervisor', type: 'supervisor', role: 'INDUSTRY' },
  { id: 'coordinator', label: 'Coordinator', type: 'supervisor', role: 'COORDINATOR' },
  { id: 'itf', label: 'ITF Officer', type: 'supervisor', role: 'ITF' },
];


const Login = () => {
  const { user, login, loginWithGoogleData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New Google user enrollment modal
  const [institutions, setInstitutions] = useState([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [newGoogleUser, setNewGoogleUser] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    matric_no: '',
    department: '',
    institution: '',
    year_of_study: '300L'
  });
  const [completingGoogle, setCompletingGoogle] = useState(false);

  React.useEffect(() => {
    api.get('/institutions').then(res => {
      if (res.data?.success && res.data.data.length > 0) {
        setInstitutions(res.data.data);
        setEnrollForm(prev => ({ ...prev, institution: res.data.data[0].name }));
      }
    }).catch(() => {});
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, selectedRole.type, selectedRole.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential
      });

      if (res.data.isNewUser) {
        // Prompt for student enrollment completion
        setNewGoogleUser(res.data.profile);
        setShowCompleteModal(true);
      } else {
        loginWithGoogleData(res.data.accessToken, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in popup was cancelled or failed. Please check your Google Client ID.');
  };

  const handleCompleteGoogleEnrollment = async (e) => {
    e.preventDefault();
    setError('');
    setCompletingGoogle(true);
    try {
      const res = await api.post('/auth/google/complete-registration', {
        email: newGoogleUser.email,
        full_name: newGoogleUser.full_name,
        matric_no: enrollForm.matric_no,
        department: enrollForm.department,
        institution: enrollForm.institution,
        year_of_study: enrollForm.year_of_study,
        google_token: newGoogleUser.google_token
      });

      if (res.data.success) {
        loginWithGoogleData(res.data.accessToken, res.data.user);
        setShowCompleteModal(false);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setCompletingGoogle(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '24px' }}>
      <div className="glass-panel" style={{ maxWidth: '440px', width: '100%' }}>
        
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: '18px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'var(--surface-hover)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-main)';
            e.currentTarget.style.backgroundColor = 'var(--border-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Homepage</span>
        </Link>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Sign in to SIWES Tracker</h1>
          <p>Access your industrial training activity tracking and supervision portal.</p>
        </div>

        {error && (
          <div className="alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
              width="374"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              or sign in with password
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-role">Select Role</label>
            <select
              id="login-role"
              className="select-field"
              value={selectedRole.id}
              onChange={(e) => {
                const found = roles.find(r => r.id === e.target.value);
                if (found) setSelectedRole(found);
              }}
              style={{ width: '100%', height: '42px', fontSize: '0.875rem' }}
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="login-email">Email Address</label>
            <input 
              id="login-email"
              type="email" 
              className="input-field" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input 
              id="login-password"
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button id="login-submit-btn" type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Are you a new student? <Link to="/register" className="link">Create an account</Link>
        </div>

      </div>

      {/* MODAL: Complete Google Student Enrollment */}
      {showCompleteModal && newGoogleUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Complete Student Enrollment</h3>
                <p style={{ fontSize: '0.85rem' }}>Authenticated via Google as <strong>{newGoogleUser.email}</strong></p>
              </div>
              <button type="button" onClick={() => setShowCompleteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleCompleteGoogleEnrollment}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newGoogleUser.full_name}
                  onChange={(e) => setNewGoogleUser({ ...newGoogleUser, full_name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Matriculation Number *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. 2021/108922"
                  value={enrollForm.matric_no}
                  onChange={(e) => setEnrollForm({ ...enrollForm, matric_no: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Accredited Tertiary Institution *</label>
                <select
                  className="select-field"
                  required
                  value={enrollForm.institution}
                  onChange={(e) => setEnrollForm({ ...enrollForm, institution: e.target.value })}
                >
                  {institutions.map(inst => (
                    <option key={inst.institution_id} value={inst.name}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Computer Science"
                    value={enrollForm.department}
                    onChange={(e) => setEnrollForm({ ...enrollForm, department: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Year of Study</label>
                  <select
                    className="select-field"
                    value={enrollForm.year_of_study}
                    onChange={(e) => setEnrollForm({ ...enrollForm, year_of_study: e.target.value })}
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
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={completingGoogle}>
                  {completingGoogle ? 'Completing...' : 'Finish Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
