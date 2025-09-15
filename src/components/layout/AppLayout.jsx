
    import React from 'react';
    import { Outlet } from 'react-router-dom';
    import Header from '@/components/layout/Header';
    import { motion } from 'framer-motion';

    const AppLayout = ({ onLogout }) => {
      return (
        <div className="min-h-screen flex flex-col">
          <Header onLogout={onLogout} />
          <main className="flex-grow p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      );
    };

    export default AppLayout;
  