import { Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoginComponent } from '@/components/LoginComponent';
import { HeaderNavbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home');
    }
  }, [navigate, isLoggedIn]);
  return (
    <div style={{ display: 'flex', flexFlow: 'column', height: '100vh' }}>
      <HeaderNavbar />
      <Center style={{ flexGrow: 1 }}>
        <LoginComponent />
      </Center>
    </div>
  );
}
