import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export default function Logo({ className = "w-10 h-10", showText = true, light = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${light ? 'text-white' : 'text-nexa-primary'}`}>
      <div className={`relative ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* The main stylized "n" / bridge shape */}
          <path 
            d="M25 30V80H40C40 80 42 55 60 55C78 55 80 80 80 80H95V45C95 30 80 25 65 35C55 42 50 42 40 35C35 30 25 30 25 30Z" 
            fill="currentColor"
          />
          {/* The signature yellow dot */}
          <circle cx="80" cy="20" r="12" fill="#FFCD11" />
        </svg>
      </div>
      {showText && (
        <span className={`text-2xl font-black tracking-tighter ${light ? 'text-white' : 'text-nexa-primary'}`}>
          nexa
        </span>
      )}
    </div>
  );
}
