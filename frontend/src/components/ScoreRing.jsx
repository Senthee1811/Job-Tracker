import React from 'react';

/**
 * Circular SVG score ring (0-100) with dynamic stroke color based on match strength.
 */
const ScoreRing = ({ score = 0, size = 56, strokeWidth = 5 }) => {
  const cleanScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanScore / 100) * circumference;

  let colorClass = 'stroke-rose-500 text-rose-600';
  let bgClass = 'bg-rose-50 border-rose-200';
  if (cleanScore >= 80) {
    colorClass = 'stroke-[#84cc16] text-lime-600';
    bgClass = 'bg-lime-50 border-lime-200';
  } else if (cleanScore >= 60) {
    colorClass = 'stroke-emerald-500 text-emerald-600';
    bgClass = 'bg-emerald-50 border-emerald-200';
  } else if (cleanScore >= 40) {
    colorClass = 'stroke-amber-500 text-amber-600';
    bgClass = 'bg-amber-50 border-amber-200';
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl border ${bgClass} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105`}
      style={{ width: size + 8, height: size + 8 }}
      aria-label={`Match score: ${cleanScore}%`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated score stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-xs font-black tracking-tight ${colorClass.split(' ')[1]}`}>
          {cleanScore}
        </span>
        <span className="text-[8px] font-extrabold uppercase text-neutral-400 -mt-0.5">
          Match
        </span>
      </div>
    </div>
  );
};

export default ScoreRing;
