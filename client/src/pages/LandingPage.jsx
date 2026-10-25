import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Building2,
  Download,
  ArrowRight,
  Lock,
  Check,
  Award,
  Sparkles,
  GraduationCap,
  Briefcase,
  Calendar,
  Layers,
  Activity,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-body)' }}>
      {/* Active Session Notification Bar */}
      {user && (
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '8px 24px',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <span>
            You are logged in as <strong>{user.name}</strong> ({user.role}).
          </span>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Open Dashboard <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* 1. STICKY TOP NAVBAR */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          borderBottom: '1px solid var(--border-subtle)',
          transition: 'all 0.2s ease'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '-0.04em',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)'
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.15 }}>
                SIWES Tracker
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                Federal Industrial Training System
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#features" className="landing-nav-link" style={{ textDecoration: 'none', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
              Features
            </a>
            <a href="#how-it-works" className="landing-nav-link" style={{ textDecoration: 'none', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
              How It Works
            </a>
            <a href="#stakeholders" className="landing-nav-link" style={{ textDecoration: 'none', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
              Stakeholders
            </a>
            <a href="#compliance" className="landing-nav-link" style={{ textDecoration: 'none', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
              ITF Standards
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#0f172a',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                Go to Dashboard
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    textDecoration: 'none',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    textDecoration: 'none',
                    backgroundColor: '#0f172a',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Student Sign Up
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '80px 24px 60px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {/* Subtle radial ambient background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.03) 60%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <div style={{ maxWidth: '1060px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Institutional Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '24px'
            }}
          >
            Industrial Training Fund (ITF) • National SIWES Digital Framework
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#0f172a',
              letterSpacing: '-0.035em',
              marginBottom: '20px'
            }}
          >
            The Modern Digital Backbone for{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #047857 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              SIWES Activity Tracking
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: '#475569',
              maxWidth: '780px',
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}
          >
            Eliminating lost paper logbooks, backdated entries, and stipend delays with tamper-proof daily activity logs,
            place of attachment self-registration, two-tier supervision, and automated ITF compliance auditing.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '48px' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                transition: 'transform 0.15s ease'
              }}
            >
              Launch SIWES Portal
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 26px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
            >
              Register as Student
            </Link>
          </div>

          {/* Trust Highlights Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '12px',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                padding: '20px 22px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                3-Day Window
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Prevents retroactive falsification by enforcing log submissions within 72 hours.
              </p>
            </div>

            <div
              style={{
                padding: '20px 22px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                Dual Endorsements
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Requires both School Supervisor and Industry Trainer verification.
              </p>
            </div>

            <div
              style={{
                padding: '20px 22px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                Instant PDF Export
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Generates a standardized, printable official logbook ready for institutional defense.
              </p>
            </div>

            <div
              style={{
                padding: '20px 22px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                Vetted Clearance
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Guarantees students are verified by their university coordinator before logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM VS SOLUTION COMPARISON */}
      <section style={{ padding: '70px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Why We Built This
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              Transforming Nigeria's Industrial Training Experience
            </h2>
            <p style={{ color: '#64748b', maxWidth: '640px', margin: '8px auto 0' }}>
              Addressing the systemic hurdles that have held back students, institutions, and the Industrial Training Fund.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* The Old Way */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fee2e2',
                borderRadius: '12px',
                padding: '32px 28px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  TRADITIONAL PAPER LOGBOOK
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '16px' }}>
                Prone to Loss, Tampering & Delays
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span><strong>Backdated entries:</strong> Students fill months of missed logs in a single panicked night before defense.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span><strong>Physical wear and tear:</strong> Logbooks get drenched in oil, lost, or torn on active industrial sites.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span><strong>Supervision disconnect:</strong> Academic supervisors cannot see weekly progress until post-internship defense.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span><strong>Delayed ITF stipends:</strong> Months of physical logbook manual cross-checking hold up student allowances.</span>
                </li>
              </ul>
            </div>

            {/* The SIWES Tracker Way */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #10b981',
                borderRadius: '12px',
                padding: '32px 28px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.08)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '4px 10px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  SIWES ELECTRONIC TRACKER
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#047857', marginBottom: '16px' }}>
                Transparent, Secure & Instant
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#1e293b' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Strict 3-Day Rule:</strong> Daily entries lock after 72 hours, ensuring continuous and honest documentation.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#1e293b' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Cloud Evidence Uploads:</strong> Attach photos, diagrams, and code snippets directly to corresponding activity logs.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#1e293b' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Live Supervisory Visibility:</strong> School and industry mentors review, critique, or approve entries in real time.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#1e293b' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Accelerated ITF Auditing:</strong> National compliance dashboard verifies student hours and technical reports in clicks.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES GRID */}
      <section id="features" style={{ padding: '80px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Capabilities
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              Built for Academic Rigor & Industrial Standards
            </h2>
            <p style={{ color: '#64748b', maxWidth: '650px', margin: '8px auto 0' }}>
              Everything needed to manage placements, enforce daily accountability, and conduct nationwide compliance audits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Feature 1 */}
            <div style={{ padding: '28px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#047857', letterSpacing: '0.06em' }}>
                  01 // AUDIT TIMELOCK
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  IMMUTABLE
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Tamper-Evident Daily Logging</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                Students submit entries with skills acquired and photographic evidence. The server-enforced 3-day window prevents backfilling missed weeks.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ padding: '28px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', letterSpacing: '0.06em' }}>
                  02 // DUAL ENDORSEMENT
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' }}>
                  DUAL SIGN-OFF
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Two-Tier Supervisory Pipeline</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                Industry supervisors sign off on technical execution and workplace diligence, while school supervisors validate academic relevance.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ padding: '28px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.06em' }}>
                  03 // CLEARANCE GATE
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                  PREREQUISITE
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Institutional Clearance Control</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                University coordinators must vet student profiles and approve institutional clearance before activity logging is unlocked.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{ padding: '28px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', letterSpacing: '0.06em' }}>
                  04 // SITE VERIFICATION
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                  FIELD VISITS
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>On-Site Inspection Visits</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                School supervisors record physical company inspection visits, documenting student physical attendance, workstation safety, and notes.
              </p>
            </div>

            {/* Feature 5 */}
            <div style={{ padding: '28px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#d97706', letterSpacing: '0.06em' }}>
                  05 // STANDARDIZED REPORT
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  AUTO-COMPILED
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Automated PDF Logbook</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                Students, supervisors, and coordinators can generate a complete, formatted official PDF logbook compilation with review comments.
              </p>
            </div>

            {/* Feature 6 */}
            <div style={{ padding: '28px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.06em' }}>
                  06 // NATIONAL GOVERNANCE
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>
                  ITF AUDIT
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>ITF National Directorate Oversight</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                Dedicated national portal for ITF officers to onboard accredited universities, review compliance metrics, and approve student stipends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STAKEHOLDER MATRIX */}
      <section id="stakeholders" style={{ padding: '80px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              The Ecosystem
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              Designed for All 5 Key Stakeholders
            </h2>
            <p style={{ color: '#64748b', maxWidth: '640px', margin: '8px auto 0' }}>
              Each participant has a tailored, role-governed dashboard strictly protected by role-based access control.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Student */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Students</h4>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                    Tertiary Candidates
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '18px', lineHeight: 1.55 }}>
                  Submit daily logs, upload photographic evidence, review supervisor corrections, and submit technical reports for stipend clearance.
                </p>
              </div>
              <Link to="/register" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Register as Student <ChevronRight size={14} />
              </Link>
            </div>

            {/* School Supervisor */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>School Supervisors</h4>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                    Academic Faculty
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '18px', lineHeight: 1.55 }}>
                  Approve or reject student logs with feedback, track student competencies, and document physical supervisory site visits.
                </p>
              </div>
              <Link to="/login" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Supervisor Sign In <ChevronRight size={14} />
              </Link>
            </div>

            {/* Industry Supervisor */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Industry Supervisors</h4>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1' }}>
                    Workplace Mentors
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '18px', lineHeight: 1.55 }}>
                  Verify practical industrial tasks completed at the company, check weekly attendance, and provide official industry endorsements.
                </p>
              </div>
              <Link to="/login" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Industry Sign In <ChevronRight size={14} />
              </Link>
            </div>

            {/* Coordinator */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>SIWES Coordinators</h4>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                    University Directorate
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '18px', lineHeight: 1.55 }}>
                  Vet candidate registrations, manage company placement assignments, assign university supervisors, and certify institutional completion.
                </p>
              </div>
              <Link to="/login" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Coordinator Portal <ChevronRight size={14} />
              </Link>
            </div>

            {/* ITF Officer */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>ITF Officers</h4>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', backgroundColor: '#0f172a', color: '#ffffff' }}>
                    National Directorate
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '18px', lineHeight: 1.55 }}>
                  National compliance dashboard: onboard accredited tertiary institutions, inspect digital logbooks, and verify student stipend eligibility.
                </p>
              </div>
              <Link to="/login" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                ITF Officer Sign In <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (THE 4-STEP CYCLE) */}
      <section id="how-it-works" style={{ padding: '80px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step-by-Step Workflow
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              From Clearance to Final ITF Stipend
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              >
                1
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px 24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Institutional Onboarding & Clearance
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  The ITF national portal authorizes the institution and designates a Coordinator. The student registers with their official matriculation number, and the Coordinator verifies their eligibility and assigns their company placement.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              >
                2
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px 24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Active Daily Logging (Within 3 Days)
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  The student records daily workplace operations, technical skills acquired, and uploads photos or documentation. Entries must be submitted within 72 hours to prevent retroactive log manipulation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              >
                3
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px 24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Dual-Tier Review & Workplace Inspections
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  The Industry Supervisor provides practical on-the-job endorsements. The School Supervisor audits weekly entries, requests corrections when necessary, and logs physical on-site inspection visits.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              >
                4
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px 24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
                  Technical Report Submission & ITF Stipend Approval
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  The student uploads their completed final SIWES technical report and exports their certified PDF logbook. The ITF National Directorate verifies compliance benchmarks and approves official student stipend disbursement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. NATIONAL STANDARDS & COMPLIANCE */}
      <section id="compliance" style={{ padding: '60px 24px', backgroundColor: '#0f172a', color: '#ffffff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', color: '#34d399', marginBottom: '16px' }}>
            <ShieldCheck size={16} /> National Standard Compliance
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
            Grounded in the Industrial Training Fund (ITF) Mandate
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '720px', margin: '0 auto 32px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Designed to fulfill the statutory requirements of the Industrial Training Fund Act, providing tertiary institutions across Nigeria with an auditable, secure, and standardized electronic activity tracking platform.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', color: '#cbd5e1', fontSize: '0.85rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#34d399" /> 256-bit Cryptographic Authentication
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#34d399" /> Role-Based Access Control (RBAC)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#34d399" /> Server-side Timestamp Immutability
            </span>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section style={{ padding: '80px 24px', backgroundColor: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Ready to Begin Your SIWES Journey?
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '32px', lineHeight: 1.5 }}>
            Access your activity tracking portal, coordinate institutional clearances, or inspect company placements through the official portal.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 30px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
              }}
            >
              Sign In to Your Account
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 26px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                border: '1px solid #cbd5e1'
              }}
            >
              Register as Student
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer style={{ marginTop: 'auto', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border-subtle)', padding: '40px 24px 28px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
              S
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>SIWES Activity Tracking System</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Federal Republic of Nigeria • Industrial Training Fund</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.8rem', color: '#64748b' }}>
            <Link to="/login" style={{ color: '#475569', textDecoration: 'none' }}>Portal Login</Link>
            <Link to="/register" style={{ color: '#475569', textDecoration: 'none' }}>Student Sign Up</Link>
            <span>•</span>
            <span>Version 1.0.0 (Production)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
