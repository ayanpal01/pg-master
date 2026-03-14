import axios, { AxiosInstance } from 'axios';

/**
 * API Client for communicating with the Express backend
 * Uses NEXT_PUBLIC_BACKEND_URL from environment variables
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

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
