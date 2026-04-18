import React, { useCallback, useEffect, useState } from "react";
import { ThreePreviewEditor } from "../viewer-core/ThreePreviewEditor";
import { reduceDocumentState, type IncomingWebviewMessage, type WebviewDocumentState } from "./types";
import { vscodeApi } from "./vscode";

function isIncomingWebviewMessage(value: unknown): value is IncomingWebviewMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  const { type } = value as { type?: unknown };
  return type === "open-document" || type === "refresh-document";
}

export function App() {
  const [documentState, setDocumentState] = useState<WebviewDocumentState | null>(null);
  const handleRefreshRequest = useCallback(() => {
    vscodeApi.postMessage({ type: "refresh-requested" });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      const message = event.data;

      if (!isIncomingWebviewMessage(message)) {
        return;
      }

      setDocumentState((current) => reduceDocumentState(current, message));
    };

    window.addEventListener("message", handleMessage);
    vscodeApi.postMessage({ type: "webview-ready" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <ThreePreviewEditor
      documentState={documentState}
      onRefreshRequest={handleRefreshRequest}
    />
  );
}
