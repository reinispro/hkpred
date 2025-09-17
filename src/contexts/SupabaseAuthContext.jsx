import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const SupabaseAuthContext = createContext(null);

export const SupabaseAuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState(null);
  const { toast } = useToast();

  // 🔹 Ielādē lietotāja profilu no `profiles`
  const fetchUserSettings = useCallback(
    async (userId) => {
      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          toast({
            variant: 'destructive',
            title: 'Error fetching user profile',
            description: profileError.message,
          });
          return null;
        }
        return profile;
      }
      return null;
    },
    [toast]
  );

  // 🔹 Ielādē appSettings
  const fetchAppSettings = useCallback(async () => {
    const { data: settingsData, error: settingsError } = await supabase.from('app_settings').select('*');

    if (settingsError) {
      console.error('Error fetching app settings:', settingsError);
      toast({
        variant: 'destructive',
        title: 'Error fetching app settings',
        description: settingsError.message,
      });
    } else {
      const settingsMap = settingsData.reduce((acc, setting) => {
        acc[setting.setting_name] = {
          id: setting.id,
          is_enabled: setting.is_enabled,
          value_json: setting.value_json,
        };
        return acc;
      }, {});
      setAppSettings(settingsMap);
    }
  }, [toast]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) {
        const profile = await fetchUserSettings(currentSession.user.id);
        setUser(profile);
      }
      await fetchAppSettings();
      setLoading(false);
    };

    initialize();

    // 🔐 Klausāmies auth izmaiņas
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        const profile = await fetchUserSettings(newSession.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    // 📡 Klausāmies app_settings realtime izmaiņas
    const settingsListener = supabase
      .channel('app-settings-context-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        () => {
          console.log('App settings changed, refreshing...');
          fetchAppSettings();
        }
      )
      .subscribe();

    // 📡 Klausāmies user profile realtime izmaiņas
    const profileListener = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.new && payload.new.id === user?.id) {
          setUser(payload.new);
        }
      })
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(settingsListener).catch(console.error);
      supabase.removeChannel(profileListener).catch(console.error);
    };
  }, [fetchUserSettings, fetchAppSettings, user?.id]);

  // 🔹 Galvenā loģika
  const value = {
    session,
    user,
    loading,
    appSettings,
    signInWithPassword: (credentials) => supabase.auth.signInWithPassword(credentials),
    signOut: () => supabase.auth.signOut(),
    signUp: async (credentials) => {
      // Tikai Auth → pārējo izdara triggeris
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
            full_name: credentials.fullName,
          },
        },
      });

      return { data, error };
    },
  };

  if (loading) {
    return <WelcomeMessage />;
  }

  if (user && !user.approved && !window.location.pathname.includes('/auth')) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 flex flex-col items-center justify-center text-white p-4">
        <div className="text-center glass-card p-8 rounded-xl shadow-2xl max-w-md">
          <h1 className="text-4xl font-bold mb-4">Lietotājs gaida administratora apstiprinājumu</h1>
          <p className="text-lg mb-6">
            Paldies, ka reģistrējies! Tavu lietotājkontu administrators nav apstiprinājis. Pārbaudi vēlāk.
          </p>
          <Button onClick={() => value.signOut()}>Izrakstīties</Button>
        </div>
      </div>
    );
  }

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider.');
  }
  return context;
};
