import { useAuth } from "@clerk/expo";

const API_BASE_URL = 'http://172.28.25.150/api/v1'

export function useApiClient() {
  const { getToken } = useAuth()

  const apiFetch = async (endpoint, options = {}) => {
    const token = await getToken()

    const headers = {

      'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,

    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

    if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();

  }

  return {apiFetch}
}
