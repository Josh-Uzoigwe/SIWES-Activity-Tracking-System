import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { uploadEvidencePhoto } from '../api/client';

const CreateLogScreen = ({ navigation, route }) => {
  const originalLog = route.params?.resubmitLog || null;

  // Generate selectable dates within valid 3-day window
  const getDateOptions = () => {
    const options = [];
    for (let i = 0; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      let label = 'Today';
      if (i === 1) label = 'Yesterday';
      else if (i === 2) label = '2 Days Ago';
      else if (i === 3) label = '3 Days Ago';
      options.push({ iso, label, display: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
    }
    return options;
  };

  const dateOptions = getDateOptions();
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].iso);
  const [description, setDescription] = useState(originalLog?.description || '');
  const [skills, setSkills] = useState(originalLog?.skills_acquired || '');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Take photo with native device camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to capture logbook evidence.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera error', err);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  // Select photo from library
  const handlePickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library access is required to attach proof photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error', err);
      Alert.alert('Gallery Error', 'Could not select photo.');
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing Field', 'Please describe your daily industrial activities.');
      return;
    }

    setLoading(true);
    try {
      let evidenceUrl = originalLog?.evidence_url || null;

      // 1. Upload photo if selected
      if (imageUri) {
        const uploadRes = await uploadEvidencePhoto(imageUri);
        if (uploadRes.success) {
          evidenceUrl = uploadRes.file_url;
        }
      }

      // 2. Submit log entry
      const payload = {
        log_date: selectedDate,
        description: description.trim(),
        skills_acquired: skills.trim() || undefined,
        evidence_url: evidenceUrl,
        original_log_id: originalLog?.activity_id || undefined,
      };

      const res = await api.post('/logs', payload);

      if (res.data?.success) {
        Alert.alert(
          'Success',
          originalLog ? 'Corrected log entry resubmitted successfully!' : 'Daily activity log submitted!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit log entry.';
      Alert.alert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Anti-Tamper Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#047857" />
          <Text style={styles.noticeText}>
            Anti-Tamper Rule: Log entries are strictly accepted within 72 hours of the activity date.
          </Text>
        </View>

        {originalLog && (
          <View style={styles.resubmitNotice}>
            <Ionicons name="refresh-circle-outline" size={18} color="#b45309" />
            <Text style={styles.resubmitNoticeText}>
              Resubmitting rejected log entry with corrections.
            </Text>
          </View>
        )}

        {/* 1. Date Selector */}
        <Text style={styles.fieldLabel}>Date of Workplace Activity</Text>
        <View style={styles.dateSelectorRow}>
          {dateOptions.map((opt) => {
            const active = selectedDate === opt.iso;
            return (
              <TouchableOpacity
                key={opt.iso}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => setSelectedDate(opt.iso)}
              >
                <Text style={[styles.dateChipLabel, active && styles.dateChipLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={[styles.dateChipDate, active && styles.dateChipDateActive]}>
                  {opt.display}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Activity Description */}
        <Text style={styles.fieldLabel}>Detailed Tasks & Operations *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the practical work, engineering tasks, equipment operated, or procedures executed..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* 3. Skills Acquired */}
        <Text style={styles.fieldLabel}>Technical Skills Acquired</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. PLC Wiring, Fiber Splicing, Django ORM, React Native"
          placeholderTextColor="#94a3b8"
          value={skills}
          onChangeText={setSkills}
        />

        {/* 4. Evidence Photo Attachment */}
        <Text style={styles.fieldLabel}>Photo / Document Evidence (Optional)</Text>
        {imageUri ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={20} color="#0f172a" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={handlePickFromLibrary}>
              <Ionicons name="images-outline" size={20} color="#0f172a" />
              <Text style={styles.photoButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={styles.submitContent}>
              <Text style={styles.submitButtonText}>
                {originalLog ? 'Resubmit Corrected Entry' : 'Submit Activity Log'}
              </Text>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 12,
    color: '#065f46',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  resubmitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  resubmitNoticeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  dateChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dateChipLabelActive: {
    color: '#94a3b8',
  },
  dateChipDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  dateChipDateActive: {
    color: '#ffffff',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 110,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 12,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  previewBox: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    height: 180,
    backgroundColor: '#0f172a',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CreateLogScreen;
