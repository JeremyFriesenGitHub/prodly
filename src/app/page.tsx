"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  // particle state
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<
    { key: number; className: string; style: React.CSSProperties }[]
  >([]);

  useEffect(() => {
    setMounted(true);
    const arr = Array.from({ length: 12 }, (_, i) => ({
      key: i,
      className: `absolute rounded-full bg-white/10 blur-lg animate-particle${
        i % 3 + 1
      }`,
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

  return (
  <div className="relative min-h-screen min-h-dvh w-full flex flex-col justify-center text-[var(--foreground)] overflow-hidden">
      {/* === Shared Background from Pomodoro === */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Gradient blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-[#a5b4fc] to-[#818cf8] opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-gradient-to-tr from-[#fca5a5] to-[#f87171] opacity-30 rounded-full blur-3xl animate-pulse" />
        {/* Fire-like blobs */}
        <div className="absolute top-1/2 left-1/4 w-[180px] h-[180px] bg-gradient-to-br from-[#fbbf24] via-[#f87171] to-[#f43f5e] opacity-20 rounded-full blur-2xl animate-fire" />
        <div className="absolute bottom-1/3 right-1/4 w-[160px] h-[160px] bg-gradient-to-tr from-[#34d399] via-[#818cf8] to-[#fbbf24] opacity-20 rounded-full blur-2xl animate-fire2" />
        {/* Floating particles */}
        {mounted &&
          particles.map((p) => (
            <div key={p.key} className={p.className} style={p.style} />
          ))}
      </div>

      {/* === Foreground Content (Full Layout) === */}
      <div className="relative z-10 w-full px-6 sm:px-12 lg:px-24 py-24 flex flex-col gap-16">
        <section className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight animate-gradient-text bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
              Welcome to Prodly!
            </h1>
            <p className="text-lg sm:text-2xl light:text-black max-w-3xl mx-auto lg:mx-0">
              The all-in-one AI productivity platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            </div>
          </div>
        </section>

        <section aria-label="Feature Highlights" className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div
              className="p-8 flex flex-col items-center rounded-3xl bg-white/60 dark:bg-gray-900/50 shadow-xl border border-white/30 dark:border-gray-800/40 glass-card backdrop-blur-xl"
              role="region"
              aria-label="Stay Focused"
            >
              <span className="text-4xl mb-2">🍅</span>
              <h3 className="font-semibold text-xl text-indigo-700 dark:text-indigo-300">Stay Focused</h3>
              <p className="text-sm mt-2 text-gray-700 dark:text-gray-200 text-center">
                Use structured intervals to beat distractions and build deep work momentum.
              </p>
            </div>
            <div
              className="p-8 flex flex-col items-center rounded-3xl bg-white/60 dark:bg-gray-900/50 shadow-xl border border-white/30 dark:border-gray-800/40 glass-card backdrop-blur-xl"
              role="region"
              aria-label="Track Spending"
            >
              <span className="text-4xl mb-2">💸</span>
              <h3 className="font-semibold text-xl text-pink-700 dark:text-pink-300">Track Spending</h3>
              <p className="text-sm mt-2 text-gray-700 dark:text-gray-200 text-center">
                Log expenses effortlessly and recognize patterns in your habits.
              </p>
            </div>
            <div
              className="p-8 flex flex-col items-center rounded-3xl bg-white/60 dark:bg-gray-900/50 shadow-xl border border-white/30 dark:border-gray-800/40 glass-card backdrop-blur-xl"
              role="region"
              aria-label="Celebrate Progress"
            >
              <span className="text-4xl mb-2">🎉</span>
              <h3 className="font-semibold text-xl text-yellow-700 dark:text-yellow-300">Celebrate Progress</h3>
              <p className="text-sm mt-2 text-gray-700 dark:text-gray-200 text-center">
                See your streaks and wins to stay motivated every single day.
              </p>
            </div>
          </div>
        </section>

        <footer className="text-xs text-center lg:text-left opacity-80 max-w-7xl mx-auto">
          Made with <span className="font-bold">Next.js</span>, <span className="font-bold">React</span> & <span className="font-bold">TailwindCSS</span>
        </footer>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 2.5s ease-in-out infinite alternate;
        }
        @keyframes gradient-text {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        /* keep card enhancement */
        .glass-card { box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18); }
        @keyframes fire {
          0% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1) translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
        }
        .animate-fire {
          animation: fire 2.2s ease-in-out infinite;
        }
        @keyframes fire2 {
          0% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15) translateY(10px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
        }
        .animate-fire2 {
          animation: fire2 2.7s ease-in-out infinite;
        }
        @keyframes particle1 {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
        }
        .animate-particle1 {
          animation: particle1 3.2s ease-in-out infinite;
        }
        @keyframes particle2 {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(20px) scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
        }
        .animate-particle2 {
          animation: particle2 2.7s ease-in-out infinite;
        }
        @keyframes particle3 {
          0% {
            transform: translateX(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateX(20px) scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 0.5;
          }
        }
        .animate-particle3 {
          animation: particle3 3.7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
