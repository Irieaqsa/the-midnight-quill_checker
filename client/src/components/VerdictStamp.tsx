import React from 'react';

interface VerdictStampProps {
  verdict: string;
  combinedScore: number;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictStamp: React.FC<VerdictStampProps> = ({ verdict, combinedScore, size = 'md' }) => {
  let title = 'LIKELY HUMAN';
  let borderColor = 'border-moss text-moss';
  let badgeBg = 'bg-moss/10';

  if (verdict === 'LIKELY_AI') {
    title = 'LIKELY AI';
    borderColor = 'border-red-700 text-red-700';
    badgeBg = 'bg-red-50';
  } else if (verdict === 'MIXED') {
    title = 'UNCERTAIN / MIXED';
    borderColor = 'border-amber text-amber';
    badgeBg = 'bg-amber-50';
  }

  const dimClasses = {
    sm: 'w-24 h-24 text-[10px] border-2',
    md: 'w-36 h-36 text-xs border-[3px]',
    lg: 'w-48 h-48 text-sm border-4',
  }[size];

  return (
    <div
      className={`relative rounded-full flex flex-col items-center justify-center p-3 font-serif uppercase tracking-widest text-center shadow-inner ${borderColor} ${badgeBg} ${dimClasses} transform -rotate-3 transition duration-300 hover:rotate-0 select-none`}
    >
      <div className="absolute inset-1 rounded-full border border-dashed border-current opacity-40"></div>
      <span className="text-[10px] tracking-normal opacity-70">CONFIDENCE</span>
      <span className="font-bold text-lg sm:text-2xl tracking-tighter leading-none my-1 font-sans">
        {combinedScore}%
      </span>
      <span className="font-bold tracking-tight text-[11px] leading-tight max-w-[85%]">{title}</span>
    </div>
  );
};
