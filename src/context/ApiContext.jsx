import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@clerk/expo';

const ApiContext = createContext(null);

// Replace with your backend URL (or process.env.EXPO_PUBLIC_API_URL)
const API_BASE_URL = 'http://172.28.25.150/api/v1';

export function ApiProvider({ children }) {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    const request = async (endpoint, options = {}) => {
      try {
        // Fetch fresh Clerk JWT
        const token = await getToken();

        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error.message);
        throw error;
      }
    };

    return {
      get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
      post: (endpoint, body, options) =>
        request(endpoint, {
          ...options,
          method: 'POST',
          body: JSON.stringify(body),
        }),
      put: (endpoint, body, options) =>
        request(endpoint, {
          ...options,
          method: 'PUT',
          body: JSON.stringify(body),
        }),
      delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
    };
  }, [getToken]);

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

// Custom hook to consume the API context easily
export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
