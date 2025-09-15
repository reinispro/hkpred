
    import React from 'react';
    import { Navigate } from 'react-router-dom';
    import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
    import WelcomeMessage from './WelcomeMessage';

    const AdminRoute = ({ children }) => {
      const { user, loading } = useSupabaseAuth();

      if (loading) {
        return <WelcomeMessage />;
      }

      if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
      }

      return children;
    };

    export default AdminRoute;
  