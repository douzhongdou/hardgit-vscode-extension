import type { ToWebviewMessage } from "../extension/messages";

export type WebviewDocumentState = {
  uri: string;
  extension: string;
  fileName: string;
  version: number;
};

export type IncomingWebviewMessage = ToWebviewMessage;

function shouldIgnoreDocumentMessage(
  current: WebviewDocumentState | null,
  nextUri: string,
  nextVersion: number
): boolean {
  return current !== null && current.uri === nextUri && nextVersion <= current.version;
}

export function reduceDocumentState(
  current: WebviewDocumentState | null,
  message: IncomingWebviewMessage
): WebviewDocumentState | null {
  switch (message.type) {
    case "open-document": {
      if (shouldIgnoreDocumentMessage(current, message.uri, message.version)) {
        return current;
      }

      return {
        uri: message.uri,
        extension: message.extension,
        fileName: message.fileName,
        version: message.version
      };
    }
    case "refresh-document":
      if (current === null) {
        return null;
      }

      if (shouldIgnoreDocumentMessage(current, message.uri, message.version)) {
        return current;
      }

      return {
        ...current,
        uri: message.uri,
        version: message.version
      };
  }
}
