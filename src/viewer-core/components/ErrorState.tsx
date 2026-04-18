import React from "react";
import type { ErrorStateProps } from "../types";

export function ErrorState({
  title = "Model load failed",
  message,
  onRetry,
  retryLabel = "Reload"
}: ErrorStateProps) {
  return (
    <div className="viewer-overlay viewer-overlay--interactive" role="alert">
      <section className="state-card state-card--error">
        <p className="state-eyebrow">Preview</p>
        <h1 className="state-title">{title}</h1>
        <p className="state-copy">
          hardgit could not bring this file into a renderable state.
        </p>
        <pre className="state-pre">{message}</pre>
        {onRetry ? (
          <p className="state-copy state-copy--actions">
            <button className="state-action" onClick={onRetry} type="button">
              {retryLabel}
            </button>
          </p>
        ) : null}
      </section>
    </div>
  );
}
