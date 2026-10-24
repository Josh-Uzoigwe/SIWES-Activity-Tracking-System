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
  ScrollView,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import api, { getFileUrl, uploadFinalReport } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { OFFICIAL_NIGERIAN_BANKS } from '../data/nigerianBanks';

const TABS = [
  { id: 'logs', label: 'Daily Logbook' },
  { id: 'placement', label: 'Placement & Final Report' },
];

const StudentHomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [finalReport, setFinalReport] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Report Upload Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Bank Details State
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
  });
  const [submittingBank, setSubmittingBank] = useState(false);

  // Placement Registration State
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    company_name: '',
    address: '',
    start_date: '',
    end_date: '',
    industry_supervisor_name: '',
    industry_supervisor_email: '',
    industry_supervisor_phone: '',
  });
  const [submittingPlacement, setSubmittingPlacement] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [logsRes, reportRes, placementRes, meRes] = await Promise.all([
        api.get('/logs').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/final/me').catch(() => ({ data: { success: false, data: null } })),
        api.get(`/placements/${user.id}`).catch(() => ({ data: { success: false, data: null } })),
        api.get('/auth/me').catch(() => ({ data: { success: false, data: null } })),
      ]);

      if (logsRes.data?.success) setLogs(logsRes.data.data || []);
      if (reportRes.data?.success) setFinalReport(reportRes.data.data);
      if (placementRes.data?.success && placementRes.data.data) {
        const pl = placementRes.data.data;
        setPlacement(pl);
        setPlacementForm({
          company_name: pl.company_name || '',
          address: pl.address || '',
          start_date: pl.start_date ? pl.start_date.split('T')[0] : '',
          end_date: pl.end_date ? pl.end_date.split('T')[0] : '',
          industry_supervisor_name: pl.industry_supervisor_name || '',
          industry_supervisor_email: pl.industry_supervisor_email || '',
          industry_supervisor_phone: pl.industry_supervisor_phone || '',
        });
      }
      if (meRes.data?.success && meRes.data.data) {
        const prof = meRes.data.data;
        setStudentProfile(prof);
        if (prof.bank_name || prof.account_number || prof.account_name) {
          setBankForm({
            bank_name: prof.bank_name || '',
            account_number: prof.account_number || '',
            account_name: prof.account_name || '',
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch student data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

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

  // Upload Photo/Document as Final Technical Report
  const pickAndSubmitReport = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to attach report document.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSubmittingReport(true);
        const uploaded = await uploadFinalReport(result.assets[0].uri);
        if (uploaded.success) {
          Alert.alert('Report Submitted', 'Final SIWES Technical Report submitted successfully for ITF audit and stipend clearance.');
          setShowReportModal(false);
          loadData();
        }
      }
    } catch (err) {
      Alert.alert('Upload Error', err.response?.data?.message || 'Failed to upload report file.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Save Official Commercial Bank Details
  const handleSaveBankDetails = async () => {
    if (!bankForm.bank_name) {
      Alert.alert('Bank Required', 'Please select your official commercial bank from the list.');
      return;
    }
    if (!/^\d{10}$/.test(bankForm.account_number)) {
      Alert.alert('Invalid Account', 'Please enter a valid 10-digit NUBAN account number.');
      return;
    }
    if (!bankForm.account_name.trim()) {
      Alert.alert('Account Name Required', 'Please enter your account name as registered with your bank.');
      return;
    }

    setSubmittingBank(true);
    try {
      const res = await api.put('/students/bank-details', bankForm);
      if (res.data?.success) {
        Alert.alert('Bank Details Saved', 'Official bank details registered for federal ITF stipend disbursement.');
        setShowBankModal(false);
        loadData();
      }
    } catch (err) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Failed to update bank details.');
    } finally {
      setSubmittingBank(false);
    }
  };

  // Self-Register / Update Place of Attachment
  const handleSavePlacement = async () => {
    if (!placementForm.company_name.trim() || !placementForm.address.trim()) {
      Alert.alert('Required Fields', 'Please enter host organization name and workplace address.');
      return;
    }

    setSubmittingPlacement(true);
    try {
      const res = await api.post('/placements', {
        ...placementForm,
        student_id: user.student_id || user.id,
      });
      if (res.data?.success) {
        Alert.alert('Attachment Saved', 'Place of attachment registered. Your institution coordinator will allocate your school supervisor.');
        setShowPlacementModal(false);
        loadData();
      }
    } catch (err) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Failed to save place of attachment.');
    } finally {
      setSubmittingPlacement(false);
    }
  };

  const approvedCount = logs.filter((l) => (l.status || '').toLowerCase() === 'approved').length;
  const pendingCount = logs.filter((l) => (l.status || '').toLowerCase() === 'pending').length;
  const isCleared = studentProfile?.status === 'cleared' || user?.status === 'cleared';

  const filteredLogs = logs.filter((l) => {
    if (statusFilter === 'all') return true;
    return (l.status || '').toLowerCase() === statusFilter;
  });

  const filteredBanks = OFFICIAL_NIGERIAN_BANKS.filter((b) =>
    b.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, isCleared ? styles.badgeCleared : styles.badgePendingClearance]}>
              <Text style={[styles.statusBadgeText, isCleared ? styles.textCleared : styles.textPendingClearance]}>
                {isCleared ? 'SIWES Cleared' : 'Pending Institutional Clearance'}
              </Text>
            </View>
          </View>
          <Text style={styles.studentName} numberOfLines={1}>
            {studentProfile?.full_name || user?.name || 'Student'}
          </Text>
          <Text style={styles.studentMeta}>
            {studentProfile?.matric_no || user?.matric_no} • {studentProfile?.department || 'Department'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
      >
        {/* Quick Actions Row */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionPrimary]}
            onPress={() => navigation.navigate('CreateLog')}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.quickActionPrimaryText}>Log Daily Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => openDownload(`/api/v1/reports/export/logbook/${user.id}`)}
          >
            <Ionicons name="download-outline" size={15} color="#0f172a" />
            <Text style={styles.quickActionSecondaryText}>Export Logbook</Text>
          </TouchableOpacity>
        </View>

        {/* 4 KPI Metric Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScrollView}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Logs</Text>
              <Ionicons name="book-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.kpiValue}>{logs.length}</Text>
            <Text style={styles.kpiMeta}>Submitted entries</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Approved</Text>
              <Ionicons name="checkmark-circle-outline" size={16} color="#15803d" />
            </View>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>{approvedCount}</Text>
            <Text style={styles.kpiMeta}>Academic credits</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Pending</Text>
              <Ionicons name="time-outline" size={16} color="#b45309" />
            </View>
            <Text style={[styles.kpiValue, { color: '#b45309' }]}>{pendingCount}</Text>
            <Text style={styles.kpiMeta}>Under review</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Final Report</Text>
              <Ionicons name="document-text-outline" size={16} color="#0284c7" />
            </View>
            <Text style={[styles.kpiValue, { color: finalReport ? '#15803d' : '#64748b', fontSize: 16, marginTop: 4 }]}>
              {finalReport ? (finalReport.stipend_verified ? 'Verified' : 'Submitted') : 'Pending'}
            </Text>
            <Text style={styles.kpiMeta}>Stipend clearance</Text>
          </View>
        </ScrollView>

        {/* Tabs */}
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

        {/* Tab 1: Daily Logbook */}
        {activeTab === 'logs' && (
          <View style={styles.tabContent}>
            {/* Filter Pills */}
            <View style={styles.filterChipsRow}>
              {['all', 'pending', 'approved', 'rejected'].map((k) => {
                const active = statusFilter === k;
                return (
                  <TouchableOpacity
                    key={k}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setStatusFilter(k)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {k === 'all' ? `All (${logs.length})` : k.charAt(0).toUpperCase() + k.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredLogs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="create-outline" size={42} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No activity entries recorded</Text>
                <TouchableOpacity
                  style={[styles.quickActionBtn, styles.quickActionPrimary, { marginTop: 12 }]}
                  onPress={() => navigation.navigate('CreateLog')}
                >
                  <Text style={styles.quickActionPrimaryText}>Create First Daily Log</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredLogs.map((item) => {
                const formattedDate = new Date(item.log_date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <TouchableOpacity
                    key={item.activity_id}
                    style={styles.card}
                    onPress={() => navigation.navigate('LogDetail', { log: item })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={styles.cardDate}>{formattedDate}</Text>
                      </View>
                      <StatusBadge status={item.status} />
                    </View>

                    <Text style={styles.logDescription} numberOfLines={3}>
                      {item.description}
                    </Text>

                    {item.skills_acquired ? (
                      <View style={styles.skillsTag}>
                        <Ionicons name="sparkles-outline" size={12} color="#0284c7" />
                        <Text style={styles.skillsTagText}>{item.skills_acquired}</Text>
                      </View>
                    ) : null}

                    {item.supervisor_comment ? (
                      <View style={styles.commentBox}>
                        <Text style={styles.commentText}>
                          Supervisor Feedback: "{item.supervisor_comment}"
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                      {item.evidence_url ? (
                        <View style={styles.evidenceRow}>
                          <Ionicons name="attach-outline" size={14} color="#059669" />
                          <Text style={styles.evidenceText}>Photo/File Attached</Text>
                        </View>
                      ) : (
                        <View />
                      )}
                      <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Tab 2: Placement & Final Report */}
        {activeTab === 'placement' && (
          <View style={styles.tabContent}>
            {/* SIWES Stipend Account (ITF) Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionCardTitle}>SIWES Stipend Account</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Federal Industrial Training Fund (ITF) Direct Disbursement</Text>
                </View>
                <Ionicons name="card-outline" size={20} color="#15803d" />
              </View>

              {studentProfile?.account_number ? (
                <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', marginVertical: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534' }}>{studentProfile.bank_name}</Text>
                    <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803d' }}>Verified Commercial Bank</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: 1.5, marginTop: 4 }}>
                    {studentProfile.account_number}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{studentProfile.account_name}</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: '#fffbeb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#fef3c7', marginVertical: 8 }}>
                  <Text style={{ fontSize: 12, color: '#92400e', lineHeight: 18 }}>
                    Official commercial bank account details required to receive federal SIWES allowances directly from the Industrial Training Fund.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.outlineBtn, { marginTop: 4 }]}
                onPress={() => setShowBankModal(true)}
              >
                <Ionicons name="card-outline" size={15} color="#0f172a" />
                <Text style={styles.outlineBtnText}>
                  {studentProfile?.account_number ? 'Update Bank Account Details' : 'Provide Bank Account Details'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Host Company / Attachment Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionCardTitle}>Place of Attachment</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>SIWES Form 8 Attachment Information</Text>
                </View>
                <Ionicons name="business" size={18} color="#0f172a" />
              </View>

              {placement ? (
                <>
                  <Text style={styles.companyName}>{placement.company_name}</Text>
                  <Text style={styles.companyAddress}>{placement.address || 'Address on file'}</Text>

                  <View style={styles.datesRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <Text style={styles.dateVal}>
                        {placement.start_date ? new Date(placement.start_date).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <Text style={styles.dateVal}>
                        {placement.end_date ? new Date(placement.end_date).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {placement.industry_supervisor_name ? (
                    <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                        Industry Supervisor (Workplace Trainer):
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 2 }}>
                        {placement.industry_supervisor_name}
                      </Text>
                      {(placement.industry_supervisor_phone || placement.industry_supervisor_email) && (
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {[placement.industry_supervisor_phone, placement.industry_supervisor_email].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={{ marginVertical: 8 }}>
                  <Text style={styles.emptyHintText}>
                    You have not registered your place of attachment yet. Submit your host firm details so your coordinator can allocate your institutional supervisor.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.outlineBtn, { marginTop: 10 }]}
                onPress={() => setShowPlacementModal(true)}
              >
                <Ionicons name="create-outline" size={15} color="#0f172a" />
                <Text style={styles.outlineBtnText}>
                  {placement ? 'Update Place of Attachment' : 'Register Place of Attachment'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Supervisors Contacts */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionCardTitle}>Assigned Supervision Team</Text>
                <Ionicons name="people" size={18} color="#0f172a" />
              </View>

              <View style={styles.supItem}>
                <Text style={styles.supRoleLabel}>Faculty Academic Supervisor:</Text>
                <Text style={styles.supName}>
                  {placement?.school_supervisor?.full_name || 'Allocated by Department Coordinator'}
                </Text>
                <Text style={styles.supEmail}>
                  {placement?.school_supervisor?.email || 'Will be assigned once attachment is registered'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.supItem}>
                <Text style={styles.supRoleLabel}>Workplace Industry Supervisor:</Text>
                <Text style={styles.supName}>
                  {placement?.industry_supervisor_name || placement?.industry_supervisor?.full_name || 'Designated Workplace Trainer'}
                </Text>
                <Text style={styles.supEmail}>
                  {placement?.industry_supervisor_email || placement?.industry_supervisor?.email || 'Reported on place of attachment form'}
                </Text>
              </View>
            </View>

            {/* Final Technical Report Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionCardTitle}>Final Technical Report & Stipend</Text>
                <Ionicons name="document-text" size={18} color="#0f172a" />
              </View>

              {finalReport ? (
                <>
                  <View style={styles.reportStatusBox}>
                    <Ionicons
                      name={finalReport.stipend_verified ? 'checkmark-circle' : 'time'}
                      size={20}
                      color={finalReport.stipend_verified ? '#15803d' : '#b45309'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportStatusTitle}>
                        {finalReport.stipend_verified
                          ? 'Stipend Verified by ITF'
                          : 'Report Submitted — Pending ITF Verification'}
                      </Text>
                      <Text style={styles.reportStatusSub}>
                        Submitted on {new Date(finalReport.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {finalReport.file_url ? (
                    <TouchableOpacity
                      style={styles.fileViewBtn}
                      onPress={() => openDownload(finalReport.file_url)}
                    >
                      <Ionicons name="document-outline" size={15} color="#0284c7" />
                      <Text style={styles.fileViewBtnText}>View Uploaded Report</Text>
                      <Ionicons name="open-outline" size={13} color="#0284c7" />
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.reportPromptText}>
                    At the conclusion of your SIWES industrial training, submit your finalized technical report document for ITF audit and stipend disbursement.
                  </Text>
                  <TouchableOpacity
                    style={styles.submitReportBtn}
                    onPress={() => setShowReportModal(true)}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color="#ffffff" />
                    <Text style={styles.submitReportBtnText}>Upload Final Technical Report</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Upload Final Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Technical Report</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHelp}>
              Select and upload an image or scan of your finalized SIWES technical training report for ITF audit and stipend clearance:
            </Text>

            <TouchableOpacity
              style={[styles.uploadDocBox, submittingReport && styles.disabledBtn]}
              disabled={submittingReport}
              onPress={pickAndSubmitReport}
            >
              {submittingReport ? (
                <ActivityIndicator size="large" color="#0f172a" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={36} color="#0f172a" />
                  <Text style={styles.uploadDocText}>Choose Document / Photo from Gallery</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    Tap to select and submit directly
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowReportModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Official Bank Details Modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>SIWES Stipend Account Details</Text>
                <Text style={{ fontSize: 11, color: '#64748b' }}>Federal Industrial Training Fund (ITF)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: '#15803d', padding: 10, borderRadius: 6, marginVertical: 8 }}>
              <Text style={{ fontSize: 11, color: '#166534', lineHeight: 16 }}>
                <Text style={{ fontWeight: '700' }}>Official Commercial Banks Only: </Text>
                ITF disburses allowances strictly to verified Nigerian commercial bank accounts.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Official Commercial Bank *</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                  setBankSearch('');
                  setShowBankPicker(true);
                }}
              >
                <Text style={[styles.selectBoxText, !bankForm.bank_name && styles.placeholderText]}>
                  {bankForm.bank_name || `-- Select Bank (${OFFICIAL_NIGERIAN_BANKS.length} Licensed) --`}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>10-Digit NUBAN Account Number *</Text>
              <TextInput
                style={[styles.textInput, { letterSpacing: 1.5, fontFamily: 'monospace' }]}
                keyboardType="numeric"
                maxLength={10}
                placeholder="e.g. 0123456789"
                placeholderTextColor="#94a3b8"
                value={bankForm.account_number}
                onChangeText={(val) => {
                  const cleaned = val.replace(/\D/g, '').slice(0, 10);
                  setBankForm({ ...bankForm, account_number: cleaned });
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Full Name (as on bank record) *</Text>
              <TextInput
                style={styles.textInput}
                autoCapitalize="characters"
                placeholder="e.g. JOHN CHUKWUEMEKA DOE"
                placeholderTextColor="#94a3b8"
                value={bankForm.account_name}
                onChangeText={(val) => setBankForm({ ...bankForm, account_name: val.toUpperCase() })}
              />
            </View>

            <View style={[styles.modalActions, { marginTop: 16 }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBankModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (submittingBank || bankForm.account_number.length !== 10 || !bankForm.bank_name) && styles.disabledBtn]}
                disabled={submittingBank || bankForm.account_number.length !== 10 || !bankForm.bank_name}
                onPress={handleSaveBankDetails}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {submittingBank ? 'Saving...' : 'Save Bank Details'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Commercial Bank Picker Modal */}
      <Modal visible={showBankPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', paddingBottom: 10 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Commercial Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 10 }}>
              <TextInput
                style={[styles.textInput, { fontSize: 13, paddingVertical: 7 }]}
                placeholder="Search bank name..."
                placeholderTextColor="#94a3b8"
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
              />
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {filteredBanks.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.bankItem, bankForm.bank_name === b && { backgroundColor: '#f0fdf4' }]}
                  onPress={() => {
                    setBankForm({ ...bankForm, bank_name: b });
                    setShowBankPicker(false);
                  }}
                >
                  <Text style={[styles.bankItemText, bankForm.bank_name === b && { fontWeight: '700', color: '#15803d' }]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
              {filteredBanks.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No banks match "{bankSearch}"</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Place of Attachment Registration Modal */}
      <Modal visible={showPlacementModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {placement ? 'Update Place of Attachment' : 'Register Place of Attachment'}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b' }}>SIWES Form 8 Attachment Information</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPlacementModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Host Company / Organization Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Chevron Nigeria Limited"
                  placeholderTextColor="#94a3b8"
                  value={placementForm.company_name}
                  onChangeText={(val) => setPlacementForm({ ...placementForm, company_name: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Company Address / Physical Location *</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="Street address, city, state..."
                  placeholderTextColor="#94a3b8"
                  value={placementForm.address}
                  onChangeText={(val) => setPlacementForm({ ...placementForm, address: val })}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-06-01"
                    placeholderTextColor="#94a3b8"
                    value={placementForm.start_date}
                    onChangeText={(val) => setPlacementForm({ ...placementForm, start_date: val })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-11-30"
                    placeholderTextColor="#94a3b8"
                    value={placementForm.end_date}
                    onChangeText={(val) => setPlacementForm({ ...placementForm, end_date: val })}
                  />
                </View>
              </View>

              <View style={{ marginTop: 6, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0f172a', marginBottom: 2 }}>
                  Industry Supervisor (Workplace Trainer)
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                  On-site supervisor who oversees and endorses your day-to-day training.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Supervisor Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Engr. Tunde Adeleke"
                    placeholderTextColor="#94a3b8"
                    value={placementForm.industry_supervisor_name}
                    onChangeText={(val) => setPlacementForm({ ...placementForm, industry_supervisor_name: val })}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Supervisor Email</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="supervisor@firm.com"
                      placeholderTextColor="#94a3b8"
                      value={placementForm.industry_supervisor_email}
                      onChangeText={(val) => setPlacementForm({ ...placementForm, industry_supervisor_email: val })}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Supervisor Phone</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="phone-pad"
                      placeholder="08031234567"
                      placeholderTextColor="#94a3b8"
                      value={placementForm.industry_supervisor_phone}
                      onChangeText={(val) => setPlacementForm({ ...placementForm, industry_supervisor_phone: val })}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowPlacementModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (submittingPlacement || !placementForm.company_name.trim() || !placementForm.address.trim()) && styles.disabledBtn]}
                disabled={submittingPlacement || !placementForm.company_name.trim() || !placementForm.address.trim()}
                onPress={handleSavePlacement}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {submittingPlacement ? 'Saving...' : placement ? 'Update Attachment' : 'Save Attachment'}
                </Text>
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
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCleared: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  textCleared: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700',
  },
  badgePendingClearance: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  textPendingClearance: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  studentMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  scrollBody: {
    paddingBottom: 40,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  quickActionPrimary: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  quickActionPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionSecondaryText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  logDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 8,
  },
  skillsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  skillsTagText: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '600',
  },
  commentBox: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 11,
    color: '#991b1b',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  companyAddress: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  supItem: {
    marginVertical: 4,
  },
  supRoleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  supName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  supEmail: {
    fontSize: 11,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  reportStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reportStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  reportStatusSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  fileViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  fileViewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  reportPromptText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginVertical: 10,
  },
  submitReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 10,
  },
  submitReportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyHintText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 6,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalHelp: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  uploadDocBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadDocText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalCancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#ffffff',
  },
  selectBoxText: {
    fontSize: 13,
    color: '#0f172a',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  bankItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bankItemText: {
    fontSize: 13,
    color: '#0f172a',
  },
});

export default StudentHomeScreen;
