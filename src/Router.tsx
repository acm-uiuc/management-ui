import React, { useState, useEffect, ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Anchor } from '@mantine/core';
import { LoginPage } from './pages/Login.page';
import { LogoutPage } from './pages/Logout.page';
import { Error404Page } from './pages/Error404.page';
import { Error500Page } from './pages/Error500.page';
import { AcmAppShell } from './components/AppShell';
import { useAuth } from './components/AuthContext';
import { HomePage } from './pages/Home.page';
import { ManageEventPage } from './pages/events/ManageEvent.page';
import { ViewEventsPage } from './pages/events/ViewEvents.page';
import { ScanTicketsPage } from './pages/tickets/ScanTickets.page';
import { ViewTicketsPage } from './pages/tickets/ViewTickets.page';
import { SelectTicketsPage } from './pages/tickets/SelectEventId.page';

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
    element: <ManageEventPage />,
  },
  {
    path: '/events/edit/:eventId',
    element: <ManageEventPage />,
  },
  {
    path: '/events/manage',
    element: <ViewEventsPage />,
  },
  {
    path: '/tickets/scan',
    element: <ScanTicketsPage />,
  },
  {
    path: '/tickets',
    element: <SelectTicketsPage />,
  },
  {
    path: '/tickets/manage/:eventId',
    element: <ViewTicketsPage />,
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
