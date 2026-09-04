"use client";
import React from "react";

interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#081C15", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", zIndex: 999999 }}>
          <div style={{ fontFamily: "monospace", color: "#52B788", fontSize: "clamp(1.2rem,3vw,2rem)", marginBottom: "1rem" }}>MAB — Render Error</div>
          <div style={{ fontFamily: "monospace", color: "#40916C", fontSize: "clamp(0.7rem,1.5vw,0.9rem)", maxWidth: "600px", textAlign: "center", wordBreak: "break-all" }}>
            {this.state.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
