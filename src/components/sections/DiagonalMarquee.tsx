"use client";

import React from "react";

interface DiagonalMarqueeProps {
  items: string[];
  angle?: number;
  direction?: "left" | "right";
  speed?: number; // seconds for full cycle
  className?: string;
  topOffset?: string;
}

export const DiagonalMarquee: React.FC<DiagonalMarqueeProps> = ({
  items,
  angle = 15,
  direction = "left",
  speed = 25,
  className = "",
  topOffset = "50%",
}) => {
  // Duplicate items to ensure seamless infinite looping marquee
  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <div
      className={`pointer-events-none absolute left-[-20%] w-[140vw] overflow-hidden select-none z-0 ${className}`}
      style={{
        top: topOffset,
        transform: `translateY(-50%) rotate(${angle}deg)`,
      }}
    >
      {/* Semi-transparent Emerald Green Ribbon Banner Container */}
      <div
        className="relative flex items-center border-y border-[#52B788]/40 bg-[#52B788]/10 py-3.5 backdrop-blur-md shadow-[0_0_35px_rgba(82,183,136,0.15)]"
      >
        {/* Infinite Scrolling Track */}
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: `marquee-${direction} ${speed}s linear infinite`,
          }}
        >
          {repeatedItems.map((text, idx) => (
            <div key={idx} className="flex items-center gap-6 px-4">
              <span className="font-extrabold tracking-widest text-[#F0EDE8] uppercase text-sm sm:text-base md:text-lg font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {text}
              </span>
              <span className="text-[#52B788] font-serif font-black text-sm sm:text-base md:text-lg drop-shadow-[0_0_8px_#52B788]">
                ◆
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
