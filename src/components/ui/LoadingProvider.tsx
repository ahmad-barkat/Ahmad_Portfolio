"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

/**
 * Simplified provider:
 * 1. LoadingScreen (MAB + counter) plays immediately
 * 2. After it completes → show children (the actual page)
 * 
 * The laptop scene, tunnel, and arrival live in the page itself.
 */
export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);

  const handleDone = useCallback(() => {
    setDone(true);
  }, []);

  return (
    <>
      {!done && <LoadingScreen onComplete={handleDone} />}
      <div style={{ visibility: done ? "visible" : "hidden", pointerEvents: done ? "auto" : "none" }}>
        {children}
      </div>
    </>
  );
}
