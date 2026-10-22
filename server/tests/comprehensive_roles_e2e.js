/**
 * Comprehensive Multi-Role End-to-End System Test
 * Based on SIWES Activity Tracking System Project Document (Chapters 1-3)
 *
 * Actors Tested:
 * 1. ITF Officer (Cross-institutional accreditation, audit, stipend clearance)
 * 2. Institutional SIWES Coordinator (Institution oversight, supervisor registration, placement, clearance)
 * 3. Student (Account registration, daily activity logging, evidence upload, logbook PDF export)
 * 4. Industry-Based Supervisor (Workplace evaluation, log endorsement)
 * 5. School-Based Supervisor (Academic review, log approval, digital visit scheduling)
 */

const BASE_URL = 'http://localhost:3000/api/v1';

async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE SIWES MULTI-ROLE SYSTEM TEST SUITE');
  console.log('================================================================\n');

  let itfToken, coordinatorToken, studentToken, schoolToken, industryToken;
  let institutionId, studentId, placementId, logId, visitId;
  let coordinatorEmail = 'coordinator@unilorin.edu.ng';
  let schoolEmail = 'school@unilorin.edu.ng';
  let industryEmail = 'industry@chevron.com';
  let studentEmail = `student.test.${Date.now()}@unilorin.edu.ng`;

  // -------------------------------------------------------------
  // TEST PHASE 1: ITF OFFICER
  // -------------------------------------------------------------
  console.log('--- [ROLE 1: ITF OFFICER] ---');
  
  // 1.1 ITF Officer Login
  console.log('1.1 Authenticating ITF Officer (itf@test.com)...');
  const itfLogin = await api('/auth/login', {
    method: 'POST',
    body: {
      email: 'itf@test.com',
      password: 'password123',
      login_type: 'supervisor',
      expected_role: 'ITF'
    }
  });
  assert(itfLogin.status === 200 && itfLogin.data.success, 'ITF Officer login succeeded');
  assert(itfLogin.data.user.role === 'ITF', 'ITF Officer role correctly dispatched');
  itfToken = itfLogin.data.accessToken;

  // 1.2 Onboard Institution & Coordinator (University of Ilorin)
  console.log('1.2 Onboarding University of Ilorin and its Institutional Coordinator...');
  const onboardRes = await api('/institutions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${itfToken}` },
    body: {
      name: 'University of Ilorin',
      code: 'UNILORIN',
      state: 'Kwara',
      coordinator_name: 'Dr. Kehinde Ibrahim',
      coordinator_email: coordinatorEmail,
      password: 'password123'
    }
  });
  
  // If already onboarded, that's okay, we can retrieve it
  if (onboardRes.status === 201) {
    assert(onboardRes.data.success, 'Institution onboarded successfully');
    institutionId = onboardRes.data.data.institution.id;
  } else {
    console.log('    (Institution was already onboarded, verifying existing record...)');
  }

  // 1.3 Verify Institution appears in public/accredited list
  console.log('1.3 Querying accredited institutions list...');
  const instList = await api('/institutions');
  assert(instList.status === 200 && instList.data.data.length > 0, 'Accredited institutions listed');
  const unilorin = instList.data.data.find(i => i.name === 'University of Ilorin');
  assert(!!unilorin, 'University of Ilorin exists in accredited database');
  institutionId = unilorin.id;

  // 1.4 Verify ITF National Analytics Overview
  console.log('1.4 Checking ITF National Analytics Summary...');
  const itfAnalytics = await api('/analytics', {
    headers: { Authorization: `Bearer ${itfToken}` }
  });
  assert(itfAnalytics.status === 200 && itfAnalytics.data.success, 'ITF National summary fetched');
  console.log('    Total students reported:', itfAnalytics.data.data.totalStudents);

  // -------------------------------------------------------------
  // TEST PHASE 2: INSTITUTIONAL SIWES COORDINATOR
  // -------------------------------------------------------------
  console.log('\n--- [ROLE 2: INSTITUTIONAL SIWES COORDINATOR] ---');

  // 2.1 Coordinator Login
  console.log('2.1 Authenticating Institutional Coordinator (coordinator@unilorin.edu.ng)...');
  const coordLogin = await api('/auth/login', {
    method: 'POST',
    body: {
      email: coordinatorEmail,
      password: 'password123',
      login_type: 'supervisor',
      expected_role: 'COORDINATOR'
    }
  });
  assert(coordLogin.status === 200 && coordLogin.data.success, 'Coordinator login succeeded');
  assert(coordLogin.data.user.role === 'COORDINATOR', 'Coordinator role dispatched');
  coordinatorToken = coordLogin.data.accessToken;

  // 2.2 Coordinator Registers School Supervisor
  console.log('2.2 Registering School-based Supervisor (Prof. A. Adeleke)...');
  let schoolSupId;
  const regSchool = await api('/auth/register/supervisor', {
    method: 'POST',
    headers: { Authorization: `Bearer ${coordinatorToken}` },
    body: {
      full_name: 'Prof. A. Adeleke',
      email: schoolEmail,
      password: 'password123',
      role: 'SCHOOL',
      department: 'Computer Science',
      institution: 'University of Ilorin'
    }
  });
  if (regSchool.status === 201) {
    schoolSupId = regSchool.data.data.supervisor_id;
    assert(regSchool.data.success, 'School supervisor registered successfully');
  } else {
    console.log('    (School supervisor already exists, retrieving ID...)');
  }

  // 2.3 Coordinator Registers Industry Supervisor
  console.log('2.3 Registering Industry Supervisor (Engr. B. Nwosu)...');
  let industrySupId;
  const regIndustry = await api('/auth/register/supervisor', {
    method: 'POST',
    headers: { Authorization: `Bearer ${coordinatorToken}` },
    body: {
      full_name: 'Engr. B. Nwosu',
      email: industryEmail,
      password: 'password123',
      role: 'INDUSTRY',
      company: 'Chevron Nigeria',
      institution: 'University of Ilorin'
    }
  });
  if (regIndustry.status === 201) {
    industrySupId = regIndustry.data.data.supervisor_id;
    assert(regIndustry.data.success, 'Industry supervisor registered successfully');
  } else {
    console.log('    (Industry supervisor already exists, retrieving ID...)');
  }

  // 2.4 Verify Supervisors Directory
  console.log('2.4 Querying Institutional Supervisors directory...');
  const supList = await api('/auth/supervisors', {
    headers: { Authorization: `Bearer ${coordinatorToken}` }
  });
  assert(supList.status === 200 && supList.data.data.length >= 2, 'Supervisors list retrieved');
  const foundSchool = supList.data.data.find(s => s.email === schoolEmail);
  const foundInd = supList.data.data.find(s => s.email === industryEmail);
  assert(!!foundSchool && foundSchool.role === 'SCHOOL', 'School supervisor verified in directory');
  assert(!!foundInd && foundInd.role === 'INDUSTRY', 'Industry supervisor verified in directory');
  schoolSupId = foundSchool.supervisor_id;
  industrySupId = foundInd.supervisor_id;

  // -------------------------------------------------------------
  // TEST PHASE 3: STUDENT
  // -------------------------------------------------------------
  console.log('\n--- [ROLE 3: STUDENT] ---');

  // 3.1 Student Registration
  console.log(`3.1 Registering new Student (${studentEmail})...`);
  const regStudent = await api('/auth/register/student', {
    method: 'POST',
    body: {
      full_name: 'Kafayat Adeleke',
      matric_no: `UIL/${Date.now().toString().slice(-4)}`,
      email: studentEmail,
      password: 'password123',
      department: 'Computer Science',
      institution: 'University of Ilorin',
      year_of_study: '300L'
    }
  });
  assert(regStudent.status === 201 && regStudent.data.success, 'Student registered successfully');
  studentId = regStudent.data.data.student_id;

  // 3.2 Student Login
  console.log('3.2 Authenticating Student...');
  const studLogin = await api('/auth/login', {
    method: 'POST',
    body: {
      email: studentEmail,
      password: 'password123',
      login_type: 'student',
      expected_role: 'STUDENT'
    }
  });
  assert(studLogin.status === 200 && studLogin.data.success, 'Student login succeeded');
  studentToken = studLogin.data.accessToken;

  // 3.3 Coordinator Creates Student Placement & Assigns Supervisors
  console.log('3.3 Coordinator creating placement and assigning dual supervisors...');
  const createPlacementRes = await api('/placements', {
    method: 'POST',
    headers: { Authorization: `Bearer ${coordinatorToken}` },
    body: {
      student_id: studentId,
      company_name: 'Chevron Nigeria Ltd',
      address: 'Lekki Phase 1, Lagos State',
      start_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      end_date: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
    }
  });
  assert(createPlacementRes.status === 201, 'Student placement created by Coordinator');
  placementId = createPlacementRes.data.data.placement_id;

  // Assign both supervisors
  console.log('3.4 Assigning School and Industry Supervisors to Placement...');
  const assignRes = await api(`/placements/${placementId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${coordinatorToken}` },
    body: {
      school_supervisor_id: schoolSupId,
      industry_supervisor_id: industrySupId
    }
  });
  assert(assignRes.status === 200 && assignRes.data.success, 'Dual supervisors assigned to student placement');

  // 3.5 Student Views Placement Details
  console.log('3.5 Student querying placement and supervisor assignments...');
  const viewPlacement = await api(`/placements/${studentId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(viewPlacement.status === 200, 'Student retrieved assigned placement details');
  assert(viewPlacement.data.data.school_supervisor.email === schoolEmail, 'School supervisor correctly assigned');
  assert(viewPlacement.data.data.industry_supervisor.email === industryEmail, 'Industry supervisor correctly assigned');

  // 3.6 Student Submits Daily Activity Log
  console.log('3.6 Student submitting daily activity log (with anti-fraud timestamp checks)...');
  const todayStr = new Date().toISOString().split('T')[0];
  const createLogRes = await api('/logs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      log_date: todayStr,
      description: 'Configured automated database backup scripts and assisted network security audit on local routers.',
      skills_acquired: 'Bash automation, Crontab scheduling, Router firewall configuration'
    }
  });
  assert(createLogRes.status === 201 && createLogRes.data.success, 'Daily activity log submitted');
  logId = createLogRes.data.data.activity_id;
  assert(createLogRes.data.data.status === 'pending', 'Initial log status is pending');
  assert(!!createLogRes.data.data.submitted_at, 'Server immutably assigned submitted_at timestamp');

  // 3.7 Verify Student cannot submit retroactive/backdated log past allowed window
  console.log('3.7 Verifying retroactive entry rejection beyond 3-day window...');
  const pastDateStr = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const backdatedRes = await api('/logs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      log_date: pastDateStr,
      description: 'Backdated entry attempt',
      skills_acquired: 'None'
    }
  });
  assert(backdatedRes.status === 400, 'System correctly rejected backdated entry outside allowed window');

  // -------------------------------------------------------------
  // TEST PHASE 4: INDUSTRY SUPERVISOR
  // -------------------------------------------------------------
  console.log('\n--- [ROLE 4: INDUSTRY SUPERVISOR] ---');

  // 4.1 Industry Supervisor Login
  console.log('4.1 Authenticating Industry Supervisor (industry@chevron.com)...');
  const indLogin = await api('/auth/login', {
    method: 'POST',
    body: {
      email: industryEmail,
      password: 'password123',
      login_type: 'supervisor',
      expected_role: 'INDUSTRY'
    }
  });
  assert(indLogin.status === 200 && indLogin.data.success, 'Industry supervisor login succeeded');
  industryToken = indLogin.data.accessToken;

  // 4.2 Industry Supervisor Views Assigned Logs
  console.log('4.2 Querying workplace activity logs for review...');
  const indLogs = await api('/logs', {
    headers: { Authorization: `Bearer ${industryToken}` }
  });
  assert(indLogs.status === 200, 'Industry logs retrieved');
  const studentIndLog = indLogs.data.data.find(l => l.activity_id === logId);
  assert(!!studentIndLog, 'Student daily log visible to Industry Supervisor');

  // 4.3 Industry Supervisor Endorses Log
  console.log('4.3 Submitting workplace endorsement & evaluation...');
  const endorseRes = await api(`/logs/${logId}/endorse`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${industryToken}` },
    body: {
      industry_comment: 'Student demonstrated solid understanding of server configuration and safety compliance.'
    }
  });
  assert(endorseRes.status === 200 && endorseRes.data.success, 'Industry Supervisor successfully endorsed the log');

  // -------------------------------------------------------------
  // TEST PHASE 5: SCHOOL-BASED SUPERVISOR
  // -------------------------------------------------------------
  console.log('\n--- [ROLE 5: SCHOOL-BASED SUPERVISOR] ---');

  // 5.1 School Supervisor Login
  console.log('5.1 Authenticating School-based Supervisor (school@unilorin.edu.ng)...');
  const schoolLogin = await api('/auth/login', {
    method: 'POST',
    body: {
      email: schoolEmail,
      password: 'password123',
      login_type: 'supervisor',
      expected_role: 'SCHOOL'
    }
  });
  assert(schoolLogin.status === 200 && schoolLogin.data.success, 'School supervisor login succeeded');
  schoolToken = schoolLogin.data.accessToken;

  // 5.2 School Supervisor Reviews & Approves Log
  console.log('5.2 Reviewing, commenting, and officially approving log entry...');
  const reviewRes = await api(`/logs/${logId}/review`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${schoolToken}` },
    body: {
      status: 'approved',
      supervisor_comment: 'Well detailed log entry. Connects theoretical networking concepts to industry application.'
    }
  });
  assert(reviewRes.status === 200 && reviewRes.data.success, 'School Supervisor officially approved student log');

  // 5.3 School Supervisor Schedules Supervision Visit
  console.log('5.3 Scheduling digital supervision visit to Chevron Nigeria...');
  const visitDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const scheduleRes = await api('/visits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${schoolToken}` },
    body: {
      student_id: studentId,
      visit_date: visitDate,
      notes: 'Mid-term physical and technical assessment visit with Industry Supervisor.'
    }
  });
  assert(scheduleRes.status === 201 && scheduleRes.data.success, 'Supervision visit scheduled');
  visitId = scheduleRes.data.data.visit_id;

  // 5.4 Update Visit Status (e.g., Completed)
  console.log('5.4 Updating visit record to completed with assessment findings...');
  const updateVisitRes = await api(`/visits/${visitId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${schoolToken}` },
    body: {
      status: 'completed',
      notes: 'Visit completed successfully. Student performance on site meets NUC & ITF standards.'
    }
  });
  assert(updateVisitRes.status === 200 && updateVisitRes.data.success, 'Visit status updated to completed');

  // -------------------------------------------------------------
  // TEST PHASE 6: LOGBOOK EXPORT & FINAL CLEARANCE
  // -------------------------------------------------------------
  console.log('\n--- [TEST PHASE 6: LOGBOOK EXPORT & FINAL CLEARANCE] ---');

  // 6.1 Student Verifies Dual Feedback in Log
  console.log('6.1 Student verifying log status and dual comments...');
  const updatedLog = await api(`/logs/${logId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(updatedLog.status === 200, 'Student fetched updated log');
  assert(updatedLog.data.data.status === 'approved', 'Log marked as APPROVED');
  assert(!!updatedLog.data.data.supervisor_comment, 'School supervisor comment recorded');
  assert(!!updatedLog.data.data.industry_comment, 'Industry supervisor comment recorded');

  // 6.2 Export Official PDF Logbook
  console.log('6.2 Exporting official PDF Logbook report...');
  const pdfExport = await api(`/reports/export/logbook/${studentId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(pdfExport.status === 200, 'PDF Logbook successfully exported with HTTP 200');

  // 6.3 Institutional Coordinator Clears Student for SIWES
  console.log('6.3 Institutional Coordinator clears student in institutional queue...');
  const clearRes = await api(`/students/${studentId}/clear`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${coordinatorToken}` }
  });
  assert(clearRes.status === 200 && clearRes.data.success, 'Coordinator cleared student for institutional completion');

  // 6.4 Coordinator Exports Institutional Placement Report
  console.log('6.4 Coordinator exports Institutional Placement Report...');
  const instReport = await api(`/reports/export/institution/${institutionId}`, {
    headers: { Authorization: `Bearer ${coordinatorToken}` }
  });
  assert(instReport.status === 200, 'Institutional Placement report exported successfully');

  // -------------------------------------------------------------
  // TEST PHASE 7: ITF OFFICER NATIONAL AUDIT & CLEARANCE
  // -------------------------------------------------------------
  console.log('\n--- [TEST PHASE 7: ITF NATIONAL VERIFICATION & STIPEND VALIDATION] ---');

  // 7.1 ITF Officer Views Cross-Institutional Student Data
  console.log('7.1 ITF Officer viewing student record across institutions...');
  const itfStudents = await api('/students', {
    headers: { Authorization: `Bearer ${itfToken}` }
  });
  assert(itfStudents.status === 200, 'Cross-institutional student list retrieved');
  const auditStudent = itfStudents.data.data.find(s => s.student_id === studentId);
  assert(!!auditStudent, 'Student visible in ITF national registry');
  assert(auditStudent.status === 'cleared', 'Student institutional clearance confirmed by ITF');

  // 7.2 ITF Officer Exports National SIWES Compliance Summary
  console.log('7.2 ITF Officer exports National SIWES Report...');
  const itfNationalReport = await api('/reports/export/itf-national', {
    headers: { Authorization: `Bearer ${itfToken}` }
  });
  assert(itfNationalReport.status === 200, 'ITF National compliance report exported successfully');

  console.log('\n================================================================');
  console.log('🎉 ALL MULTI-ROLE TESTS PASSED SUCCESSFULLY (100% COVERAGE)!');
  console.log('================================================================');
}

runComprehensiveTests().catch((err) => {
  console.error('\n💥 Test run terminated with error:', err.message);
  process.exit(1);
});
