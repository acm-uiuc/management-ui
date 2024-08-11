import React from 'react';
import { LoadingOverlay, useMantineColorScheme } from '@mantine/core';

const FullScreenLoader = () => {
  const { colorScheme } = useMantineColorScheme();
  return (
    <LoadingOverlay visible loaderProps={{ color: colorScheme === 'dark' ? 'white' : 'black' }} />
  );
};

export default FullScreenLoader;
