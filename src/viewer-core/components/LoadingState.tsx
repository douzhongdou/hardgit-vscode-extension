import React from "react";
import type { LoadingStateProps } from "../types";

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="viewer-overlay" role="status" aria-live="polite">
      <div className="state-card">
        <p className="state-eyebrow">Loading</p>
        <h2 className="state-title">Preparing 3D preview</h2>
        <p className="state-copy">{label}</p>
      </div>
    </div>
  );
}
