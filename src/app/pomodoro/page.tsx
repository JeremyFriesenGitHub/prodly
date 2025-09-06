"use client";

import { useState, useRef, useEffect } from "react";

const MODES = [
  { name: "Pomodoro", duration: 25 * 60 },
  { name: "Short Break", duration: 5 * 60 },
  { name: "Long Break", duration: 15 * 60 },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Particles() {
  const [particles, setParticles] = useState<{ key:number; className:string; style:React.CSSProperties }[]>([]);
  useEffect(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({
      key: i,
      className: `absolute rounded-full bg-white/10 blur-lg animate-particle${i % 3 + 1}`,
      style: {
        width: `${16 + Math.random() * 24}px`,
        height: `${16 + Math.random() * 24}px`,
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 90}%`,
        opacity: 0.5 + Math.random() * 0.5,
      },
    }));
    setParticles(arr);
  }, []);
  return particles.map(p => <div key={p.key} className={p.className} style={p.style} />);
}

export default function PomodoroApp() {
  const [mode, setMode] = useState(0);
  const [seconds, setSeconds] = useState(MODES[mode].duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSeconds(MODES[mode].duration);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((sec) => {
          if (sec > 0) return sec - 1;
          setIsRunning(false);
          return 0;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] font-sans p-4 sm:p-8 overflow-hidden min-h-screen w-full h-full">
      {/* Animated background shapes and particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Main gradient blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-[#a5b4fc] to-[#818cf8] opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-gradient-to-tr from-[#fca5a5] to-[#f87171] opacity-30 rounded-full blur-3xl animate-pulse" />
        {/* Extra animated fire-like gradients */}
        <div className="absolute top-1/2 left-1/4 w-[180px] h-[180px] bg-gradient-to-br from-[#fbbf24] via-[#f87171] to-[#f43f5e] opacity-20 rounded-full blur-2xl animate-fire" />
        <div className="absolute bottom-1/3 right-1/4 w-[160px] h-[160px] bg-gradient-to-tr from-[#34d399] via-[#818cf8] to-[#fbbf24] opacity-20 rounded-full blur-2xl animate-fire2" />
  <Particles />
      </div>
  <div className="w-full flex flex-col items-center justify-center z-10">
      {/* Animated background shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-[#a5b4fc] to-[#818cf8] opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-gradient-to-tr from-[#fca5a5] to-[#f87171] opacity-30 rounded-full blur-3xl animate-pulse" />
      </div>

  <h1 className="text-3xl sm:text-5xl font-extrabold mb-6 sm:mb-10 text-center drop-shadow-lg z-10 animate-fade-in animate-gradient-text bg-gradient-to-r from-[#818cf8] via-[#fca5a5] to-[#fbbf24] bg-clip-text text-transparent">Pomodoro Timer</h1>

  <div className="mb-6 sm:mb-10 w-full flex justify-center z-10 animate-fade-in">
    <div className="inline-flex gap-1 rounded-full border border-foreground/20 bg-foreground/5 backdrop-blur px-1 py-1 shadow-sm">
      {MODES.map((m, i) => {
        const active = mode === i;
        return (
          <button
            key={m.name}
            onClick={() => setMode(i)}
            disabled={isRunning}
            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap relative focus:outline-none focus:ring-2 focus:ring-foreground/40 disabled:cursor-not-allowed ${
              active
                ? "bg-foreground text-background shadow hover:shadow-md"
                : "text-foreground/70 hover:text-foreground hover:bg-foreground/10"
            }`}
            aria-pressed={active}
          >
            {m.name}
          </button>
        );
      })}
    </div>
  </div>

      {/* Animated timer */}
      <div className="flex items-center justify-center w-full">
        <div className="relative w-full flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 rounded-full bg-gradient-to-tr from-[#818cf8] to-[#fca5a5] opacity-30 blur-2xl animate-pulse animate-spin-slow`} />
          </div>
          <div className="relative z-10">
            <span className="block text-6xl sm:text-8xl lg:text-9xl font-mono mb-6 sm:mb-8 text-center w-full transition-all duration-500 ease-in-out animate-timer animate-gradient-text bg-gradient-to-r from-[#818cf8] via-[#fca5a5] to-[#fbbf24] bg-clip-text text-transparent">
              {formatTime(seconds)}
            </span>
          </div>
        </div>
      </div>

  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center z-10 animate-fade-in max-w-md mx-auto">
    <button
      className="min-w-[140px] px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm sm:text-base shadow hover:bg-foreground/85 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={() => setIsRunning((r) => !r)}
    >
      {isRunning ? "Pause" : seconds === 0 ? "Restart" : "Start"}
    </button>
    <button
      className="min-w-[140px] px-5 py-2.5 rounded-xl bg-background border border-foreground/40 text-foreground font-semibold text-sm sm:text-base shadow hover:bg-foreground hover:text-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/40 disabled:opacity-40 disabled:cursor-not-allowed"
      onClick={() => {
        setSeconds(MODES[mode].duration);
        setIsRunning(false);
      }}
      disabled={seconds === MODES[mode].duration && !isRunning}
    >
      Reset
    </button>
  </div>

  <footer className="mt-8 sm:mt-12 text-xs text-center opacity-80 w-full z-10 animate-fade-in">
        Made with Next.js, React & TailwindCSS
      </footer>

      {/* Custom keyframes for fade-in, timer, fire, and particles animation */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes timer {
          0% { letter-spacing: 0.1em; filter: blur(2px); opacity: 0.7; }
          50% { letter-spacing: 0.05em; filter: blur(0.5px); opacity: 1; }
          100% { letter-spacing: 0.1em; filter: blur(0px); opacity: 1; }
        }
        .animate-timer {
          animation: timer 0.7s cubic-bezier(.4,0,.2,1);
        }
        @keyframes gradient-text {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 2.5s ease-in-out infinite alternate;
        }
        @keyframes fire {
          0% { transform: scale(1) translateY(0); opacity: 0.7; }
          50% { transform: scale(1.1) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 0.7; }
        }
        .animate-fire {
          animation: fire 2.2s ease-in-out infinite;
        }
        @keyframes fire2 {
          0% { transform: scale(1) translateY(0); opacity: 0.7; }
          50% { transform: scale(1.15) translateY(10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 0.7; }
        }
        .animate-fire2 {
          animation: fire2 2.7s ease-in-out infinite;
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        @keyframes particle1 {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
          100% { transform: translateY(0) scale(1); opacity: 0.5; }
        }
        .animate-particle1 {
          animation: particle1 3.2s ease-in-out infinite;
        }
        @keyframes particle2 {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(20px) scale(0.8); opacity: 0.7; }
          100% { transform: translateY(0) scale(1); opacity: 0.5; }
        }
        .animate-particle2 {
          animation: particle2 2.7s ease-in-out infinite;
        }
        @keyframes particle3 {
          0% { transform: translateX(0) scale(1); opacity: 0.5; }
          50% { transform: translateX(20px) scale(1.1); opacity: 0.7; }
          100% { transform: translateX(0) scale(1); opacity: 0.5; }
        }
        .animate-particle3 {
          animation: particle3 3.7s ease-in-out infinite;
        }
      `}</style>
      </div>
    </div>
  );
}
