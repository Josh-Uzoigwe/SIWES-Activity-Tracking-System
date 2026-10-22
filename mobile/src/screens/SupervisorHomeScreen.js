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
  { id: 'logs', label: 'Activity Logs' },
  { id: 'visits', label: 'Supervisory Visits' },
  { id: 'students', label: 'Assigned Students' },
];

const SupervisorHomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');

  // Review Reject modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Visit scheduling modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({ placement_id: '', scheduled_date: '', notes: '' });
  const [submittingVisit, setSubmittingVisit] = useState(false);

  const isIndustry = user?.role === 'INDUSTRY';
  const isSchool = user?.role === 'SCHOOL';

  const loadData = useCallback(async () => {
    try {
      const [logsRes, visitsRes, studentsRes] = await Promise.all([
        api.get('/logs').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/visits').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/students').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (logsRes.data?.success) setLogs(logsRes.data.data || []);
      if (visitsRes.data?.success) setVisits(visitsRes.data.data || []);
      if (studentsRes.data?.success) setStudents(studentsRes.data.data || []);
    } catch (err) {
      console.warn('Failed to load supervisor records', err);
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
        Alert.alert('Download Error', 'Unable to open document. Please verify connection.');
      });
    }
  };

  // 1. Approve log (School Supervisor)
  const handleApprove = async (logId) => {
    setSubmittingAction(true);
    try {
      const res = await api.put(`/logs/${logId}/review`, {
        status: 'approved',
        supervisor_comment: 'Approved and verified for SIWES academic credits.',
      });
      if (res.data?.success) {
        Alert.alert('Approved', 'Student log has been approved.');
        loadData();
      }
    } catch (err) {
      Alert.alert('Action Error', err.response?.data?.message || 'Failed to approve log.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 2. Reject log with mandatory comment (School Supervisor)
  const handleRejectSubmit = async () => {
    if (!rejectComment.trim()) {
      Alert.alert('Comment Required', 'Please specify what needs correction.');
      return;
    }
    setSubmittingAction(true);
    try {
      const res = await api.put(`/logs/${selectedLog.activity_id}/review`, {
        status: 'rejected',
        supervisor_comment: rejectComment.trim(),
      });
      if (res.data?.success) {
        setRejectModalVisible(false);
        setRejectComment('');
        setSelectedLog(null);
        Alert.alert('Correction Requested', 'Log marked for correction and student notified.');
        loadData();
      }
    } catch (err) {
      Alert.alert('Action Error', err.response?.data?.message || 'Failed to submit correction.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 3. Endorse log (Industry Supervisor)
  const handleEndorse = async (logId) => {
    setSubmittingAction(true);
    try {
      const res = await api.put(`/logs/${logId}/endorse`);
      if (res.data?.success) {
        Alert.alert('Endorsed', 'Workplace practical task endorsed.');
        loadData();
      }
    } catch (err) {
      Alert.alert('Action Error', err.response?.data?.message || 'Failed to endorse log.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 4. Schedule Visit (School Supervisor)
  const handleScheduleVisit = async () => {
    if (!visitForm.placement_id || !visitForm.scheduled_date) {
      Alert.alert('Required Fields', 'Please select a student and specify the scheduled date.');
      return;
    }
    setSubmittingVisit(true);
    try {
      const res = await api.post('/visits', {
        placement_id: parseInt(visitForm.placement_id, 10),
        scheduled_date: visitForm.scheduled_date,
        notes: visitForm.notes,
      });
      if (res.data?.success) {
        Alert.alert('Visit Scheduled', 'Supervisory inspection visit scheduled. Student notified.');
        setShowVisitModal(false);
        setVisitForm({ placement_id: '', scheduled_date: '', notes: '' });
        loadData();
      }
    } catch (err) {
      Alert.alert('Scheduling Error', err.response?.data?.message || 'Failed to schedule visit.');
    } finally {
      setSubmittingVisit(false);
    }
  };

  // 5. Complete Visit
  const handleCompleteVisit = async (visitId) => {
    try {
      const res = await api.put(`/visits/${visitId}`, { status: 'completed' });
      if (res.data?.success) {
        Alert.alert('Visit Completed', 'Supervisory visit marked as completed.');
        loadData();
      }
    } catch (err) {
      Alert.alert('Update Error', err.response?.data?.message || 'Failed to update visit.');
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'all' || (log.status || '').toLowerCase() === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      log.student?.full_name?.toLowerCase().includes(q) ||
      log.student?.matric_no?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.skills_acquired?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = logs.filter((l) => (l.status || '').toLowerCase() === 'pending').length;
  const approvedCount = logs.filter((l) => (l.status || '').toLowerCase() === 'approved').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {isIndustry ? 'INDUSTRY SUPERVISOR' : 'ACADEMIC SUPERVISOR'}
              </Text>
            </View>
            <Text style={styles.orgText}>
              {isIndustry ? user?.company || 'Host Company' : user?.institution || 'Academic Institution'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Supervisor'}</Text>
          <Text style={styles.userRole}>
            {isIndustry ? 'Workplace Practical Supervisor' : 'Faculty Academic Supervisor'}
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
        {/* Header Action Button */}
        {isSchool && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => setShowVisitModal(true)}
            >
              <Ionicons name="calendar-outline" size={15} color="#ffffff" />
              <Text style={styles.actionBtnPrimaryText}>Schedule Supervisory Visit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4 KPI Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScrollView}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Pending</Text>
              <Ionicons name="time-outline" size={16} color="#b45309" />
            </View>
            <Text style={[styles.kpiValue, { color: '#b45309' }]}>{pendingCount}</Text>
            <Text style={styles.kpiMeta}>Awaiting review</Text>
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
              <Text style={styles.kpiLabel}>Assigned</Text>
              <Ionicons name="people-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.kpiValue}>{students.length}</Text>
            <Text style={styles.kpiMeta}>Supervised students</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Visits</Text>
              <Ionicons name="location-outline" size={16} color="#0284c7" />
            </View>
            <Text style={[styles.kpiValue, { color: '#0284c7' }]}>{visits.length}</Text>
            <Text style={styles.kpiMeta}>Physical inspections</Text>
          </View>
        </ScrollView>

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

        {/* Tab 1: Activity Logs */}
        {activeTab === 'logs' && (
          <View style={styles.tabContent}>
            {/* Filter Chips */}
            <View style={styles.filterChipsRow}>
              {['pending', 'approved', 'rejected', 'all'].map((filterKey) => {
                const active = statusFilter === filterKey;
                return (
                  <TouchableOpacity
                    key={filterKey}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setStatusFilter(filterKey)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {filterKey === 'pending'
                        ? `Pending (${pendingCount})`
                        : filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredLogs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-done-circle-outline" size={42} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No activity logs match this filter</Text>
              </View>
            ) : (
              filteredLogs.map((item) => {
                const formattedDate = new Date(item.log_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const isPending = (item.status || '').toLowerCase() === 'pending';

                return (
                  <View key={item.activity_id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardDate}>{formattedDate}</Text>
                        <Text style={styles.studentLabel}>
                          Student ID: #{item.student_id} {item.student?.full_name ? `• ${item.student.full_name}` : ''}
                        </Text>
                      </View>
                      <StatusBadge status={item.status} />
                    </View>

                    <Text style={styles.descriptionText}>{item.description}</Text>

                    {item.skills_acquired ? (
                      <View style={styles.skillsTag}>
                        <Ionicons name="sparkles-outline" size={12} color="#0284c7" />
                        <Text style={styles.skillsTagText}>{item.skills_acquired}</Text>
                      </View>
                    ) : null}

                    {item.evidence_url ? (
                      <TouchableOpacity
                        style={styles.evidenceBtn}
                        onPress={() => openDownload(item.evidence_url)}
                      >
                        <Ionicons name="image-outline" size={14} color="#059669" />
                        <Text style={styles.evidenceBtnText}>View Attached Verification Photo</Text>
                        <Ionicons name="open-outline" size={12} color="#059669" />
                      </TouchableOpacity>
                    ) : null}

                    {item.supervisor_comment ? (
                      <View style={styles.commentPreview}>
                        <Text style={styles.commentPreviewText}>
                          Feedback: "{item.supervisor_comment}"
                        </Text>
                      </View>
                    ) : null}

                    {/* Action Controls */}
                    <View style={styles.actionsRow}>
                      {isIndustry ? (
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            styles.endorseBtn,
                            item.industry_endorsed && styles.disabledBtn,
                          ]}
                          disabled={item.industry_endorsed || submittingAction}
                          onPress={() => handleEndorse(item.activity_id)}
                        >
                          <Ionicons
                            name={item.industry_endorsed ? 'checkmark-circle' : 'shield-checkmark-outline'}
                            size={16}
                            color="#ffffff"
                          />
                          <Text style={styles.actionBtnText}>
                            {item.industry_endorsed ? 'Practical Endorsed' : 'Endorse Practical Task'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          {isPending && (
                            <>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.approveBtn]}
                                disabled={submittingAction}
                                onPress={() => handleApprove(item.activity_id)}
                              >
                                <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                                <Text style={styles.actionBtnText}>Approve</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                disabled={submittingAction}
                                onPress={() => {
                                  setSelectedLog(item);
                                  setRejectModalVisible(true);
                                }}
                              >
                                <Ionicons name="close-outline" size={16} color="#ffffff" />
                                <Text style={styles.actionBtnText}>Request Correction</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </>
                      )}

                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => navigation.navigate('LogDetail', { log: item })}
                      >
                        <Ionicons name="eye-outline" size={15} color="#475569" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Tab 2: Supervisory Visits */}
        {activeTab === 'visits' && (
          <View style={styles.tabContent}>
            {visits.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="location-outline" size={42} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No supervisory visits scheduled</Text>
                {isSchool && (
                  <TouchableOpacity
                    style={[styles.actionBtnPrimary, { marginTop: 12 }]}
                    onPress={() => setShowVisitModal(true)}
                  >
                    <Ionicons name="calendar-outline" size={15} color="#ffffff" />
                    <Text style={styles.actionBtnPrimaryText}>Schedule First Visit</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              visits.map((v) => {
                const isCompleted = v.status === 'completed';
                const formattedDate = new Date(v.scheduled_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <View key={v.visit_id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                          Student: {v.placement?.student?.full_name || 'Enrolled Student'}
                        </Text>
                        <Text style={styles.cardMeta}>{v.placement?.company_name}</Text>
                      </View>
                      <View style={[styles.badge, isCompleted ? styles.badgeSuccess : styles.badgeWarning]}>
                        <Text style={[styles.badgeText, isCompleted ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                          {isCompleted ? 'Completed' : 'Scheduled'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={14} color="#64748b" />
                      <Text style={styles.infoText}>Visit Date: {formattedDate}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={14} color="#64748b" />
                      <Text style={styles.infoText}>{v.placement?.address || 'Address on file'}</Text>
                    </View>

                    {v.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>Inspection Focus: {v.notes}</Text>
                      </View>
                    ) : null}

                    {!isCompleted && isSchool && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn, { marginTop: 10 }]}
                        onPress={() => handleCompleteVisit(v.visit_id)}
                      >
                        <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Mark Inspection Visit as Completed</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Tab 3: Assigned Students */}
        {activeTab === 'students' && (
          <View style={styles.tabContent}>
            {students.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={42} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No students assigned to your roster</Text>
              </View>
            ) : (
              students.map((s) => {
                const placement = s.placements?.[0];
                return (
                  <View key={s.student_id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{s.full_name}</Text>
                        <Text style={styles.cardMeta}>{s.matric_no} • {s.department}</Text>
                      </View>
                      <View style={[styles.badge, styles.badgeSuccess]}>
                        <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Enrolled</Text>
                      </View>
                    </View>

                    <Text style={styles.studentCompanyLine}>
                      Host Company: {placement?.company_name || 'Attachment Pending'}
                    </Text>

                    <TouchableOpacity
                      style={styles.exportBtn}
                      onPress={() => openDownload(`/api/v1/reports/export/logbook/${s.student_id}`)}
                    >
                      <Ionicons name="download-outline" size={14} color="#0f172a" />
                      <Text style={styles.exportBtnText}>Download Student PDF Logbook</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Correction</Text>
            <Text style={styles.modalSubtitle}>Explain what the student must correct before resubmission.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Please specify the safety guidelines observed."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={rejectComment}
              onChangeText={setRejectComment}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectComment('');
                  setSelectedLog(null);
                }}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#dc2626' }]}
                disabled={submittingAction}
                onPress={handleRejectSubmit}
              >
                <Text style={styles.modalSubmitBtnText}>Submit Correction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Schedule Visit Modal */}
      <Modal visible={showVisitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Supervisory Visit</Text>
              <TouchableOpacity onPress={() => setShowVisitModal(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Select Assigned Student *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {students.map((st) => {
                  const pId = st.placements?.[0]?.placement_id;
                  const active = visitForm.placement_id === String(pId);
                  return (
                    <TouchableOpacity
                      key={st.student_id}
                      style={[styles.studentPill, active && styles.studentPillActive]}
                      onPress={() => setVisitForm({ ...visitForm, placement_id: String(pId) })}
                    >
                      <Text style={[styles.studentPillText, active && styles.studentPillTextActive]}>
                        {st.full_name} ({st.placements?.[0]?.company_name || 'Placement'})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Scheduled Inspection Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2026-11-15"
                value={visitForm.scheduled_date}
                onChangeText={(t) => setVisitForm({ ...visitForm, scheduled_date: t })}
              />

              <Text style={styles.inputLabel}>Inspection Notes & Objectives</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 70, textAlignVertical: 'top' }]}
                placeholder="e.g. Inspect student practical engineering station and safety gear."
                multiline
                value={visitForm.notes}
                onChangeText={(t) => setVisitForm({ ...visitForm, notes: t })}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowVisitModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingVisit && styles.disabledBtn]}
                disabled={submittingVisit}
                onPress={handleScheduleVisit}
              >
                {submittingVisit ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>Confirm Visit</Text>}
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
  roleBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orgText: {
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
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
  tabsScrollView: {
    paddingHorizontal: 16,
    marginBottom: 12,
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  studentLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 10,
  },
  skillsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  skillsTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  evidenceBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  commentPreview: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  commentPreviewText: {
    fontSize: 12,
    color: '#991b1b',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveBtn: {
    backgroundColor: '#16a34a',
  },
  rejectBtn: {
    backgroundColor: '#dc2626',
  },
  endorseBtn: {
    backgroundColor: '#059669',
  },
  disabledBtn: {
    backgroundColor: '#94a3b8',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  detailBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badge: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  notesText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  studentCompanyLine: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginVertical: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 6,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  modalForm: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    color: '#0f172a',
    marginBottom: 16,
  },
  studentPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  studentPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  studentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  studentPillTextActive: {
    color: '#ffffff',
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
    fontWeight: '600',
    fontSize: 13,
  },
  modalSubmitBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default SupervisorHomeScreen;
