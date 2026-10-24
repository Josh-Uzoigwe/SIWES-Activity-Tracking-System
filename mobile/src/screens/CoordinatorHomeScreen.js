import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api, { getFileUrl } from '../api/client';

const TABS = [
  { id: 'students', label: 'Students & Clearance' },
  { id: 'supervisors', label: 'Supervisors Directory' },
  { id: 'exports', label: 'Institutional Reports' },
];

const CoordinatorHomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  // Modals state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    matric_no: '',
    email: '',
    password: '',
    department: '',
    year_of_study: '300L',
  });
  const [submittingStudent, setSubmittingStudent] = useState(false);

  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorForm, setSupervisorForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'SCHOOL',
    department: '',
    company: '',
  });
  const [submittingSupervisor, setSubmittingSupervisor] = useState(false);

  // Placement Modal
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [placementForm, setPlacementForm] = useState({
    company_name: '',
    address: '',
    start_date: '',
    end_date: '',
    school_supervisor_id: '',
    industry_supervisor_id: '',
  });
  const [submittingPlacement, setSubmittingPlacement] = useState(false);

  // Flag Student Modal
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagStudentId, setFlagStudentId] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [analyticsRes, studentsRes, supervisorsRes] = await Promise.all([
        api.get('/analytics').catch(() => ({ data: { success: false, data: null } })),
        api.get('/students').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/auth/supervisors').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
      if (studentsRes.data?.success) setStudents(studentsRes.data.data || []);
      if (supervisorsRes.data?.success) setSupervisors(supervisorsRes.data.data || []);
    } catch (err) {
      console.warn('Failed to fetch coordinator records', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openDownload = (path) => {
    const url = getFileUrl(path);
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Download Error', 'Unable to open file. Please verify network connection.');
      });
    }
  };

  // 1. Clear Student
  const handleClearStudent = async (studentId) => {
    try {
      const res = await api.put(`/students/${studentId}/clear`);
      if (res.data?.success) {
        Alert.alert('Student Cleared', 'Student cleared for SIWES academic credits and logbook access.');
        loadData();
      }
    } catch (err) {
      Alert.alert('Action Error', err.response?.data?.message || 'Failed to clear student.');
    }
  };

  // 2. Flag Student
  const handleFlagSubmit = async () => {
    if (!flagReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for flagging this student.');
      return;
    }
    setSubmittingFlag(true);
    try {
      const res = await api.put(`/students/${flagStudentId}/reject`, { reason: flagReason.trim() });
      if (res.data?.success) {
        Alert.alert('Student Flagged', 'Student clearance flagged and notified.');
        setShowFlagModal(false);
        setFlagReason('');
        setFlagStudentId(null);
        loadData();
      }
    } catch (err) {
      Alert.alert('Flag Error', err.response?.data?.message || 'Failed to flag student.');
    } finally {
      setSubmittingFlag(false);
    }
  };

  // 3. Register Student
  const handleRegisterStudent = async () => {
    const { full_name, matric_no, email, password, department } = studentForm;
    if (!full_name.trim() || !matric_no.trim() || !email.trim() || !password.trim() || !department.trim()) {
      Alert.alert('Required Fields', 'Please complete all required fields.');
      return;
    }
    setSubmittingStudent(true);
    try {
      const res = await api.post('/auth/register/student', {
        ...studentForm,
        institution: user.institution || 'Accredited Institution',
      });
      if (res.data?.success) {
        Alert.alert('Student Registered', `${full_name} enrolled successfully.`);
        setShowStudentModal(false);
        setStudentForm({
          full_name: '',
          matric_no: '',
          email: '',
          password: '',
          department: '',
          year_of_study: '300L',
        });
        loadData();
      }
    } catch (err) {
      Alert.alert('Registration Error', err.response?.data?.message || 'Failed to register student.');
    } finally {
      setSubmittingStudent(false);
    }
  };

  // 4. Register Supervisor
  const handleRegisterSupervisor = async () => {
    const { full_name, email, password, role } = supervisorForm;
    if (!full_name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please complete all required fields.');
      return;
    }
    setSubmittingSupervisor(true);
    try {
      const res = await api.post('/auth/register/supervisor', {
        ...supervisorForm,
        institution: user.institution || 'Accredited Institution',
      });
      if (res.data?.success) {
        Alert.alert('Supervisor Registered', `${full_name} (${role}) registered.`);
        setShowSupervisorModal(false);
        setSupervisorForm({
          full_name: '',
          email: '',
          password: '',
          role: 'SCHOOL',
          department: '',
          company: '',
        });
        loadData();
      }
    } catch (err) {
      Alert.alert('Registration Error', err.response?.data?.message || 'Failed to register supervisor.');
    } finally {
      setSubmittingSupervisor(false);
    }
  };

  // 5. Open Placement Modal
  const openPlacementModal = (student) => {
    setSelectedStudent(student);
    const existing = student.placements?.[0];
    setPlacementForm({
      company_name: existing?.company_name || '',
      address: existing?.address || '',
      start_date: existing?.start_date ? existing.start_date.split('T')[0] : '',
      end_date: existing?.end_date ? existing.end_date.split('T')[0] : '',
      school_supervisor_id: existing?.school_supervisor?.supervisor_id ? String(existing.school_supervisor.supervisor_id) : '',
      industry_supervisor_id: existing?.industry_supervisor?.supervisor_id ? String(existing.industry_supervisor.supervisor_id) : '',
    });
    setShowPlacementModal(true);
  };

  // 6. Save Placement / Assign School Supervisor
  const handleSavePlacement = async () => {
    setSubmittingPlacement(true);
    try {
      const existing = selectedStudent.placements?.[0];
      let placementId = existing?.placement_id;

      if (!placementId) {
        if (!placementForm.company_name.trim() || !placementForm.address.trim()) {
          Alert.alert('Required Fields', 'Please provide company name and address to create attachment record.');
          setSubmittingPlacement(false);
          return;
        }
        const createRes = await api.post('/placements', {
          student_id: selectedStudent.student_id,
          company_name: placementForm.company_name,
          address: placementForm.address,
          start_date: placementForm.start_date,
          end_date: placementForm.end_date,
        });
        placementId = createRes.data?.data?.placement_id;
      }

      if (placementId) {
        await api.put(`/placements/${placementId}`, {
          school_supervisor_id: placementForm.school_supervisor_id ? parseInt(placementForm.school_supervisor_id, 10) : null,
          industry_supervisor_id: placementForm.industry_supervisor_id ? parseInt(placementForm.industry_supervisor_id, 10) : undefined,
          company_name: placementForm.company_name || undefined,
          address: placementForm.address || undefined,
        });
      }

      Alert.alert('Supervisor Assigned', 'School-based supervisor allocated successfully.');
      setShowPlacementModal(false);
      loadData();
    } catch (err) {
      Alert.alert('Assignment Error', err.response?.data?.message || 'Failed to update placement.');
    } finally {
      setSubmittingPlacement(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.matric_no?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  const filteredSupervisors = supervisors.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.company?.toLowerCase().includes(q)
    );
  });

  const pendingClearanceCount = students.filter((s) => s.status !== 'cleared').length;
  const activePlacementsCount = students.filter((s) => (s.placements?.length || 0) > 0).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.coordBadge}>
              <Text style={styles.coordBadgeText}>COORDINATOR PORTAL</Text>
            </View>
            <Text style={styles.instCode}>{user?.institution || 'Academic Institution'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'SIWES Coordinator'}</Text>
          <Text style={styles.userRole}>Institutional SIWES Director</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
      >
        {/* Quick Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionBtnPill, styles.actionBtnPillPrimary]}
            onPress={() => setShowStudentModal(true)}
          >
            <Ionicons name="person-add" size={14} color="#ffffff" />
            <Text style={[styles.actionBtnPillText, { color: '#ffffff' }]}>+ Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnPill}
            onPress={() => setShowSupervisorModal(true)}
          >
            <Ionicons name="people-outline" size={14} color="#0f172a" />
            <Text style={styles.actionBtnPillText}>+ Supervisor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnPill}
            onPress={() => openDownload(`/api/v1/reports/export/institution/${encodeURIComponent(user?.institution || 'FUTO')}?format=pdf`)}
          >
            <Ionicons name="document-text-outline" size={14} color="#0f172a" />
            <Text style={styles.actionBtnPillText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        {/* 4 KPI Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScrollView}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Enrolled</Text>
              <Ionicons name="school-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.kpiValue}>{students.length}</Text>
            <Text style={styles.kpiMeta}>Total SIWES students</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Placements</Text>
              <Ionicons name="business-outline" size={16} color="#059669" />
            </View>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{activePlacementsCount}</Text>
            <Text style={styles.kpiMeta}>Company attached</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Supervisors</Text>
              <Ionicons name="people-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.kpiValue}>{supervisors.length}</Text>
            <Text style={styles.kpiMeta}>School & Industry</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Pending</Text>
              <Ionicons name="alert-circle-outline" size={16} color="#b45309" />
            </View>
            <Text style={[styles.kpiValue, { color: '#b45309' }]}>{pendingClearanceCount}</Text>
            <Text style={styles.kpiMeta}>Awaiting clearance</Text>
          </View>
        </ScrollView>

        {/* Search Bar */}
        {activeTab !== 'exports' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={16} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by student name, matric no, department..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollView}>
          <View style={styles.tabsRow}>
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setActiveTab(t.id)}
                >
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Tab Body */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Loading institutional records...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: Students Roster & Clearance */}
            {activeTab === 'students' && (
              <View style={styles.tabContent}>
                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={42} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No students match query</Text>
                  </View>
                ) : (
                  filteredStudents.map((s) => {
                    const isCleared = s.status === 'cleared';
                    const isRejected = s.status === 'rejected';
                    const placement = s.placements?.[0];

                    return (
                      <View key={s.student_id} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{s.full_name}</Text>
                            <Text style={styles.cardMeta}>{s.matric_no} • {s.department} ({s.year_of_study})</Text>
                            {s.account_number ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <Ionicons name="card-outline" size={11} color="#15803d" />
                                <Text style={{ fontSize: 10, color: '#15803d', fontWeight: '700' }}>
                                  {s.bank_name} • {s.account_number}
                                </Text>
                              </View>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <Ionicons name="alert-circle-outline" size={11} color="#b45309" />
                                <Text style={{ fontSize: 10, color: '#b45309', fontWeight: '600' }}>
                                  No Bank Details Registered
                                </Text>
                              </View>
                            )}
                          </View>
                          {isCleared ? (
                            <View style={[styles.badge, styles.badgeSuccess]}>
                              <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                              <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Cleared</Text>
                            </View>
                          ) : isRejected ? (
                            <View style={[styles.badge, styles.badgeDanger]}>
                              <Ionicons name="close-circle" size={12} color="#b91c1c" />
                              <Text style={[styles.badgeText, styles.badgeTextDanger]}>Flagged</Text>
                            </View>
                          ) : (
                            <View style={[styles.badge, styles.badgeWarning]}>
                              <Ionicons name="time" size={12} color="#b45309" />
                              <Text style={[styles.badgeText, styles.badgeTextWarning]}>Pending</Text>
                            </View>
                          )}
                        </View>

                        {/* Placement details */}
                        <View style={styles.placementBox}>
                          <Text style={styles.placementBoxTitle}>Attachment & Supervision:</Text>
                          {placement ? (
                            <>
                              <Text style={styles.placementCompany}>{placement.company_name}</Text>
                              <Text style={styles.placementAddress}>{placement.address || 'Address on file'}</Text>
                              <Text style={styles.placementSupervisors}>
                                School Supervisor: {placement.school_supervisor?.full_name || 'Unassigned'}
                              </Text>
                              <Text style={[styles.placementSupervisors, { marginTop: 1 }]}>
                                Industry Supervisor: {placement.industry_supervisor_name || placement.industry_supervisor?.full_name || 'Not provided'}
                                {placement.industry_supervisor_phone ? ` (${placement.industry_supervisor_phone})` : ''}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.noPlacementText}>Student has not registered place of attachment yet.</Text>
                          )}
                        </View>

                        {/* Actions */}
                        <View style={styles.cardActionsRow}>
                          {!isCleared && (
                            <>
                              <TouchableOpacity
                                style={[styles.btnMini, styles.btnClear]}
                                onPress={() => handleClearStudent(s.student_id)}
                              >
                                <Ionicons name="checkmark-outline" size={14} color="#ffffff" />
                                <Text style={styles.btnMiniText}>Clear</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.btnMini, styles.btnFlag]}
                                onPress={() => {
                                  setFlagStudentId(s.student_id);
                                  setShowFlagModal(true);
                                }}
                              >
                                <Ionicons name="flag-outline" size={14} color="#ffffff" />
                                <Text style={styles.btnMiniText}>Flag</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          <TouchableOpacity
                            style={[styles.btnMini, styles.btnPlacement]}
                            onPress={() => openPlacementModal(s)}
                          >
                            <Ionicons name="person-add-outline" size={14} color="#0f172a" />
                            <Text style={[styles.btnMiniText, { color: '#0f172a' }]}>
                              {placement?.school_supervisor ? 'Change School Supervisor' : 'Assign School Supervisor'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.btnMini, styles.btnLogbook]}
                            onPress={() => openDownload(`/api/v1/reports/export/logbook/${s.student_id}`)}
                          >
                            <Ionicons name="download-outline" size={14} color="#0f172a" />
                            <Text style={[styles.btnMiniText, { color: '#0f172a' }]}>PDF</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 2: Supervisors Directory */}
            {activeTab === 'supervisors' && (
              <View style={styles.tabContent}>
                {filteredSupervisors.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={42} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No supervisors registered</Text>
                  </View>
                ) : (
                  filteredSupervisors.map((sup) => {
                    const isSchool = sup.role === 'SCHOOL';

                    return (
                      <View key={sup.supervisor_id} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{sup.full_name}</Text>
                            <Text style={styles.cardMeta}>{sup.email}</Text>
                          </View>
                          <View style={[styles.badge, isSchool ? styles.badgeSchool : styles.badgeIndustry]}>
                            <Text style={[styles.badgeText, isSchool ? styles.badgeTextSchool : styles.badgeTextIndustry]}>
                              {isSchool ? 'Academic Sup.' : 'Industry Sup.'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.supOrgText}>
                          {isSchool ? `Department: ${sup.department || 'General'}` : `Company: ${sup.company || 'Host Organization'}`}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 3: Reports & Institutional Exports */}
            {activeTab === 'exports' && (
              <View style={styles.tabContent}>
                <View style={styles.exportCard}>
                  <View style={styles.exportHeader}>
                    <Ionicons name="document-text" size={32} color="#0f172a" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exportTitle}>Institutional SIWES Report (PDF)</Text>
                      <Text style={styles.exportSubtitle}>
                        Complete institutional summary with enrolled student placements, academic supervision status, and completion analytics.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.primaryExportBtn}
                    onPress={() => openDownload(`/api/v1/reports/export/institution/${encodeURIComponent(user?.institution || 'FUTO')}?format=pdf`)}
                  >
                    <Ionicons name="download-outline" size={16} color="#ffffff" />
                    <Text style={styles.primaryExportBtnText}>Download PDF Institutional Report</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.exportCard}>
                  <View style={styles.exportHeader}>
                    <Ionicons name="grid-outline" size={32} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exportTitle}>Institutional CSV Data Extract</Text>
                      <Text style={styles.exportSubtitle}>
                        Export all student placements, assigned supervisor contact details, and clearance records into spreadsheet format.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.secondaryExportBtn}
                    onPress={() => openDownload(`/api/v1/reports/export/institution/${encodeURIComponent(user?.institution || 'FUTO')}?format=csv`)}
                  >
                    <Ionicons name="download-outline" size={16} color="#0f172a" />
                    <Text style={styles.secondaryExportBtnText}>Download CSV Data Extract</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Register Student Modal */}
      <Modal visible={showStudentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Student for SIWES</Text>
              <TouchableOpacity onPress={() => setShowStudentModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Adeyemi Taiwo"
                value={studentForm.full_name}
                onChangeText={(t) => setStudentForm({ ...studentForm, full_name: t })}
              />

              <Text style={styles.inputLabel}>Matriculation Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. UIL/2022/7054"
                value={studentForm.matric_no}
                onChangeText={(t) => setStudentForm({ ...studentForm, matric_no: t })}
              />

              <Text style={styles.inputLabel}>Department *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Computer Science"
                value={studentForm.department}
                onChangeText={(t) => setStudentForm({ ...studentForm, department: t })}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="student@university.edu.ng"
                autoCapitalize="none"
                keyboardType="email-address"
                value={studentForm.email}
                onChangeText={(t) => setStudentForm({ ...studentForm, email: t })}
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="••••••••"
                secureTextEntry
                value={studentForm.password}
                onChangeText={(t) => setStudentForm({ ...studentForm, password: t })}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowStudentModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingStudent && styles.disabledBtn]}
                disabled={submittingStudent}
                onPress={handleRegisterStudent}
              >
                {submittingStudent ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>Enroll Student</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Register Supervisor Modal */}
      <Modal visible={showSupervisorModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Supervisor</Text>
              <TouchableOpacity onPress={() => setShowSupervisorModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Supervisor Role *</Text>
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[styles.rolePickerBtn, supervisorForm.role === 'SCHOOL' && styles.rolePickerBtnActive]}
                  onPress={() => setSupervisorForm({ ...supervisorForm, role: 'SCHOOL' })}
                >
                  <Text style={[styles.rolePickerText, supervisorForm.role === 'SCHOOL' && styles.rolePickerTextActive]}>
                    Academic / School
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rolePickerBtn, supervisorForm.role === 'INDUSTRY' && styles.rolePickerBtnActive]}
                  onPress={() => setSupervisorForm({ ...supervisorForm, role: 'INDUSTRY' })}
                >
                  <Text style={[styles.rolePickerText, supervisorForm.role === 'INDUSTRY' && styles.rolePickerTextActive]}>
                    Industry / Workplace
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Dr. Jane Smith"
                value={supervisorForm.full_name}
                onChangeText={(t) => setSupervisorForm({ ...supervisorForm, full_name: t })}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="supervisor@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={supervisorForm.email}
                onChangeText={(t) => setSupervisorForm({ ...supervisorForm, email: t })}
              />

              {supervisorForm.role === 'SCHOOL' ? (
                <>
                  <Text style={styles.inputLabel}>Academic Department</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Mechanical Engineering"
                    value={supervisorForm.department}
                    onChangeText={(t) => setSupervisorForm({ ...supervisorForm, department: t })}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Company / Host Organization</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Shell Nigeria"
                    value={supervisorForm.company}
                    onChangeText={(t) => setSupervisorForm({ ...supervisorForm, company: t })}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="••••••••"
                secureTextEntry
                value={supervisorForm.password}
                onChangeText={(t) => setSupervisorForm({ ...supervisorForm, password: t })}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSupervisorModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingSupervisor && styles.disabledBtn]}
                disabled={submittingSupervisor}
                onPress={handleRegisterSupervisor}
              >
                {submittingSupervisor ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>Create Account</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Placement / Supervisor Allocation Modal */}
      <Modal visible={showPlacementModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Assign School-Based Supervisor</Text>
                <Text style={styles.modalSubtitle}>{selectedStudent?.full_name} ({selectedStudent?.matric_no})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPlacementModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedStudent?.placements?.[0]?.company_name ? (
                <View style={{ backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: '#15803d', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>
                    Student-Reported Place of Attachment:
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a', marginTop: 2 }}>
                    {selectedStudent.placements[0].company_name}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#475569' }}>
                    {selectedStudent.placements[0].address}
                  </Text>
                  {selectedStudent.placements[0].industry_supervisor_name ? (
                    <Text style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>
                      On-Site Industry Trainer: {selectedStudent.placements[0].industry_supervisor_name}
                      {selectedStudent.placements[0].industry_supervisor_phone ? ` (${selectedStudent.placements[0].industry_supervisor_phone})` : ''}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Host Company Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. TechCorp Nigeria Ltd"
                value={placementForm.company_name}
                onChangeText={(t) => setPlacementForm({ ...placementForm, company_name: t })}
              />

              <Text style={styles.inputLabel}>Company Physical Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 15 Marina St, Lagos"
                value={placementForm.address}
                onChangeText={(t) => setPlacementForm({ ...placementForm, address: t })}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-06-01"
                    value={placementForm.start_date}
                    onChangeText={(t) => setPlacementForm({ ...placementForm, start_date: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-12-01"
                    value={placementForm.end_date}
                    onChangeText={(t) => setPlacementForm({ ...placementForm, end_date: t })}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Select Academic Supervisor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {supervisors
                  .filter((s) => s.role === 'SCHOOL')
                  .map((sup) => {
                    const active = placementForm.school_supervisor_id === String(sup.supervisor_id);
                    return (
                      <TouchableOpacity
                        key={sup.supervisor_id}
                        style={[styles.supSelectPill, active && styles.supSelectPillActive]}
                        onPress={() =>
                          setPlacementForm({
                            ...placementForm,
                            school_supervisor_id: active ? '' : String(sup.supervisor_id),
                          })
                        }
                      >
                        <Text style={[styles.supSelectPillText, active && styles.supSelectPillTextActive]}>
                          {sup.full_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              <Text style={styles.inputLabel}>Select Industry Supervisor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {supervisors
                  .filter((s) => s.role === 'INDUSTRY')
                  .map((sup) => {
                    const active = placementForm.industry_supervisor_id === String(sup.supervisor_id);
                    return (
                      <TouchableOpacity
                        key={sup.supervisor_id}
                        style={[styles.supSelectPill, active && styles.supSelectPillActive]}
                        onPress={() =>
                          setPlacementForm({
                            ...placementForm,
                            industry_supervisor_id: active ? '' : String(sup.supervisor_id),
                          })
                        }
                      >
                        <Text style={[styles.supSelectPillText, active && styles.supSelectPillTextActive]}>
                          {sup.full_name} ({sup.company || 'Host'})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPlacementModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingPlacement && styles.disabledBtn]}
                disabled={submittingPlacement}
                onPress={handleSavePlacement}
              >
                {submittingPlacement ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>Save Placement</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Flag Reason Modal */}
      <Modal visible={showFlagModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Flag Student Clearance</Text>
            <Text style={styles.modalSubtitle}>State the reason why student clearance is rejected or flagged.</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
              placeholder="e.g. Department or matriculation mismatch"
              multiline
              value={flagReason}
              onChangeText={setFlagReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowFlagModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#b91c1c' }, submittingFlag && styles.disabledBtn]}
                disabled={submittingFlag}
                onPress={handleFlagSubmit}
              >
                {submittingFlag ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>Flag Student</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  coordBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coordBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  instCode: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  scrollBody: {
    paddingBottom: 40,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  actionBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  actionBtnPillPrimary: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  actionBtnPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  kpiScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    width: 140,
    marginRight: 10,
    elevation: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  tabsScrollView: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0f172a',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  badgeTextSuccess: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeWarning: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  badgeTextWarning: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeDanger: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  badgeTextDanger: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeSchool: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  badgeTextSchool: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeIndustry: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  badgeTextIndustry: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  placementBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  placementBoxTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  placementCompany: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  placementAddress: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  placementSupervisors: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  noPlacementText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  btnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnClear: {
    backgroundColor: '#15803d',
  },
  btnFlag: {
    backgroundColor: '#dc2626',
  },
  btnPlacement: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnLogbook: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  supOrgText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  exportCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  exportHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  exportSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  primaryExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 10,
  },
  primaryExportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryExportBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  centerLoading: {
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalForm: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  rolePickerBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  rolePickerBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  rolePickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  rolePickerTextActive: {
    color: '#ffffff',
  },
  supSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  supSelectPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  supSelectPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  supSelectPillTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});

export default CoordinatorHomeScreen;
