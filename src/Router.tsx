import React, { useState, useEffect, ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouteObject, RouterProvider } from 'react-router-dom';
import { Anchor, Text } from '@mantine/core';
import { LoginPage } from './pages/Login.page';
import { LogoutPage } from './pages/Logout.page';
import { Error404Page } from './pages/Error404.page';
import { Error500Page } from './pages/Error500.page';
import { AcmAppShell } from './components/AppShell';
import { useAuth } from './components/AuthContext';
import { HomePage } from './pages/Home.page';
import { EventsPage } from './pages/AddEvents.page';
import { getRunEnvironmentConfig } from './config';

const commonRoutes = [
  {
    path: '/force_login',
    element: <LoginPage />,
  },
  {
    path: '/logout',
    element: <LogoutPage />,
  },
  {
    path: '*',
    element: <Error404Page />,
  },
];

const unauthenticatedRouter = createBrowserRouter([
  ...commonRoutes,
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

const authenticatedRouter = createBrowserRouter([
  ...commonRoutes,
  {
    path: '/',
    element: <AcmAppShell>{null}</AcmAppShell>,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/logout',
    element: <LogoutPage />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/events/add',
    element: <EventsPage />,
  },
  {
    path: '/events/view',
    element: (
      <AcmAppShell>
        Go to{' '}
        <Anchor href="https://acm.illinois.edu/calendar">
          https://acm.illinois.edu/calendar
        </Anchor>{' '}
        to view events on the ACM website.
      </AcmAppShell>
    ),
  },
]);

interface ErrorBoundaryProps {
  children: ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onError = (errorObj: Error) => {
    setHasError(true);
    setError(errorObj);
  };

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      onError(event.error);
    };
    window.addEventListener('error', errorHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  if (hasError && error) {
    if (error.message === '404') {
      return <Error404Page />;
    }
    return <Error500Page />;
  }

  return <>{children}</>;
};

export const Router: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const router = isLoggedIn ? authenticatedRouter : unauthenticatedRouter;

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};
