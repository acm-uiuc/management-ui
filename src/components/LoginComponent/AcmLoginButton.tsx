import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { Button, ButtonProps } from '@mantine/core';

import { useAuth } from '../AuthContext';

export function AcmLoginButton(
  props: ButtonProps & React.ComponentPropsWithoutRef<'button'> & { returnTo: string }
) {
  const { loginMsal } = useAuth();
  const { inProgress } = useMsal();
  return (
    <Button
      leftSection={null}
      color="#FF5F05"
      variant="filled"
      {...{ ...props, returnTo: undefined }}
      onClick={async () => {
        await loginMsal(props.returnTo);
      }}
    />
  );
}
