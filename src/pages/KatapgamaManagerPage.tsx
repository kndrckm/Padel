import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAppContext';
import KatapgamaManager from '../components/user/KatapgamaManager';

export function KatapgamaManagerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <KatapgamaManager 
      user={user}
      onBack={() => navigate('/')}
    />
  );
}
