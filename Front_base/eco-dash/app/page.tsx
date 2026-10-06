"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import LoginScreen from '../components/LoginScreen';
import DashboardScreen from '../components/DashboardScreen';

export default function AppWrapper() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-950 flex items-center justify-center text-white font-bold">
        Cargando Kawsay Eco-Dash...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <DashboardScreen onLogout={handleLogout} />;
}