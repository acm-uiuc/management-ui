import React, { ReactNode, useEffect, useState } from 'react';
import { Code, Text, Title } from '@mantine/core';
import { AcmAppShell } from '@/components/AppShell';
import { useApi } from '@/util/api';
import { getRunEnvironmentConfig, ValidService } from '@/config';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';

export const CACHE_KEY_PREFIX = 'auth_response_cache_';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

type CacheData = {
  data: any;  // Just the JSON response data
  timestamp: number;
};

export type ResourceDefinition = { 
  service: ValidService; 
  validRoles: string[] 
};

const getAuthCacheKey = (service: ValidService, route: string) => 
  `${CACHE_KEY_PREFIX}${service}_${route}`;

const getCachedResponse = (service: ValidService, route: string): CacheData | null => {
  const cached = sessionStorage.getItem(getAuthCacheKey(service, route));
  if (!cached) return null;
  
  try {
    const data = JSON.parse(cached) as CacheData;
    const now = Date.now();
    
    if (now - data.timestamp <= CACHE_DURATION) {
      return data;
    }
    // Clear expired cache
    sessionStorage.removeItem(getAuthCacheKey(service, route));
  } catch (e) {
    console.error('Error parsing auth cache:', e);
    sessionStorage.removeItem(getAuthCacheKey(service, route));
  }
  return null;
};

const setCachedResponse = (service: ValidService, route: string, data: any) => {
  const cacheData: CacheData = {
    data,
    timestamp: Date.now()
  };
  sessionStorage.setItem(getAuthCacheKey(service, route), JSON.stringify(cacheData));
};

// Function to clear auth cache for all services
export const clearAuthCache = () => {
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
};

export const AuthGuard: React.FC<{
  resourceDef: ResourceDefinition;
  children: ReactNode;
  isAppShell?: boolean;
}> = ({ resourceDef, children, isAppShell = true }) => {
  const { service, validRoles } = resourceDef;
  const { baseEndpoint, authCheckRoute, friendlyName } =
    getRunEnvironmentConfig().ServiceConfiguration[service];
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const api = useApi(service);

  useEffect(() => {
    async function getAuth() {
      try {
        if (!authCheckRoute) {
          setIsAuthenticated(true);
          return;
        }

        // Check for cached response first
        const cachedData = getCachedResponse(service, authCheckRoute);
        if (cachedData !== null) {
          const userRoles = cachedData.data.roles;
          let authenticated = false;
          for (const item of userRoles) {
            if (validRoles.indexOf(item) !== -1) {
              authenticated = true;
              break;
            }
          }
          setIsAuthenticated(authenticated);
          return;
        }

        // If no cache, make the API call
        const result = await api.get(authCheckRoute);
        // Cache just the response data
        setCachedResponse(service, authCheckRoute, result.data);

        const userRoles = result.data.roles;
        let authenticated = false;
        for (const item of userRoles) {
          if (validRoles.indexOf(item) !== -1) {
            authenticated = true;
            break;
          }
        }
        setIsAuthenticated(authenticated);
      } catch (e) {
        setIsAuthenticated(false);
        console.error(e);
      }
    }

    getAuth();
  }, [baseEndpoint, authCheckRoute, service]);

  if (isAuthenticated === null) {
    if (isAppShell) {
      return <FullScreenLoader />;
    }
    return null;
  }

  if (!isAuthenticated) {
    if (isAppShell) {
      return (
        <AcmAppShell>
          <Title>Unauthenticated</Title>
          <Text>
            Please request access to the <Code>{friendlyName}</Code> service from the ACM
            Infrastructure Team.
          </Text>
        </AcmAppShell>
      );
    }
    return null;
  }

  if (isAppShell) {
    return (
      <AcmAppShell>
        <Title order={1}>{friendlyName}</Title>
        {children}
      </AcmAppShell>
    );
  }
  
  return <>{children}</>;
};