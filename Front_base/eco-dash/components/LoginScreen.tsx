"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Leaf,
  LogIn,
  UserPlus,
  Loader2,
  Mail,
  Lock,
  User,
  Volume2,
  VolumeX,
  Info,
  X,
  Users,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import Background from './Background';
import { useAudio } from './AudioProvider';

export default function LoginScreen() {
  const { isMuted, toggleMute } = useAudio();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  useEffect(() => {
    if (!showCreditsModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreditsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreditsModal]);

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

      {/* CABECERA DE CONTROL DE AUDIO */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 pt-4 sm:px-6 sm:pt-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/15 text-emerald-100 text-xs font-bold tracking-wider uppercase">
          <Leaf className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span>ODS 3 • ODS 4 • ODS 13</span>
        </div>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3.5 py-2 min-h-[44px] rounded-full border border-white/20 shadow-lg hover:bg-white/20 hover:border-emerald-300/50 transition-all text-white font-bold text-xs cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-300 shrink-0" />
          )}
          <span className="hidden sm:inline">{isMuted ? 'Sonido Off' : 'Sonido On'}</span>
        </button>
      </header>
      
      <div className={`relative z-20 flex-1 flex items-center justify-center px-3.5 py-4 sm:p-6 transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        
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
                      aria-label="Nombre"
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
                      aria-label="Apellido"
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
                  aria-label="Correo electrónico"
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
                  aria-label="Contraseña"
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

      {/* PIE DE PÁGINA: CRÉDITOS Y TRANSPARENCIA IA */}
      <footer className="relative z-20 w-full max-w-5xl mx-auto px-4 pb-5 pt-2 text-center text-emerald-100/80 text-xs">
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
          <div className="text-left">
            <p className="font-bold text-white">
              Academia Naval Almirante Illingworth • Concurso Intercolegial &ldquo;Multimedia Teens 2026&rdquo; (UPS)
            </p>
            <p className="text-[11px] text-emerald-200/80">
              Equipo: Joel Jordán Maridueña, Melissa Nieto Martillo, Francisco Narváez Durán, Marcelo Zambrano Aguirre • Tutor: Ing. Joel Anthony Torres Urresto
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreditsModal(true)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-300/30 text-emerald-100 font-bold text-xs inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Créditos e IA</span>
          </button>
        </div>
      </footer>

      {/* MODAL DE CRÉDITOS Y TRANSPARENCIA IA */}
      {showCreditsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-credits-title"
          className="fixed inset-0 bg-emerald-950/85 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-2xl max-h-[88dvh] flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-t md:border border-white overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-200 flex justify-between items-center gap-3 bg-gradient-to-r from-emerald-50 to-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-700 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="min-w-0 text-left">
                  <h2 id="login-credits-title" className="text-lg sm:text-xl font-black text-stone-800">
                    Créditos y Transparencia IA
                  </h2>
                  <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                    Multimedia Teens 2026 • Categoría Diseño Web
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreditsModal(false)}
                aria-label="Cerrar modal de créditos"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto scrollbar-hide space-y-4 text-left text-stone-700 text-xs sm:text-sm">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                <h3 className="font-black text-emerald-950 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" /> Equipo Desarrollador e Institución
                </h3>
                <p className="font-bold text-stone-800 mb-1">
                  Institución Educativa: <span className="font-medium">Academia Naval Almirante Illingworth</span>
                </p>
                <p className="font-bold text-stone-800 mb-2">
                  Docente Tutor: <span className="font-medium">Ing. Joel Anthony Torres Urresto</span>
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-semibold text-stone-700">
                  <li>• Jordán Maridueña Joel Alexander</li>
                  <li>• Nieto Martillo Melissa Dakota</li>
                  <li>• Narváez Durán Francisco Isaías</li>
                  <li>• Zambrano Aguirre Marcelo Humberto</li>
                </ul>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                <h3 className="font-black text-amber-950 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Declaración de Uso de Inteligencia Artificial
                </h3>
                <div>
                  <p className="font-black text-stone-800">Google Antigravity</p>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Intervención directa en el entorno de desarrollo para depuración, refactorización e implementación de código en TypeScript (Next.js) y Python (FastAPI), así como la validación de consultas SQL/RPC en PostgreSQL y revisión de documentación técnica.
                  </p>
                </div>
                <div>
                  <p className="font-black text-stone-800">Google Gemini</p>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Asistencia consultiva para diseño de prompts, ideación de experiencia de usuario (UX/UI), estructuración de métricas ODS y auditoría de cumplimiento reglamentario.
                  </p>
                </div>
                <div>
                  <p className="font-black text-stone-800">Suno AI</p>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Generación de las 4 pistas instrumentales de ambientación (Musica1–4.ogg) mediante inteligencia artificial generativa, garantizando música original y libre de derechos de autor de terceros.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

