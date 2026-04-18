export type ToWebviewMessage =
  | {
      type: "open-document";
      uri: string;
      extension: string;
      fileName: string;
      version: number;
    }
  | {
      type: "refresh-document";
      uri: string;
      version: number;
    };

export type FromWebviewMessage =
  | { type: "webview-ready" }
  | { type: "refresh-requested" }
  | { type: "show-error"; message: string };
