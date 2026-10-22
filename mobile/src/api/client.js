import axios from 'axios';
import { Platform, NativeModules } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Helper: auto-detect host computer IP from Metro bundler or fall back to LAN IP
const resolveDefaultHost = () => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:3000`;
      }
    }
  } catch (e) {
    // Ignore error
  }
  // Default to PC's active Wi-Fi LAN IP (works on both physical phones and PC)
  return 'http://192.168.1.92:3000';
};

const DEFAULT_HOST = resolveDefaultHost();
let currentBaseUrl = DEFAULT_HOST;

const api = axios.create({
  baseURL: `${currentBaseUrl}/api/v1`,
  timeout: 15000,
});

export const setApiBaseUrl = async (newUrl) => {
  currentBaseUrl = newUrl;
  api.defaults.baseURL = `${newUrl}/api/v1`;
  try {
    await SecureStore.setItemAsync('customApiBaseUrl', newUrl);
  } catch (err) {
    console.warn('Failed to persist custom host', err);
  }
};

export const initApiBaseUrl = async () => {
  try {
    const saved = await SecureStore.getItemAsync('customApiBaseUrl');
    if (saved && saved.trim()) {
      currentBaseUrl = saved.trim();
      api.defaults.baseURL = `${saved.trim()}/api/v1`;
      return saved.trim();
    }
  } catch (err) {
    console.warn('Failed to load custom host', err);
  }
  return currentBaseUrl;
};

export const getApiBaseUrl = () => currentBaseUrl;

export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${currentBaseUrl}${path}`;
};

// Request interceptor to attach JWT token from SecureStore
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Failed to retrieve token from storage', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper for multipart/form-data upload (e.g. camera photos)
export const uploadEvidencePhoto = async (imageUri) => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('evidence', {
    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
    name: filename,
    type,
  });

  const res = await api.post('/uploads/evidence', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};

// Helper for multipart/form-data final technical report upload
export const uploadFinalReport = async (fileUri) => {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'report.pdf';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'pdf';
  const type = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;

  formData.append('report', {
    uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
    name: filename,
    type,
  });

  const res = await api.post('/reports/final', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};

export default api;
