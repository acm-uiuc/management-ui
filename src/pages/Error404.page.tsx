import React from 'react';
import { Container, Title, Text, Anchor } from '@mantine/core';
import { HeaderNavbar } from '@/components/Navbar';

export const Error404Page: React.FC<{ showNavbar?: boolean }> = ({ showNavbar }) => {
  const realStuff = (
    <>
      <Title>Page Not Found</Title>
      <Text>
        Perhaps you would like to <Anchor href="/">go home</Anchor>?
      </Text>
    </>
  );
  if (!showNavbar) {
    return realStuff;
  }
  return (
    <>
      <HeaderNavbar />
      <Container>{realStuff}</Container>
    </>
  );
};
