import React from 'react';
// COMPONENTE: Corazón (EKG)
export const AnimatedHeartIcon = ({ className = "" }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full opacity-50">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full drop-shadow-[0_0_5px_currentColor]">
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" pathLength="100" className="ekg-scanner-line" />
    </svg>
  </div>
);

// COMPONENTE: Viento
export const AnimatedWindIcon = ({ className = "" }) => (
  <div className={`relative ${className} animar-viento-contenedor`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full opacity-40">
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2"/>
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/>
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>
    </svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full drop-shadow-[0_0_5px_currentColor]">
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2" pathLength="100" className="wind-scanner-1" />
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" pathLength="100" className="wind-scanner-2" />
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2" pathLength="100" className="wind-scanner-3" />
    </svg>
  </div>
);

