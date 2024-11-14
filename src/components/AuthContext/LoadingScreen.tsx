import { LoadingOverlay, useMantineColorScheme } from '@mantine/core';
import React from 'react';

const FullScreenLoader = () => {
  const { colorScheme } = useMantineColorScheme();
  return (
    <LoadingOverlay visible loaderProps={{ color: colorScheme === 'dark' ? 'white' : 'black' }} />
  );
};

export default FullScreenLoader;
