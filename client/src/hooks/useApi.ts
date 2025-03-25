import { useState, useEffect } from 'react';
import { useAppSelector } from '../redux/hooks';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useApi = <T>(url: string, defaultValue: T | null = null): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchIndex, setRefetchIndex] = useState<number>(0);
  const { token } = useAppSelector(state => state.auth);

  const refetch = () => setRefetchIndex(prev => prev + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404 || response.status === 400) {
            console.warn(`API endpoint not available: ${url}`);
            setData(defaultValue);
            setLoading(false);
            return;
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            setError('Unable to connect to the server. Please check your connection or try again later.');
          } else {
            setError(error.message || 'An error occurred');
          }
          console.error(`Error fetching ${url}:`, error);
        } else {
          console.warn(`Request to ${url} timed out`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, token, refetchIndex, defaultValue]);

  return { data, loading, error, refetch };
};