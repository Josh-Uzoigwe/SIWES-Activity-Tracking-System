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
import StatusBadge from '../components/StatusBadge';

const TABS = [
  { id: 'reports', label: 'Final Reports & Stipends' },
  { id: 'students', label: 'Cross-Institutional Students' },
  { id: 'institutions', label: 'Accredited Institutions' },
  { id: 'exports', label: 'National Reports & Exports' },
];

const ItfHomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [finalReports, setFinalReports] = useState([]);
  const [institutionsList, setInstitutionsList] = useState([]);
  const [supervisorsList, setSupervisorsList] = useState([]);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstFilter, setSelectedInstFilter] = useState('ALL');

  // Onboard Institution Modal
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    code: '',
    state: '',
    coordinator_name: '',
    coordinator_email: '',
    password: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [analyticsRes, studentsRes, reportsRes, instRes, supRes] = await Promise.all([
        api.get('/analytics').catch(() => ({ data: { success: false, data: null } })),
        api.get('/students').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/final').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/institutions').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/auth/supervisors').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
      if (studentsRes.data?.success) setStudents(studentsRes.data.data || []);
      if (reportsRes.data?.success) setFinalReports(reportsRes.data.data || []);
      if (instRes.data?.success) setInstitutionsList(instRes.data.data || []);
      if (supRes.data?.success) setSupervisorsList(supRes.data.data || []);
    } catch (err) {
      console.warn('Failed to load ITF officer records', err);
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

  // Authorize Stipend
  const handleVerifyStipend = async (reportId) => {
    try {
      setActionLoading(reportId);
      const res = await api.put(`/reports/final/${reportId}/verify`);
      if (res.data?.success) {
        Alert.alert('Stipend Authorized', 'Stipend verified successfully. Student has been notified for disbursement.');
        setFinalReports((prev) =>
          prev.map((r) =>
            r.report_id === reportId ? { ...r, stipend_verified: true, verified_at: new Date() } : r
          )
        );
      }
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'Failed to verify stipend.');
    } finally {
      setActionLoading(null);
    }
  };

  // Onboard Institution + Coordinator
  const handleOnboardSubmit = async () => {
    const { name, code, state, coordinator_name, coordinator_email, password } = onboardForm;
    if (!name.trim() || !code.trim() || !coordinator_name.trim() || !coordinator_email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please complete all required fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Coordinator password must be at least 8 characters long.');
      return;
    }

    setOnboardingSubmitting(true);
    try {
      const res = await api.post('/institutions', onboardForm);
      if (res.data?.success) {
        Alert.alert(
          'Accredited Successfully',
          `Accredited ${name} (${code.toUpperCase()}) and created Coordinator account for ${coordinator_name}.`
        );
        setShowOnboardModal(false);
        setOnboardForm({
          name: '',
          code: '',
          state: '',
          coordinator_name: '',
          coordinator_email: '',
          password: '',
        });
        loadData();
      }
    } catch (err) {
      Alert.alert('Onboarding Error', err.response?.data?.message || 'Failed to onboard institution.');
    } finally {
      setOnboardingSubmitting(false);
    }
  };

  const openDownload = (path) => {
    const url = getFileUrl(path);
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Download Error', 'Unable to open document. Please verify network connection.');
      });
    }
  };

  // Counts
  const verifiedCount = finalReports.filter((r) => r.stipend_verified).length;
  const pendingCount = finalReports.filter((r) => !r.stipend_verified).length;

  // Filtered lists
  const institutionOptions = ['ALL', ...new Set(institutionsList.map((i) => i.name).filter(Boolean))];

  const filteredReports = finalReports.filter((r) => {
    const matchesInst = selectedInstFilter === 'ALL' || r.student?.institution === selectedInstFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.student?.full_name?.toLowerCase().includes(q) ||
      r.student?.matric_no?.toLowerCase().includes(q) ||
      r.student?.institution?.toLowerCase().includes(q);
    return matchesInst && matchesSearch;
  });

  const filteredStudents = students.filter((s) => {
    const matchesInst = selectedInstFilter === 'ALL' || s.institution === selectedInstFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.matric_no?.toLowerCase().includes(q) ||
      s.institution?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q);
    return matchesInst && matchesSearch;
  });

  const filteredInstitutions = institutionsList.filter((inst) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      inst.name?.toLowerCase().includes(q) ||
      inst.code?.toLowerCase().includes(q) ||
      inst.state?.toLowerCase().includes(q)
    );
  });

  // Render Sub-Views
  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      {filteredReports.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={42} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No final reports found</Text>
          <Text style={styles.emptySubtitle}>Student technical reports awaiting verification will appear here.</Text>
        </View>
      ) : (
        filteredReports.map((report) => {
          const isVerified = Boolean(report.stipend_verified);
          const submittedDate = new Date(report.submitted_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <View key={report.report_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{report.student?.full_name || 'Student'}</Text>
                  <Text style={styles.cardMeta}>
                    {report.student?.matric_no} • {report.student?.institution}
                  </Text>
                </View>
                {isVerified ? (
                  <View style={[styles.badge, styles.badgeSuccess]}>
                    <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                    <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Stipend Approved</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Ionicons name="time-outline" size={12} color="#b45309" />
                    <Text style={[styles.badgeText, styles.badgeTextWarning]}>Pending Audit</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.infoText}>Submitted: {submittedDate}</Text>
              </View>

              {report.file_url ? (
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => openDownload(report.file_url)}
                >
                  <Ionicons name="document-attach-outline" size={16} color="#0284c7" />
                  <Text style={styles.fileButtonText}>View Final Technical Report</Text>
                  <Ionicons name="open-outline" size={14} color="#0284c7" />
                </TouchableOpacity>
              ) : null}

              <View style={styles.cardActions}>
                {!isVerified ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.verifyBtn, actionLoading === report.report_id && styles.disabledBtn]}
                    disabled={actionLoading === report.report_id}
                    onPress={() => handleVerifyStipend(report.report_id)}
                  >
                    {actionLoading === report.report_id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark-outline" size={16} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Authorize Stipend Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.verifiedNotice}>
                    <Ionicons name="checkmark-done" size={15} color="#15803d" />
                    <Text style={styles.verifiedNoticeText}>
                      Authorized on {report.verified_at ? new Date(report.verified_at).toLocaleDateString() : 'Record'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderStudentsTab = () => (
    <View style={styles.tabContent}>
      {filteredStudents.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={42} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No students match query</Text>
        </View>
      ) : (
        filteredStudents.map((s) => {
          const placement = s.placements?.[0];
          const logsCount = s.activity_logs?.length || 0;
          const approvedCount = s.activity_logs?.filter((l) => l.status === 'approved').length || 0;
          const hasReport = (s.final_reports?.length || 0) > 0;

          return (
            <View key={s.student_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{s.full_name}</Text>
                  <Text style={styles.cardMeta}>{s.matric_no}</Text>
                </View>
                <View style={[styles.badge, s.status === 'cleared' ? styles.badgeSuccess : styles.badgeDefault]}>
                  <Text style={[styles.badgeText, s.status === 'cleared' ? styles.badgeTextSuccess : styles.badgeTextDefault]}>
                    {s.status === 'cleared' ? 'Cleared' : 'Registered'}
                  </Text>
                </View>
              </View>

              <Text style={styles.instLine}>{s.institution}</Text>
              <Text style={styles.deptLine}>{s.department} • {s.year_of_study}</Text>

              <View style={styles.divider} />

              <View style={styles.metricGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{approvedCount}/{logsCount}</Text>
                  <Text style={styles.metricLabel}>Verified Logs</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{placement ? placement.company_name : 'None'}</Text>
                  <Text style={styles.metricLabel}>Host Company</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: hasReport ? '#15803d' : '#b45309' }]}>
                    {hasReport ? 'Submitted' : 'Pending'}
                  </Text>
                  <Text style={styles.metricLabel}>Final Report</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.exportLogbookBtn}
                onPress={() => openDownload(`/api/v1/reports/export/logbook/${s.student_id}`)}
              >
                <Ionicons name="download-outline" size={15} color="#0f172a" />
                <Text style={styles.exportLogbookBtnText}>Download Official PDF Logbook</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  const renderInstitutionsTab = () => (
    <View style={styles.tabContent}>
      {filteredInstitutions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="business-outline" size={42} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No institutions found</Text>
        </View>
      ) : (
        filteredInstitutions.map((inst) => {
          const coord = supervisorsList.find(
            (s) => s.role === 'COORDINATOR' && s.institution === inst.name
          );
          const studentCount = students.filter((s) => s.institution === inst.name).length;

          return (
            <View key={inst.institution_id || inst.code} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{inst.name}</Text>
                  <Text style={styles.cardMeta}>Code: {inst.code} • {inst.state || 'Federal'} Region</Text>
                </View>
                <View style={[styles.badge, styles.badgeSuccess]}>
                  <Ionicons name="shield-checkmark" size={12} color="#15803d" />
                  <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Accredited</Text>
                </View>
              </View>

              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>Designated SIWES Coordinator:</Text>
                {coord ? (
                  <>
                    <Text style={styles.coordName}>{coord.full_name}</Text>
                    <Text style={styles.coordEmail}>{coord.email}</Text>
                  </>
                ) : (
                  <Text style={styles.coordEmpty}>Liaison officer assigned on federal record</Text>
                )}
              </View>

              <View style={styles.instFooter}>
                <Ionicons name="school-outline" size={14} color="#64748b" />
                <Text style={styles.instStudentCount}>{studentCount} Enrolled SIWES Students</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderExportsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.exportCard}>
        <View style={styles.exportHeader}>
          <Ionicons name="document-text" size={32} color="#0f172a" />
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>National SIWES PDF Audit Report</Text>
            <Text style={styles.exportSubtitle}>
              Standardized printable ministerial report containing participating universities, placement metrics, and stipend disbursement totals.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.primaryExportBtn}
          onPress={() => openDownload('/api/v1/reports/export/itf-national?format=pdf')}
        >
          <Ionicons name="download-outline" size={16} color="#ffffff" />
          <Text style={styles.primaryExportBtnText}>Download National PDF Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exportCard}>
        <View style={styles.exportHeader}>
          <Ionicons name="grid-outline" size={32} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>National CSV Data Extract</Text>
            <Text style={styles.exportSubtitle}>
              Raw tabulated cross-institutional records of all students, employers, weekly logs, and stipend clearance status for spreadsheets.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.secondaryExportBtn}
          onPress={() => openDownload('/api/v1/reports/export/itf-national?format=csv')}
        >
          <Ionicons name="download-outline" size={16} color="#0f172a" />
          <Text style={styles.secondaryExportBtnText}>Download National CSV File</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.federalBadge}>
              <Text style={styles.federalBadgeText}>FEDERAL OVERVIEW</Text>
            </View>
            <Text style={styles.itfLabel}>Industrial Training Fund</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'ITF SIWES Officer'}</Text>
          <Text style={styles.userRole}>National Compliance & Audit Officer</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
      >
        {/* Header Action Buttons */}
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => openDownload('/api/v1/reports/export/itf-national?format=csv')}
          >
            <Ionicons name="download-outline" size={14} color="#0f172a" />
            <Text style={styles.actionPillText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => openDownload('/api/v1/reports/export/itf-national?format=pdf')}
          >
            <Ionicons name="document-outline" size={14} color="#0f172a" />
            <Text style={styles.actionPillText}>PDF Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionPillBtn, styles.actionPillPrimary]}
            onPress={() => setShowOnboardModal(true)}
          >
            <Ionicons name="add" size={15} color="#ffffff" />
            <Text style={[styles.actionPillText, { color: '#ffffff' }]}>Onboard Inst.</Text>
          </TouchableOpacity>
        </View>

        {/* 5 KPI Metric Cards Carousel/Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScrollView}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Universities</Text>
              <Ionicons name="business-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.kpiValue}>{institutionsList.length}</Text>
            <Text style={styles.kpiMeta}>Accredited institutions</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Students</Text>
              <Ionicons name="people-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.kpiValue}>{analytics?.totalStudents ?? students.length}</Text>
            <Text style={styles.kpiMeta}>Nationwide enrolled</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Placements</Text>
              <Ionicons name="briefcase-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.kpiValue}>{analytics?.totalPlacements ?? 0}</Text>
            <Text style={styles.kpiMeta}>Active attachments</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Pending Stipends</Text>
              <Ionicons name="time-outline" size={16} color="#b45309" />
            </View>
            <Text style={[styles.kpiValue, { color: '#b45309' }]}>{pendingCount}</Text>
            <Text style={styles.kpiMeta}>Awaiting audit</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Authorized</Text>
              <Ionicons name="checkmark-circle-outline" size={16} color="#15803d" />
            </View>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>{verifiedCount}</Text>
            <Text style={styles.kpiMeta}>Cleared for stipend</Text>
          </View>
        </ScrollView>

        {/* Search & Institution Filter Bar */}
        {activeTab !== 'exports' && (
          <View style={styles.filterBar}>
            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={16} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students, matric, university..."
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

            {/* Institution Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.instFilterScrollView}>
              {institutionOptions.map((inst) => {
                const active = selectedInstFilter === inst;
                return (
                  <TouchableOpacity
                    key={inst}
                    style={[styles.instChip, active && styles.instChipActive]}
                    onPress={() => setSelectedInstFilter(inst)}
                  >
                    <Text style={[styles.instChipText, active && styles.instChipTextActive]}>
                      {inst === 'ALL' ? 'All Universities' : inst}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Navigation Tabs */}
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
            <Text style={styles.loadingText}>Loading federal SIWES data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'students' && renderStudentsTab()}
            {activeTab === 'institutions' && renderInstitutionsTab()}
            {activeTab === 'exports' && renderExportsTab()}
          </>
        )}
      </ScrollView>

      {/* Onboard Institution Modal */}
      <Modal visible={showOnboardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Onboard Tertiary Institution</Text>
                <Text style={styles.modalSubtitle}>Accredit an institution and assign its SIWES Coordinator</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOnboardModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Institution Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Obafemi Awolowo University"
                value={onboardForm.name}
                onChangeText={(t) => setOnboardForm({ ...onboardForm, name: t })}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Code *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. OAU"
                    autoCapitalize="characters"
                    value={onboardForm.code}
                    onChangeText={(t) => setOnboardForm({ ...onboardForm, code: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>State / Region</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Osun"
                    value={onboardForm.state}
                    onChangeText={(t) => setOnboardForm({ ...onboardForm, state: t })}
                  />
                </View>
              </View>

              <View style={styles.sectionDivider} />
              <Text style={styles.modalSectionTitle}>Designated Coordinator Account</Text>

              <Text style={styles.inputLabel}>Coordinator Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Prof. Bola Johnson"
                value={onboardForm.coordinator_name}
                onChangeText={(t) => setOnboardForm({ ...onboardForm, coordinator_name: t })}
              />

              <Text style={styles.inputLabel}>Coordinator Email *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="coordinator@university.edu.ng"
                autoCapitalize="none"
                keyboardType="email-address"
                value={onboardForm.coordinator_email}
                onChangeText={(t) => setOnboardForm({ ...onboardForm, coordinator_email: t })}
              />

              <Text style={styles.inputLabel}>Temporary Password (min 8 chars) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="••••••••"
                secureTextEntry
                value={onboardForm.password}
                onChangeText={(t) => setOnboardForm({ ...onboardForm, password: t })}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowOnboardModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, onboardingSubmitting && styles.disabledBtn]}
                disabled={onboardingSubmitting}
                onPress={handleOnboardSubmit}
              >
                {onboardingSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Accredit & Onboard</Text>
                )}
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
  federalBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  federalBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itfLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
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
  headerActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  actionPillBtn: {
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
  actionPillPrimary: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  actionPillText: {
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
    width: 145,
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
  filterBar: {
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
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  instFilterScrollView: {
    marginBottom: 4,
  },
  instChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  instChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  instChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  instChipTextActive: {
    color: '#ffffff',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  badgeDefault: {
    backgroundColor: '#f1f5f9',
  },
  badgeTextDefault: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  fileButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    flex: 1,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  verifyBtn: {
    backgroundColor: '#15803d',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  verifiedNoticeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600',
  },
  instLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  deptLine: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  exportLogbookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 6,
  },
  exportLogbookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  coordBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  coordName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  coordEmail: {
    fontSize: 11,
    color: '#475569',
  },
  coordEmpty: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  instFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  instStudentCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
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
  sectionDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
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
});

export default ItfHomeScreen;
