"use client";
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Leaf, LogIn, UserPlus, Loader2, Mail, Lock } from 'lucide-react';
import Background from './Background'; // We extracted this

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Si el registro fue exitoso y requiere confirmación, revisa tu correo. Si no, inicia sesión.");
        setIsRegistering(false);
      } else {
        setIsTransitioning(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsTransitioning(false);
          throw error;
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 text-stone-800 font-sans selection:bg-green-500 selection:text-white overflow-hidden relative">
      <Background />
      
      <div className={`absolute inset-0 z-20 flex items-center justify-center p-4 transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.4)] text-center relative overflow-hidden animate-in zoom-in-95 duration-700">
          
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-green-400 opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-300 opacity-20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-5 rounded-3xl shadow-lg shadow-green-500/30 border border-green-300 animar-latido-planeta">
                <Leaf className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 drop-shadow-md">
              Kawsay <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">App</span>
            </h1>
            <p className="text-emerald-100/80 font-medium mb-10">Tu viaje hacia un mundo más verde empieza aquí.</p>

            <form onSubmit={handleAuth} className="flex flex-col gap-5">
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-emerald-200/60 group-focus-within:text-emerald-300 transition-colors" />
                </div>
                <input 
                  type="email" 
                  placeholder="Tu correo (Obligatorio)" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300/50 transition-all backdrop-blur-sm"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-emerald-200/60 group-focus-within:text-emerald-300 transition-colors" />
                </div>
                <input 
                  type="password" 
                  placeholder="Tu contraseña" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300/50 transition-all backdrop-blur-sm"
                />
              </div>

              {error && <div className="text-red-400 text-sm font-bold bg-red-900/30 py-2 px-4 rounded-xl border border-red-500/20">{error}</div>}

              <button 
                type="submit"
                disabled={loading}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl shadow-lg hover:shadow-[0_10px_30px_rgba(52,211,153,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? 'Crear Cuenta' : 'Ingresar'}
                </span>
              </button>
            </form>

            <p className="mt-6 text-emerald-100/50 text-sm">
              {isRegistering ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-emerald-300 hover:text-white font-bold underline decoration-emerald-500/50 underline-offset-4 transition-colors">
                {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
