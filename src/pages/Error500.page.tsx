import React from 'react';
import { Container, Title, Text, Anchor } from '@mantine/core';
import { HeaderNavbar } from '@/components/Navbar';

export const Error500Page: React.FC = () => (
  <>
    <HeaderNavbar />
    <Container>
      <Title>Page Not Found</Title>
      <Text>
        Perhaps you would like to <Anchor href="/">go home</Anchor>?
      </Text>
    </Container>
  </>
);
