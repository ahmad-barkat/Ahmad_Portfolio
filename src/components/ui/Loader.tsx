"use client";

import React from "react";
import "./Loader.css";

export interface LoaderProps {
  text?: string;
  mainSize?: string;
  fontSize?: string;
  textColor?: string;
  shineColor?: string;
  shadowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Loader({
  text = "AHMAD",
  mainSize = "4em",
  fontSize,
  textColor,
  shineColor,
  shadowColor,
  className = "",
  style,
}: LoaderProps) {
  const dynamicVars: React.CSSProperties = {
    ...(fontSize ? { fontSize } : {}),
    ...(mainSize ? { ["--main-size" as string]: mainSize } : {}),
    ...(textColor ? { ["--text-color" as string]: textColor } : {}),
    ...(shineColor ? { ["--shine-color" as string]: shineColor } : {}),
    ...(shadowColor ? { ["--shadow-color" as string]: shadowColor } : {}),
    ...style,
  };

  return (
    <div className={`loader-wrapper ${className}`.trim()} style={dynamicVars}>
      <div className="loader">
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="text"><span>{text}</span></div>
        <div className="line" />
      </div>
    </div>
  );
}
