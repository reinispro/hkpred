
    import React from 'react';
    import { Helmet } from 'react-helmet';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { AlertTriangle } from 'lucide-react';

    const NotFoundPage = () => {
      return (
        <>
          <Helmet>
            <title>404 - Page Not Found</title>
          </Helmet>
          <div className="flex flex-col items-center justify-center min-h-screen text-center text-white p-4">
            <motion.div
              initial={{ opacity: 0, y: -50, rotate: -10 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
              className="glass-card p-8 md:p-16"
            >
              <AlertTriangle className="mx-auto h-24 w-24 text-yellow-300" />
              <h1 className="mt-8 text-6xl md:text-8xl font-black tracking-tighter">404</h1>
              <p className="mt-4 text-xl md:text-2xl font-light">Oops! Page not found.</p>
              <p className="mt-2 text-white/70 max-w-md">The page you are looking for might have been moved or doesn't exist.</p>
              <Button asChild className="mt-8 bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-bold">
                <Link to="/">Go Back Home</Link>
              </Button>
            </motion.div>
          </div>
        </>
      );
    };

    export default NotFoundPage;
  