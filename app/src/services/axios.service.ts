import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig, AxiosError, AxiosHeaders } from 'axios';
import { type AccountInfo, type AuthenticationResult, InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser';
import { LogDebug, LogError } from './logging.service';

// Environment variables with proper typing
const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://mock.api';
const mockMode = import.meta.env.VITE_MOCK_MODE === 'true';

// API scopes - make this configurable
const API_SCOPES = [
  import.meta.env.VITE_API_SCOPE || 'api://babytracker/user_impersonation'
];

// Custom error types
export class ApiError extends Error {
  public status?: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

// MSAL instance placeholder
let pca: PublicClientApplication | null = null;

// Function to set the MSAL instance
export const setMsalInstance = (msalInstance: PublicClientApplication) => {
  pca = msalInstance;
};

// Token acquisition helper
const acquireAccessToken = async (scopes: string[] = API_SCOPES): Promise<string | null> => {
    if (!pca) {
        throw new Error('MSAL instance is not set. Call setMsalInstance() before using the axios service.');
    }
    const accounts = pca.getAllAccounts();
    const account: AccountInfo = accounts[0];
    try {
    
        if (accounts.length === 0) {
            console.warn('No accounts found in MSAL instance');
            return null;
        }

    
        // Try silent token acquisition first
        const response: AuthenticationResult = await pca.acquireTokenSilent({
            account,
            scopes: scopes,
            forceRefresh: false, // Set to true if you want to force refresh
        });

        return response.accessToken;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            LogError('Interactive authentication required:', error);
            // FALLBACK to interactive popup
            try {
                const interactiveResult: AuthenticationResult = await pca.acquireTokenPopup({
                    account,
                    scopes: API_SCOPES,
                });
                return interactiveResult.accessToken;
            } catch (popupError) {
                LogError("Popup token acquisition failed:", popupError);
                throw new AuthenticationError(
                    "Interactive authentication failed"
                );
            }
        }
    
        LogError('Token acquisition failed:', error);
        throw new AuthenticationError('Failed to acquire access token');
    }
};

// Create axios instance
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            // Check if custom scopes are provided in request headers
            const customScopes = config.headers?.['X-Custom-Scopes'] as string[];
            const scopes = customScopes || API_SCOPES;
            const token = await acquireAccessToken(scopes);
      
            if (token) {
                // ensure headers is an AxiosHeaders instance
                const headers = new AxiosHeaders(config.headers)
                // use the instance method .set()
                headers.set('Authorization', `Bearer ${token}`)
                // re‑assign it back
                config.headers = headers
            }
      
            // Add request ID for tracing
            config.headers['X-Request-ID'] = crypto.randomUUID();
      
            // Remove the custom scopes header as it's only for internal use
            if (config.headers?.['X-Custom-Scopes']) {
                delete config.headers['X-Custom-Scopes'];
            }

            // Log request in development
            if (import.meta.env.DEV) {
                LogDebug(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
            }
      
            return config;
        } catch (error) {
            LogError('Request interceptor error (axios.service.ts):', error);
            return Promise.reject(error);
        }
    },
    (error) => {
        LogError('Request configuration error (axios.service.ts):', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
            LogDebug(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;
    
        // Handle authentication errors
        if (error.response?.status === 401 && originalRequest) {
            try {
                console.log('🔄 Attempting token refresh after 401');
                const token = await acquireAccessToken();
        
                if (token) {
                    const originalHeaders = originalRequest.headers;
                    originalHeaders.set('Authorization', `Bearer ${token}`);
                    originalRequest.headers = originalHeaders;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                throw new AuthenticationError('Session expired. Please login again.' + refreshError);
            }
        }
    
        // Transform axios errors to custom API errors
        const apiError = new ApiError(
            error.message || 'An error occurred',
            error.response?.status,
            error.code,
            error.response?.data
        );
    
        // Log errors in development
        if (import.meta.env.DEV) {
            LogError('❌ API Error:', error);
        }
    
        return Promise.reject(apiError);
    }
);

// Utility functions for common operations
export const apiUtils = {
    // Check if user is authenticated
    isAuthenticated: (): boolean => {
        if (mockMode) return true;
        return pca!.getAllAccounts().length > 0;
    },
  
    // Get current user account
    getCurrentAccount: (): AccountInfo | null => {
        if (mockMode) return null;
        const accounts = pca!.getAllAccounts();
        return accounts.length > 0 ? accounts[0] : null;
    },
  
    // Force token refresh
    refreshToken: async (scopes: string[] = API_SCOPES): Promise<string | null> => {
        if (mockMode) return null;
    
        const accounts = pca!.getAllAccounts();
        if (accounts.length === 0) return null;
    
        const response = await pca!.acquireTokenSilent({
            account: accounts[0],
            scopes: scopes,
            forceRefresh: true,
        });
    
        return response.accessToken;
    },
};

// Type-safe API methods with custom scopes support
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig & { scopes?: string[] }): Promise<T> => {
    const { scopes, ...axiosConfig } = config || {};
    const requestConfig = scopes ? { ...axiosConfig, headers: { ...axiosConfig.headers, 'X-Custom-Scopes': scopes } } : axiosConfig;
    return apiClient.get<T>(url, requestConfig).then(response => response.data);
  },
    
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig & { scopes?: string[] }): Promise<T> => {
    const { scopes, ...axiosConfig } = config || {};
    const requestConfig = scopes ? { ...axiosConfig, headers: { ...axiosConfig.headers, 'X-Custom-Scopes': scopes } } : axiosConfig;
    return apiClient.post<T>(url, data, requestConfig).then(response => response.data);
  },
    
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig & { scopes?: string[] }): Promise<T> => {
    const { scopes, ...axiosConfig } = config || {};
    const requestConfig = scopes ? { ...axiosConfig, headers: { ...axiosConfig.headers, 'X-Custom-Scopes': scopes } } : axiosConfig;
    return apiClient.put<T>(url, data, requestConfig).then(response => response.data);
  },
    
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig & { scopes?: string[] }): Promise<T> => {
    const { scopes, ...axiosConfig } = config || {};
    const requestConfig = scopes ? { ...axiosConfig, headers: { ...axiosConfig.headers, 'X-Custom-Scopes': scopes } } : axiosConfig;
    return apiClient.patch<T>(url, data, requestConfig).then(response => response.data);
  },
    
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig & { scopes?: string[] }): Promise<T> => {
    const { scopes, ...axiosConfig } = config || {};
    const requestConfig = scopes ? { ...axiosConfig, headers: { ...axiosConfig.headers, 'X-Custom-Scopes': scopes } } : axiosConfig;
    return apiClient.delete<T>(url, requestConfig).then(response => response.data);
  },
};

// Default export
export default apiClient;