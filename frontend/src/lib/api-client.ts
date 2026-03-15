import axios, { AxiosInstance } from 'axios';

/**
 * API Client for communicating with the proxy backend
 */

// Use an EMPTY baseURL in production/Next.js so that it hits the same origin 
// which is then proxied via next.config.ts rewrites!
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000');

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors globally
    if (error.response?.status === 401) {
      // Optionally redirect to login or show notification
      console.error('Authentication error');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
