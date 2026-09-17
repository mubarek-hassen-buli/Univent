import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach Bearer token if stored in memory/storage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response interceptor to format error contracts cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.data) {
      const serverError = error.response.data;
      const formattedMessage = Array.isArray(serverError.message)
        ? serverError.message.join(', ')
        : serverError.message || 'An unexpected error occurred';
      const customError = new Error(formattedMessage);
      Object.assign(customError, {
        response: error.response,
        statusCode: error.response.status,
      });
      return Promise.reject(customError);
    }
    return Promise.reject(new Error(error.message || 'Network error occurred'));
  },
);
