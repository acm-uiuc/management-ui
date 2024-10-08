import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useMsal } from '@azure/msal-react';
import {
  AuthenticationResult,
  InteractionRequiredAuthError,
  InteractionStatus,
} from '@azure/msal-browser';
import { MantineProvider } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import FullScreenLoader from './LoadingScreen';
import { getRunEnvironmentConfig, ValidServices } from '@/config';

interface AuthContextDataWrapper {
  isLoggedIn: boolean;
  userData: AuthContextData | null;
  loginMsal: CallableFunction;
  logout: CallableFunction;
  getToken: CallableFunction;
  logoutCallback: CallableFunction;
  getApiToken: CallableFunction;
}

export type AuthContextData = {
  email?: string;
  name?: string;
};

export const AuthContext = createContext({} as AuthContextDataWrapper);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, inProgress, accounts } = useMsal();

  const [userData, setUserData] = useState<AuthContextData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const handleRedirect = async () => {
      const response = await instance.handleRedirectPromise();
      if (response) {
        handleMsalResponse(response);
      } else if (accounts.length > 0) {
        // User is already logged in, set the state
        const [lastName, firstName] = accounts[0].name?.split(',')! || [];
        setUserData({
          email: accounts[0].username,
          name: `${firstName} ${lastName}`,
        });
        setIsLoggedIn(true);
      }
    };

    if (inProgress === InteractionStatus.None) {
      handleRedirect();
    }
  }, [inProgress, accounts, instance]);

  const handleMsalResponse = useCallback((response: AuthenticationResult) => {
    if (response) {
      const { account } = response;
      if (account) {
        setUserData({
          email: account.username,
          name: account.name,
        });
        setIsLoggedIn(true);
      }
    }
  }, []);

  const getApiToken = useCallback(
    async (service: ValidServices) => {
      if (!userData) {
        return null;
      }
      const scope = getRunEnvironmentConfig().ServiceConfiguration[service].loginScope;
      const { apiId } = getRunEnvironmentConfig().ServiceConfiguration[service];
      if (!scope || !apiId) {
        return null;
      }
      const msalAccounts = instance.getAllAccounts();
      if (msalAccounts.length > 0) {
        const silentRequest = {
          account: msalAccounts[0],
          scopes: [scope], // Adjust scopes as needed,
          resource: apiId,
        };
        const tokenResponse = await instance.acquireTokenSilent(silentRequest);
        return tokenResponse.accessToken;
      }
      throw new Error('More than one account found, cannot proceed.');
    },
    [userData, instance]
  );

  const getToken = useCallback(async () => {
    if (!userData) {
      return null;
    }
    try {
      const msalAccounts = instance.getAllAccounts();
      if (msalAccounts.length > 0) {
        const silentRequest = {
          account: msalAccounts[0],
          scopes: ['.default'], // Adjust scopes as needed
        };
        const tokenResponse = await instance.acquireTokenSilent(silentRequest);
        return tokenResponse.accessToken;
      }
      throw new Error('More than one account found, cannot proceed.');
    } catch (error) {
      console.error('Silent token acquisition failed.', error);
      if (error instanceof InteractionRequiredAuthError) {
        // Fallback to interaction when silent token acquisition fails
        try {
          const interactiveRequest = {
            scopes: ['.default'], // Adjust scopes as needed
            redirectUri: '/', // Redirect URI after login
          };
          const tokenResponse: any = await instance.acquireTokenRedirect(interactiveRequest);
          return tokenResponse.accessToken;
        } catch (interactiveError) {
          console.error('Interactive token acquisition failed.', interactiveError);
          throw interactiveError;
        }
      } else {
        throw error;
      }
    }
  }, [userData, instance]);

  const loginMsal = useCallback(async () => {
    const accountsLocal = instance.getAllAccounts();
    if (accountsLocal.length > 0) {
      instance.setActiveAccount(accountsLocal[0]);
      setIsLoggedIn(true);
    } else {
      await instance.loginRedirect();
    }
  }, [instance]);

  const logout = useCallback(async () => {
    try {
      await instance.logoutRedirect();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [instance, userData]);
  const logoutCallback = () => {
    setIsLoggedIn(false);
    setUserData(null);
  };
  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userData, loginMsal, logout, getToken, logoutCallback, getApiToken }}
    >
      {inProgress !== InteractionStatus.None ? (
        <MantineProvider>
          <FullScreenLoader />
        </MantineProvider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
