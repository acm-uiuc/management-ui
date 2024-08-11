// src/api/index.js
import axios from 'axios';
import { useMemo } from 'react';
import { useAuth } from '@/components/AuthContext';
import { getRunEnvironmentConfig, ValidService } from '@/config';

const createAxiosInstance = (baseURL: string) =>
  axios.create({
    baseURL,
  });

const useApi = (serviceName: ValidService) => {
  const { getToken, getApiToken } = useAuth();
  const api = useMemo(() => {
    const baseUrl = getRunEnvironmentConfig().ServiceConfiguration[serviceName].baseEndpoint;
    const instance = createAxiosInstance(baseUrl);

    instance.interceptors.request.use(
      async (config) => {
        const authToken = await getApiToken(serviceName);
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return instance;
  }, [getToken]);

  return api;
};

export { useApi };
