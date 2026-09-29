"use client";

import { useEffect, useRef } from "react";
import { notFound } from "next/navigation";
import { ProjectHelix, LOOP_SECONDS, REST_PHASE, type HelixState } from "@/components/sections/projects-helix";

/**
 * Dev only: the projects world's idle loop, for recording the opening video
 * of /projects (public/projects/world-loop.dat, an MP4 named so download managers ignore it). It draws the same stage as
 * ProjectsWorld (backdrop, canvas, vignette) in the state the page starts the
 * dive from, and exposes `window.__worldLoop(t)` to draw the frame `t`
 * seconds into the loop. The recorder steps t over 0..LOOP_SECONDS.
 */
declare global {
  interface Window {
    __worldLoop?: (t: number) => void;
    __worldLoopSeconds?: number;
  }
}

export default function WorldLoopPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    // Must match ProjectsWorld's starting state
    const state: HelixState = { dolly: 0, spin: -Math.PI * 1.5, cards: 0, offset: REST_PHASE };
    const helix = new ProjectHelix(canvas, [], state);
    helix.resize(stage.clientWidth, stage.clientHeight);
    window.__worldLoopSeconds = LOOP_SECONDS;
    window.__worldLoop = (t) => {
      helix.syncLoop(t);
      helix.render(0);
    };
    window.__worldLoop(0);
    return () => {
      delete window.__worldLoop;
      helix.dispose();
    };
  }, []);

  return (
    <div ref={stageRef} className="pw-stage" style={{ position: "fixed", inset: 0, height: "100vh", zIndex: 2147483647 }}>
      <div className="pw-backdrop" aria-hidden="true" />
      <canvas ref={canvasRef} className="pw-canvas" aria-hidden="true" />
      <div className="pw-vignette" aria-hidden="true" />
    </div>
  );
}
