import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@clerk/expo';
import { File, UploadType } from 'expo-file-system';

const ApiContext = createContext(null);

// Replace with your backend URL (or process.env.EXPO_PUBLIC_API_URL)
const API_BASE_URL = 'https://preven-backend.vercel.app/api/v1';

export function ApiProvider({ children }) {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    const request = async (endpoint, options = {}) => {
      try {
        // Fetch fresh Clerk JWT
        const token = await getToken();
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

        const headers = {
          // Let fetch set its own multipart boundary header for FormData bodies.
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

    // Uploads a local file directly from disk to the server using
    // expo-file-system's native UploadTask, instead of reading the file
    // into a JS Blob/FormData and passing it through fetch. The native
    // task streams bytes straight from disk to the network without ever
    // holding the whole file in JS/bridge memory, which is significantly
    // safer for large images (camera photos can be tens of MB) than the
    // FormData + fetch path.
    const uploadFile = async (endpoint, fileUri, { fieldName = 'photo', parameters = {}, mimeType = 'image/jpeg' } = {}) => {
      try {
        const token = await getToken();
        const file = new File(fileUri);

        const result = await file.upload(`${API_BASE_URL}${endpoint}`, {
          httpMethod: 'POST',
          uploadType: UploadType.MULTIPART,
          fieldName,
          mimeType,
          parameters,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (result.status < 200 || result.status >= 300) {
          let parsedError;
          try {
            parsedError = JSON.parse(result.body);
          } catch {
            // Response body wasn't JSON — fall through to the generic message below.
          }
          throw new Error(parsedError?.error || `HTTP error ${result.status}`);
        }

        try {
          return { data: JSON.parse(result.body) };
        } catch {
          throw new Error('Received an unexpected response from the server.');
        }
      } catch (error) {
        console.error(`[API Upload Error] ${endpoint}:`, error.message);
        throw error;
      }
    };

    return {
      get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
      post: (endpoint, body, options) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return request(endpoint, {
          ...options,
          method: 'POST',
          body: isFormData ? body : JSON.stringify(body),
        });
      },
      put: (endpoint, body, options) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return request(endpoint, {
          ...options,
          method: 'PUT',
          body: isFormData ? body : JSON.stringify(body),
        });
      },
      delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
      uploadFile,
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
