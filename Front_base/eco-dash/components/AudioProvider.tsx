"use client";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface AudioContextType {
  playInteractionSound: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType>({
  playInteractionSound: () => {},
  isMuted: false,
  toggleMute: () => {},
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentSongIndex = useRef<number>(0);
  const hasInteracted = useRef<boolean>(false);
  const songs = useRef<string[]>([
    '/Media/Musica1.ogg',
    '/Media/Musica2.ogg',
    '/Media/Musica3.ogg',
    '/Media/Musica4.ogg'
  ]);

  const playInteractionSound = useCallback(() => {
    if (isMutedRef.current) return;
    if (sfxAudioRef.current) {
      sfxAudioRef.current.currentTime = 0;
      sfxAudioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (musicAudioRef.current) {
        musicAudioRef.current.muted = next;
        if (next) {
          musicAudioRef.current.pause();
        } else if (hasInteracted.current) {
          musicAudioRef.current.play().catch(e => console.warn("Music resume blocked", e));
        }
      }
      if (sfxAudioRef.current) {
        sfxAudioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inicializar audios
    musicAudioRef.current = new Audio();
    musicAudioRef.current.volume = 0.15; // Fondo
    musicAudioRef.current.muted = isMutedRef.current;
    
    sfxAudioRef.current = new Audio('/Media/sonido.ogg');
    sfxAudioRef.current.volume = 0.5; // Efecto
    sfxAudioRef.current.muted = isMutedRef.current;

    // Aleatorizar la canción inicial
    currentSongIndex.current = Math.floor(Math.random() * songs.current.length);
    musicAudioRef.current.src = songs.current[currentSongIndex.current];

    const handleSongEnd = () => {
      currentSongIndex.current = (currentSongIndex.current + 1) % songs.current.length;
      if (musicAudioRef.current) {
        musicAudioRef.current.src = songs.current[currentSongIndex.current];
        if (!isMutedRef.current) {
          musicAudioRef.current.play().catch(e => console.warn("Music next song blocked", e));
        }
      }
    };

    musicAudioRef.current.addEventListener('ended', handleSongEnd);

    // Listener de primera interacción
    const startMusic = () => {
      if (!hasInteracted.current) {
        hasInteracted.current = true;
        if (musicAudioRef.current && !isMutedRef.current) {
          musicAudioRef.current.play().catch(e => console.warn("Music play blocked", e));
        }
      }
    };

    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });

    // Listener global para clics interactivos
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Identificar si el elemento es interactivo
      const isInteractive = target.closest('button') || 
                            target.closest('a') || 
                            target.closest('input[type="submit"]') || 
                            target.closest('input[type="button"]') || 
                            target.closest('[role="button"]') || 
                            target.closest('.cursor-pointer');
      
      if (isInteractive) {
        playInteractionSound();
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.removeEventListener('ended', handleSongEnd);
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      if (sfxAudioRef.current) {
        sfxAudioRef.current = null;
      }
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [playInteractionSound]);

  return (
    <AudioContext.Provider value={{ playInteractionSound, isMuted, toggleMute }}>
      {children}
    </AudioContext.Provider>
  );
};
