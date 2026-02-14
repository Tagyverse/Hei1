'use client';

import { useEffect, useState } from 'react';

interface MaterialLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function MaterialLoader({ isVisible, onComplete }: MaterialLoaderProps) {
  const [displayLoader, setDisplayLoader] = useState(isVisible);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setDisplayLoader(false);
        onComplete?.();
      }, 600);
      return () => clearTimeout(timer);
    }
    setDisplayLoader(true);
  }, [isVisible, onComplete]);

  if (!displayLoader) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Material Design Circular Progress */}
        <div className="relative w-16 h-16">
          <svg
            className="w-16 h-16 transform -rotate-90"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#E5F0F0"
              strokeWidth="3"
              opacity="0.3"
            />
            {/* Animated progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#circleGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="282.7"
              strokeDashoffset="70.675"
              className="animate-spin"
              style={{
                animation: 'materialSpin 1.4s cubic-bezier(0.35, 0.25, 0.46, 0.88) infinite'
              }}
            />
            <defs>
              <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 animate-pulse">
            Preparing your experience
          </p>
          <div className="flex gap-1 mt-3 justify-center">
            <div
              className="w-1 h-1 bg-teal-500 rounded-full"
              style={{
                animation: 'materialBounce 1.4s ease-in-out infinite',
                animationDelay: '0s'
              }}
            />
            <div
              className="w-1 h-1 bg-teal-400 rounded-full"
              style={{
                animation: 'materialBounce 1.4s ease-in-out infinite',
                animationDelay: '0.2s'
              }}
            />
            <div
              className="w-1 h-1 bg-teal-300 rounded-full"
              style={{
                animation: 'materialBounce 1.4s ease-in-out infinite',
                animationDelay: '0.4s'
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes materialSpin {
          0% {
            stroke-dashoffset: 282.7;
            transform: rotate(0deg);
          }
          50% {
            stroke-dashoffset: 70.675;
            transform: rotate(225deg);
          }
          100% {
            stroke-dashoffset: 282.7;
            transform: rotate(360deg);
          }
        }

        @keyframes materialBounce {
          0%, 100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
