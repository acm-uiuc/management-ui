import { useState } from 'react';
import {
  Popover,
  Box,
  Center,
  Group,
  ThemeIcon,
  Text,
  SimpleGrid,
  UnstyledButton,
  Divider,
  Button,
  rem,
  useMantineTheme,
} from '@mantine/core';

import { IconChevronDown, IconUser, IconMail, IconBuilding } from '@tabler/icons-react';
import classes from '../Navbar/index.module.css';
import { AuthContextData, useAuth } from '../AuthContext';

interface ProfileDropdownProps {
  userData?: AuthContextData;
}

const AuthenticatedProfileDropdown: React.FC<ProfileDropdownProps> = ({ userData }) => {
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();
  const { logout } = useAuth();
  if (!userData) {
    return null;
  }
  return (
    <Popover
      width={300}
      position="bottom"
      radius="md"
      shadow="md"
      withinPortal
      opened={opened}
      onClose={() => setOpened(false)}
      zIndex={1000010}
    >
      <Popover.Target>
        <a
          href="#"
          className={classes.link}
          onClick={(event) => {
            event.preventDefault();
            setOpened((o) => !o);
          }}
        >
          <Center inline>
            <Box component="span" mr={5}>
              My Account
            </Box>
            <IconChevronDown
              style={{ width: rem(16), height: rem(16) }}
              color={theme.colors.blue[6]}
            />
          </Center>
        </a>
      </Popover.Target>

      <Popover.Dropdown
        style={{ overflow: 'hidden' }}
        aria-label="Authenticated My Account Dropdown"
      >
        <SimpleGrid cols={1} spacing={0}>
          <UnstyledButton className={classes.subLink} key="name">
            <Group wrap="nowrap" align="flex-start">
              <ThemeIcon size={40} variant="default" radius="md">
                <IconUser
                  style={{ width: rem(22), height: rem(22) }}
                  color={theme.colors.blue[6]}
                />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Name
                </Text>
                <Text size="sm" fw={500}>
                  {userData.name}
                </Text>
              </div>
            </Group>
          </UnstyledButton>
          <UnstyledButton className={classes.subLink} key="email">
            <Group wrap="nowrap" align="flex-start">
              <ThemeIcon size={40} variant="default" radius="md">
                <IconMail
                  style={{ width: rem(22), height: rem(22) }}
                  color={theme.colors.blue[6]}
                />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Email
                </Text>
                <Text size="sm" fw={500}>
                  {userData.email}
                </Text>
              </div>
            </Group>
          </UnstyledButton>
          <Divider my="sm" />
          <Button
            variant="outline"
            fullWidth
            onClick={async () => {
              await logout();
            }}
          >
            Log Out
          </Button>
        </SimpleGrid>
      </Popover.Dropdown>
    </Popover>
  );
};

export { AuthenticatedProfileDropdown };
