import * as vscode from "vscode";

function getNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  assetVersion: string
): string {
  const scriptUri = `${webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview", "index.js")
  ).toString()}?v=${encodeURIComponent(assetVersion)}`;
  const styleUri = `${webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview", "index.css")
  ).toString()}?v=${encodeURIComponent(assetVersion)}`;
  const webviewBaseUri = `${webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview")
  ).toString()}/`;
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${webview.cspSource} blob: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; connect-src ${webview.cspSource} blob: data:; font-src ${webview.cspSource};"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="${webviewBaseUri}" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>hardgit 3D Preview</title>
  </head>
  <body>
    <div id="root">Loading preview...</div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}
