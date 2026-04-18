import { basename, dirname, extname } from "node:path";
import * as vscode from "vscode";
import { getWebviewHtml } from "./getWebviewHtml";
import type { FromWebviewMessage, ToWebviewMessage } from "./messages";

type ThreePreviewDocument = vscode.CustomDocument & {
  readonly uri: vscode.Uri;
};

export class ThreePreviewEditorProvider
  implements vscode.CustomReadonlyEditorProvider<ThreePreviewDocument>
{
  public static readonly viewType = "hardgit.3dPreview";

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ThreePreviewEditorProvider(context);

    return vscode.window.registerCustomEditorProvider(
      ThreePreviewEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    );
  }

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public openCustomDocument(
    uri: vscode.Uri,
    _openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken
  ): ThreePreviewDocument {
    return {
      uri,
      dispose() {}
    };
  }

  public resolveCustomEditor(
    document: ThreePreviewDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): void {
    const documentDirectory = dirname(document.uri.fsPath);
    const documentRoot = vscode.Uri.file(documentDirectory);
    const extension = extname(document.uri.fsPath).replace(/^\./, "");
    const fileName = basename(document.uri.fsPath);
    const assetVersion = `${this.context.extension.packageJSON.version}-${Date.now()}`;
    let documentVersion = 1;
    let hasPostedOpenDocument = false;
    let isDisposed = false;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri, documentRoot]
    };
    panel.webview.html = getWebviewHtml(
      panel.webview,
      this.context.extensionUri,
      assetVersion
    );
    panel.title = fileName;

    const getWebviewDocumentUri = () =>
      panel.webview.asWebviewUri(document.uri).toString();

    const postOpenDocument = (): Thenable<boolean> => {
      hasPostedOpenDocument = true;

      const message: ToWebviewMessage = {
        type: "open-document",
        uri: getWebviewDocumentUri(),
        extension,
        fileName,
        version: documentVersion
      };

      return panel.webview.postMessage(message);
    };

    const postRefreshDocument = (): Thenable<boolean> => {
      if (isDisposed || !hasPostedOpenDocument) {
        return Promise.resolve(false);
      }

      documentVersion += 1;

      const message: ToWebviewMessage = {
        type: "refresh-document",
        uri: getWebviewDocumentUri(),
        version: documentVersion
      };

      return panel.webview.postMessage(message);
    };

    const scheduleRefreshDocument = () => {
      if (isDisposed || !hasPostedOpenDocument || refreshTimeout !== undefined) {
        return;
      }

      refreshTimeout = setTimeout(() => {
        refreshTimeout = undefined;
        void postRefreshDocument();
      }, 50);
    };

    const fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(documentDirectory, fileName)
    );
    const matchesDocument = (candidate: vscode.Uri) =>
      candidate.toString() === document.uri.toString();
    const watchChangeDisposable = fileWatcher.onDidChange((changedUri) => {
      if (matchesDocument(changedUri)) {
        scheduleRefreshDocument();
      }
    });
    const watchCreateDisposable = fileWatcher.onDidCreate((createdUri) => {
      if (matchesDocument(createdUri)) {
        scheduleRefreshDocument();
      }
    });
    const watchDeleteDisposable = fileWatcher.onDidDelete((deletedUri) => {
      if (matchesDocument(deletedUri)) {
        scheduleRefreshDocument();
      }
    });

    const receiveMessageDisposable = panel.webview.onDidReceiveMessage(
      (message: FromWebviewMessage) => {
        switch (message.type) {
          case "webview-ready":
            if (!hasPostedOpenDocument) {
              void postOpenDocument();
            }
            break;
          case "refresh-requested":
            scheduleRefreshDocument();
            break;
          case "show-error":
            void vscode.window.showErrorMessage(message.message);
            break;
        }
      }
    );

    panel.onDidDispose(() => {
      isDisposed = true;
      if (refreshTimeout !== undefined) {
        clearTimeout(refreshTimeout);
      }
      watchDeleteDisposable.dispose();
      watchCreateDisposable.dispose();
      watchChangeDisposable.dispose();
      fileWatcher.dispose();
      receiveMessageDisposable.dispose();
    });
  }
}
