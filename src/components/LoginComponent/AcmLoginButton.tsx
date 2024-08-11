import { Button, ButtonProps } from '@mantine/core';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useAuth } from '../AuthContext';

export function AcmLoginButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  const { loginMsal } = useAuth();
  const { inProgress } = useMsal();
  return (
    <Button
      leftSection={null}
      color="#FF5F05"
      variant="filled"
      {...props}
      onClick={async () => {
        await loginMsal();
      }}
    />
  );
}
