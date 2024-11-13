import React, { ReactNode, useEffect, useState } from 'react';
import { Code, Text, Title } from '@mantine/core';
import { AcmAppShell } from '@/components/AppShell';
import { useApi } from '@/util/api';
import { getRunEnvironmentConfig, ValidService } from '@/config';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';

export type ResourceDefinition = { service: ValidService; validRoles: string[] };

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
        const result = await api.get(authCheckRoute);
        const userRoles = result.data.roles;
        let authenticated = false;
        for (const item of userRoles) {
          if (validRoles.indexOf(item) !== -1) {
            authenticated = true;
          }
        }
        setIsAuthenticated(authenticated);
      } catch (e) {
        setIsAuthenticated(false);
        console.error(e);
      }
    }
    getAuth();
  }, [baseEndpoint, authCheckRoute]);
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
