import * as vscode from "vscode";
import { ThreePreviewEditorProvider } from "./ThreePreviewEditorProvider";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(ThreePreviewEditorProvider.register(context));
}

export function deactivate() {}
