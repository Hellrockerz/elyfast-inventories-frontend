import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://inventories-api.elyfast.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the Firebase ID token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (optional: logout user or refresh token)
      console.error('Unauthorized access - potential session expiry');
    }
    if (error.response?.status === 402) {
      // Subscription expired - dispatch event for UI to handle
      console.warn('Subscription expired - write operations blocked');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('subscription-expired', {
          detail: error.response.data,
        }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
