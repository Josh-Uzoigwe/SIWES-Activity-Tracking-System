import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../api/client';

const ROLES = [
  { id: 'student', label: 'Student', type: 'student', role: 'STUDENT', icon: 'school-outline' },
  { id: 'school', label: 'School Sup.', type: 'supervisor', role: 'SCHOOL', icon: 'person-outline' },
  { id: 'industry', label: 'Industry Sup.', type: 'supervisor', role: 'INDUSTRY', icon: 'business-outline' },
  { id: 'coordinator', label: 'Coordinator', type: 'supervisor', role: 'COORDINATOR', icon: 'ribbon-outline' },
  { id: 'itf', label: 'ITF Officer', type: 'supervisor', role: 'ITF', icon: 'shield-checkmark-outline' },
];

const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Host configuration helper
  const [showHostConfig, setShowHostConfig] = useState(false);
  const [customHost, setCustomHost] = useState(getApiBaseUrl());

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password, selectedRole.type, selectedRole.role);
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Login failed. Check your credentials.';
      if (!err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK')) {
        msg = `Cannot connect to server at ${getApiBaseUrl()}. Ensure your phone is on the same Wi-Fi network, or tap "Server Endpoint" below to check the host IP.`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHost = async () => {
    if (customHost.trim()) {
      await setApiBaseUrl(customHost.trim());
      setShowHostConfig(false);
      setError('');
      Alert.alert('Server Host Updated', `API base pointing to: ${customHost.trim()}`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>S</Text>
          </View>
          <Text style={styles.title}>SIWES Mobile</Text>
          <Text style={styles.subtitle}>Federal Industrial Training Scheme</Text>
        </View>

        {/* Role Selector Grid */}
        <Text style={styles.sectionLabel}>Select Your Role</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScrollView}>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => {
              const active = selectedRole.id === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                  onPress={() => {
                    setSelectedRole(r);
                    setError('');
                  }}
                >
                  <Ionicons
                    name={r.icon}
                    size={18}
                    color={active ? '#ffffff' : '#475569'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.roleText, active && styles.roleTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.signingAsText}>
            Signing in as <Text style={styles.signingAsRole}>{selectedRole.label}</Text>
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.submitContent}>
                <Text style={styles.submitButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Server Host Config Accordion */}
        <TouchableOpacity
          style={styles.hostConfigToggle}
          onPress={() => setShowHostConfig(!showHostConfig)}
        >
          <Ionicons name="settings-outline" size={14} color="#64748b" />
          <Text style={styles.hostConfigToggleText}>
            Server Endpoint: {getApiBaseUrl()}
          </Text>
          <Ionicons
            name={showHostConfig ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={14}
            color="#64748b"
          />
        </TouchableOpacity>

        {showHostConfig && (
          <View style={styles.hostConfigBox}>
            <Text style={styles.hostConfigHelp}>
              For physical devices, change to your PC's local Wi-Fi IP (e.g., http://192.168.1.100:3000):
            </Text>
            <TextInput
              style={styles.hostInput}
              value={customHost}
              onChangeText={setCustomHost}
              placeholder="http://192.168.x.x:3000"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.saveHostButton} onPress={handleSaveHost}>
              <Text style={styles.saveHostButtonText}>Update API Host</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  brandLetter: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleScrollView: {
    marginBottom: 16,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 95,
  },
  roleCardActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  roleTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  signingAsText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  signingAsRole: {
    fontWeight: '700',
    color: '#0f172a',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  eyeButton: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  hostConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    padding: 8,
  },
  hostConfigToggleText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  hostConfigBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  hostConfigHelp: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 8,
  },
  hostInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  saveHostButton: {
    backgroundColor: '#334155',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveHostButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LoginScreen;
