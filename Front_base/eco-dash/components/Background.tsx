import React from 'react';
import { Leaf } from 'lucide-react';

// COMPONENTE: Lluvia de Hojas de Otoño
const AutumnLeaves = () => {
  const leaves = Array.from({ length: 35 }).map((_, i) => {
    const colors = ['text-orange-500', 'text-red-500', 'text-amber-500', 'text-yellow-400', 'text-orange-600', 'text-rose-500'];
    const sizes = ['w-6 h-6', 'w-8 h-8', 'w-10 h-10', 'w-12 h-12', 'w-7 h-7', 'w-9 h-9'];
    const left = `${(i * 17) % 100}%`; 
    const duration = `${(i % 8) + 6}s`; 
    const delay = `${(i * 3) % 15}s`; 
    const direction = i % 2 === 0 ? 'hoja-otono-der' : 'hoja-otono-izq';

    return (
      <Leaf
        key={i}
        className={`${direction} ${colors[i % colors.length]} ${sizes[i % sizes.length]} absolute drop-shadow-xl opacity-90`}
        style={{ left, animationDuration: duration, animationDelay: delay }}
      />
    );
  });
  return <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">{leaves}</div>;
};

export default function Background() {
  return (
    <>
      <AutumnLeaves />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="luciernaga bg-yellow-300/30 blur-sm rounded-full w-5 h-5 absolute shadow-[0_0_15px_rgba(253,224,71,0.8)]" style={{ left: '20%', bottom: '30%', animationDelay: '0s' }}></div>
        <div className="luciernaga bg-yellow-300/20 blur-sm rounded-full w-7 h-7 absolute shadow-[0_0_20px_rgba(253,224,71,0.6)]" style={{ left: '80%', bottom: '50%', animationDelay: '2s' }}></div>
      </div>
      <style>{`

        /* Animaciones Globales */
        @keyframes caidaOtonoDer { 0% { transform: translateY(-15vh) translateX(0px) rotate(0deg); } 100% { transform: translateY(115vh) translateX(200px) rotate(720deg); } }
        @keyframes caidaOtonoIzq { 0% { transform: translateY(-15vh) translateX(0px) rotate(0deg); } 100% { transform: translateY(115vh) translateX(-200px) rotate(-720deg); } }
        .hoja-otono-der { animation: caidaOtonoDer linear infinite; top: -15vh; }
        .hoja-otono-izq { animation: caidaOtonoIzq linear infinite; top: -15vh; }
        @keyframes pulsoLuciernaga { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; } 50% { transform: translateY(-20px) scale(1.3); opacity: 1; } }
        .luciernaga { animation: pulsoLuciernaga 4s ease-in-out infinite; }
        @keyframes scanEKG { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
        .ekg-scanner-line { stroke-dasharray: 20 80; animation: scanEKG 1.5s linear infinite; }
        @keyframes scanWind { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: -100; } }
        .wind-scanner-1 { stroke-dasharray: 40 60; animation: scanWind 1.8s linear infinite; }
        .wind-scanner-2 { stroke-dasharray: 30 70; animation: scanWind 1.3s linear infinite; }
        .wind-scanner-3 { stroke-dasharray: 50 50; animation: scanWind 2.2s linear infinite; }
        @keyframes vientoRafaga { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
        .animar-viento-contenedor { animation: vientoRafaga 3s ease-in-out infinite; }
        @keyframes resplandorCarta { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .efecto-shiny { background: linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.5) 45%, rgba(255, 255, 255, 0.5) 55%, transparent 80%); background-size: 200% auto; animation: resplandorCarta 3.5s linear infinite; }
        @keyframes flotarLibro { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .animar-libro { animation: flotarLibro 2.5s ease-in-out infinite; }
        @keyframes latidoPlaneta { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .animar-latido-planeta { animation: latidoPlaneta 2s ease-in-out infinite; }

        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: #ffffff; cursor: pointer; margin-top: -10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.1); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; border-radius: 3px; }
        .slider-clima::-webkit-slider-runnable-track { background: #10b981; }
        .slider-clima::-webkit-slider-thumb { border: 3px solid #059669; }
        .slider-salud::-webkit-slider-runnable-track { background: #f97316; }
        .slider-salud::-webkit-slider-thumb { border: 3px solid #ea580c; }
      
      `}</style>
    </>
  );
}
