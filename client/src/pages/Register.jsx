import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { Building2, AlertCircle, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Register = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    matric_no: '',
    email: '',
    password: '',
    department: '',
    institution: '',
    year_of_study: '300L'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await api.get('/institutions');
        if (res.data.success && res.data.data.length > 0) {
          setInstitutions(res.data.data);
          setFormData(prev => ({ ...prev, institution: res.data.data[0].name }));
        }
      } catch (err) {
        console.error('Failed to load institutions list', err);
      }
    };
    fetchInstitutions();
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Register student account
      await api.post('/auth/register/student', formData);
      // 2. Auto-login after successful registration
      await login(formData.email, formData.password, 'student');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '24px' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
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
          <ThemeToggle />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Create Student Account</h1>
          <p>Register with your official matriculation details for SIWES clearance.</p>
        </div>

        {error && (
          <div className="alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Full Name *</label>
              <input type="text" name="full_name" className="input-field" required value={formData.full_name} onChange={handleChange} placeholder="e.g. Alice Johnson" />
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Matriculation Number *</label>
              <input type="text" name="matric_no" className="input-field" required value={formData.matric_no} onChange={handleChange} placeholder="e.g. CSC/2020/001" />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '16px' }}>
            <label>Student Email Address *</label>
            <input type="email" name="email" className="input-field" required value={formData.email} onChange={handleChange} placeholder="name@institution.edu.ng" />
          </div>

          <div className="input-group">
            <label>Password *</label>
            <input type="password" name="password" className="input-field" required minLength="6" value={formData.password} onChange={handleChange} placeholder="••••••••" />
          </div>

          {/* Accredited Institution Dropdown */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} /> Accredited Tertiary Institution *
            </label>
            <select
              name="institution"
              className="select-field"
              required
              value={formData.institution}
              onChange={handleChange}
            >
              {institutions.length === 0 ? (
                <option value="">Loading institutions...</option>
              ) : (
                institutions.map(inst => (
                  <option key={inst.institution_id} value={inst.name}>
                    {inst.name} ({inst.code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid-2" style={{ gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div className="input-group">
              <label>Academic Department *</label>
              <input type="text" name="department" className="input-field" required value={formData.department} onChange={handleChange} placeholder="e.g. Computer Science" />
            </div>
            
            <div className="input-group">
              <label>Year / Level of Study *</label>
              <select name="year_of_study" className="select-field" value={formData.year_of_study} onChange={handleChange}>
                <option value="300L">300 Level (300L)</option>
                <option value="400L">400 Level (400L)</option>
                <option value="500L">500 Level (500L)</option>
                <option value="ND II">National Diploma (ND II)</option>
                <option value="HND I">Higher National Diploma (HND I)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Submitting Registration...' : 'Sign Up for SIWES'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="link">Sign in</Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
