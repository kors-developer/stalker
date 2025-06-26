import React, { useState, useEffect } from 'react';
import { UserInterface } from '@/components/UserInterface';
import { AdminLogin, AdminPanel } from '@/components/AdminPanel';
import { checkAdminSession } from '@/services/databaseService';

type AppState = 'user' | 'admin-login' | 'admin-panel';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('user');

  // Check for existing admin session
  useEffect(() => {
    const checkAdminAuth = async () => {
      const savedToken = localStorage.getItem('admin_session_token');
      if (savedToken) {
        const result = await checkAdminSession(savedToken);
        if (result.isValid) {
          setAppState('admin-panel');
        }
      }
    };
    
    checkAdminAuth();
  }, []);

  const handleAdminAccess = () => {
    setAppState('admin-login');
  };

  const handleAdminLogin = () => {
    setAppState('admin-panel');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_session_token');
    setAppState('user');
  };

  switch (appState) {
    case 'user':
      return <UserInterface onAdminAccess={handleAdminAccess} />;
    
    case 'admin-login':
      return <AdminLogin onLogin={handleAdminLogin} />;
    
    case 'admin-panel':
      return <AdminPanel onLogout={handleAdminLogout} />;
    
    default:
      return <UserInterface onAdminAccess={handleAdminAccess} />;
  }
};

export default Index;
