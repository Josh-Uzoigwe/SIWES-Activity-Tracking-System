import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../components/StatusBadge';
import { getFileUrl } from '../api/client';

const LogDetailScreen = ({ route, navigation }) => {
  const { log } = route.params;

  const formattedDate = new Date(log.log_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fullEvidenceUrl = getFileUrl(log.evidence_url);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Status & Date Header */}
        <View style={styles.headerCard}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge status={log.status} />
            {log.industry_endorsed && (
              <View style={styles.endorsedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#059669" />
                <Text style={styles.endorsedText}>Industry Endorsed</Text>
              </View>
            )}
          </View>
        </View>

        {/* Section 1: Tasks & Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daily Operations & Tasks</Text>
          <Text style={styles.descriptionText}>{log.description}</Text>
        </View>

        {/* Section 2: Skills Acquired */}
        {log.skills_acquired && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Technical Competencies</Text>
            <View style={styles.skillsTag}>
              <Ionicons name="sparkles-outline" size={14} color="#0284c7" />
              <Text style={styles.skillsTagText}>{log.skills_acquired}</Text>
            </View>
          </View>
        )}

        {/* Section 3: Attached Photo/Document */}
        {fullEvidenceUrl && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attached Evidence Proof</Text>
            <View style={styles.evidenceImageWrapper}>
              <Image source={{ uri: fullEvidenceUrl }} style={styles.evidenceImage} />
            </View>
          </View>
        )}

        {/* Section 4: Supervisory Review & Comments */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Supervisory Evaluation</Text>
          {log.supervisor_comment ? (
            <View style={styles.commentBox}>
              <View style={styles.commentHeader}>
                <Ionicons name="person-circle-outline" size={18} color="#475569" />
                <Text style={styles.commentAuthor}>
                  {log.reviewer?.full_name || 'Assigned Supervisor'}
                </Text>
              </View>
              <Text style={styles.commentBody}>"{log.supervisor_comment}"</Text>
              {log.reviewed_at && (
                <Text style={styles.commentDate}>
                  Reviewed on {new Date(log.reviewed_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noCommentText}>
              Awaiting weekly sign-off and audit by your academic/industry supervisor.
            </Text>
          )}
        </View>

        {/* Resubmit CTA if Rejected */}
        {(log.status || '').toLowerCase() === 'rejected' && (
          <TouchableOpacity
            style={styles.resubmitButton}
            onPress={() => navigation.navigate('CreateLog', { resubmitLog: log })}
          >
            <Ionicons name="refresh-outline" size={18} color="#ffffff" />
            <Text style={styles.resubmitButtonText}>Resubmit Corrected Entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  endorsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  endorsedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 22,
  },
  skillsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  skillsTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  evidenceImageWrapper: {
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginTop: 6,
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  commentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0f172a',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  commentBody: {
    fontSize: 13,
    color: '#1e293b',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  commentDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  noCommentText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    borderRadius: 10,
    height: 48,
    marginTop: 8,
  },
  resubmitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LogDetailScreen;
