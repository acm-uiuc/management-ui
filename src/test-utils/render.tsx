import React, { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

interface WrapperProps {
  children?: React.ReactNode;
}

const AllProviders: React.FC<WrapperProps> = ({ children }) => (
  <MantineProvider>
    <Notifications position="top-right" />
    {children}
  </MantineProvider>
);

const customRender = (ui: ReactElement, options = {}) =>
  rtlRender(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
