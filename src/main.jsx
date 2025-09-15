import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { BrowserRouter as Router } from 'react-router-dom';
    import App from '@/App';
    import '@/index.css';
    import { Toaster } from "@/components/ui/toaster";
    import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <Router>
            <SupabaseAuthProvider>
                <App />
                <Toaster />
            </SupabaseAuthProvider>
        </Router>
      </React.StrictMode>
    );