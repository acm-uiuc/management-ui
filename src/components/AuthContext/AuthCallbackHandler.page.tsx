import React, { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import FullScreenLoader from './LoadingScreen';

export const AuthCallback: React.FC = () => {
  const { instance } = useMsal();
  const navigate = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    const handleCallback = async () => {
      
      try {
        // Check if we have pending redirects
        const response = await instance.handleRedirectPromise();
        if (!response) {
          navigate('/');
          return;
        }
        const returnPath = response.state || '/';
        const account = response.account;
        if (account) {
          instance.setActiveAccount(account);
        }

        navigate(returnPath);
      } catch (error) {
        console.error('Failed to handle auth redirect:', error);
        navigate('/login?error=callback_failed');
      }
    };

    setTimeout(() => {
      handleCallback();
    }, 100);

    // Cleanup function
    return () => {
      console.log('Callback component unmounting'); // Debug log 8
    };
  }, [instance, navigate]);

  return <FullScreenLoader />;
};

export default AuthCallback;