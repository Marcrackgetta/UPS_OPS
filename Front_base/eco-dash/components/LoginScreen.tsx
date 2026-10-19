"use client";
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Leaf, LogIn, UserPlus, Loader2, Mail, Lock, User } from 'lucide-react';
import Background from './Background';

export default function LoginScreen() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    const cleanNombre = nombre.trim();
    const cleanApellido = apellido.trim();

    try {
      if (isRegistering) {
        if (!cleanNombre || !cleanApellido) {
          throw new Error('Por favor ingresa tu nombre y apellido.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              nombre: cleanNombre,
              apellido: cleanApellido,
              full_name: `${cleanNombre} ${cleanApellido}`.trim(),
            },
          },
        });
        if (signUpError) throw signUpError;

        // Persistencia dual: sincronizar también en la tabla pública `usuarios`
        if (data?.user?.id) {
          try {
            await supabase.from('usuarios').upsert(
              {
                id: data.user.id,
                email: cleanEmail,
                nombre: cleanNombre,
                apellido: cleanApellido,
                curiosidades_desbloqueadas: [1],
              },
              { onConflict: 'id' }
            );
          } catch {
            // Si requiere confirmación por correo antes de crear sesión activa,
            // el trigger on_auth_user_created en PostgreSQL persiste nombre y apellido.
          }
        }

        if (!data?.session) {
          setInfoMessage('Registro exitoso. Si requiere confirmación, revisa tu correo; de lo contrario, inicia sesión.');
          setIsRegistering(false);
        }
      } else {
        setIsTransitioning(true);
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) {
          setIsTransitioning(false);
          throw signInError;
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsRegistering((prev) => !prev);
    setError(null);
    setInfoMessage(null);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 text-stone-800 font-sans selection:bg-green-500 selection:text-white overflow-x-hidden overflow-y-auto relative flex flex-col">
      <Background />
      
      <div className={`relative z-20 flex-1 flex items-center justify-center px-3.5 py-6 sm:p-6 transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-5 sm:p-8 md:p-10 rounded-[1.75rem] sm:rounded-[3rem] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.4)] text-center relative overflow-hidden animate-in zoom-in-95 duration-700">
          
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-green-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3.5 sm:p-5 rounded-3xl shadow-lg shadow-green-500/30 border border-green-300 animar-latido-planeta">
                <Leaf className="w-9 h-9 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-1.5 sm:mb-2 drop-shadow-md">
              Kawsay <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">App</span>
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/80 font-medium mb-5 sm:mb-8">
              Tu viaje hacia un mundo más verde empieza aquí.
            </p>

            <form onSubmit={handleAuth} className="flex flex-col gap-3.5 sm:gap-4 text-left">
              {isRegistering && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-emerald-200/60 group-focus-within:text-emerald-300 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="nombre"
                      autoComplete="given-name"
                      placeholder="Nombre"
                      required={isRegistering}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-3.5 text-base sm:text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300/50 transition-all backdrop-blur-sm"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-emerald-200/60 group-focus-within:text-emerald-300 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="apellido"
                      autoComplete="family-name"
                      placeholder="Apellido"
                      required={isRegistering}
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-3.5 text-base sm:text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300/50 transition-all backdrop-blur-sm"
                    />
                  </div>
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-emerald-200/60 group-focus-within:text-emerald-300 transition-colors" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  autoComplete="email"
                  placeholder="Correo electrónico" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 text-base text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300/50 transition-all backdrop-blur-sm"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-emerald-200/60 group-focus-within:text-emerald-300 transition-colors" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  placeholder="Contraseña" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 text-base text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300/50 transition-all backdrop-blur-sm"
                />
              </div>

              {error && (
                <div className="text-red-200 text-xs sm:text-sm font-bold bg-red-900/40 py-2.5 px-4 rounded-xl border border-red-500/30 text-center">
                  {error}
                </div>
              )}

              {infoMessage && (
                <div className="text-emerald-100 text-xs sm:text-sm font-bold bg-emerald-900/50 py-2.5 px-4 rounded-xl border border-emerald-400/40 text-center">
                  {infoMessage}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="group relative overflow-hidden min-h-[48px] bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black uppercase tracking-widest text-sm py-3.5 sm:py-4 rounded-2xl shadow-lg hover:shadow-[0_10px_30px_rgba(52,211,153,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1 sm:mt-2 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? 'Crear Cuenta' : 'Ingresar'}
                </span>
              </button>
            </form>

            <div className="mt-4 sm:mt-6 text-emerald-100/70 text-xs sm:text-sm flex flex-wrap items-center justify-center gap-1">
              <span>{isRegistering ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}</span>
              <button
                type="button"
                onClick={toggleAuthMode}
                className="min-h-[44px] inline-flex items-center px-2 py-1 text-emerald-300 hover:text-white font-bold underline decoration-emerald-500/50 underline-offset-4 transition-colors cursor-pointer"
              >
                {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

