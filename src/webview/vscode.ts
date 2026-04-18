type VsCodeApi = {
  postMessage(message: unknown): void;
};

declare global {
  function acquireVsCodeApi(): VsCodeApi;
}

const fallbackApi: VsCodeApi = {
  postMessage() {}
};

export const vscodeApi: VsCodeApi =
  typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : fallbackApi;
