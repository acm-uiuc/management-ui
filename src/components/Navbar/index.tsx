'use client';

import { Group, Divider, Box, Burger, Drawer, ScrollArea, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './index.module.css';
import LogoBadge from './Logo';
import { AuthContextData, useAuth } from '../AuthContext';
import { AuthenticatedProfileDropdown } from '../ProfileDropdown';
import { extLinks, navItems, renderNavItems } from '../AppShell';
import { useNavigate } from 'react-router-dom';

const HeaderNavbar: React.FC = () => {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const { isLoggedIn, userData } = useAuth();
  const navigate = useNavigate();
  return (
    <Box>
      <header className={classes.header}>
        <Group justify="space-between" align="center" h="100%">
          <Group justify="start" align="center" h="100%" gap={10}>
            <LogoBadge />
          </Group>
          <Group h="100%" justify="end" align="center" gap={10} visibleFrom="sm">
            {isLoggedIn ? `Welcome ${userData?.name}!` : 'Not Logged In'}
          </Group>
          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="ACM@UIUC Management Portal"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          {renderNavItems(navItems, '', navigate)}
          <Divider my="sm" />
          {renderNavItems(extLinks, '', navigate)}
          <Divider my="sm" />
          {userData ? <AuthenticatedProfileDropdown userData={userData} /> : null}
        </ScrollArea>
      </Drawer>
    </Box>
  );
};

export { HeaderNavbar };
