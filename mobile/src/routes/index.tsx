import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthRoutes } from './auth.routes';
import { AppRoutes } from './app.routes';
import { useAuthStore } from '../store/authStore';
import { stompClient } from '../services/ws/stompClient';

export function Router() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    console.log('[router] auth effect — isAuthenticated:', isAuthenticated, 'token?', !!token);
    if (isAuthenticated && token) {
      stompClient.connect(token);
    } else {
      stompClient.disconnect();
    }
  }, [isAuthenticated, token]);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppRoutes /> : <AuthRoutes />}
    </NavigationContainer>
  );
}
