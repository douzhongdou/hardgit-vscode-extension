import {
  toSupportedModelExtension,
  type ModelAssetMap,
  type SupportedModelExtension
} from "../viewer-core/types.ts";
import type { WebviewDocumentState } from "../webview/types.ts";

export type BrowserFileSelection = {
  file: File;
  fileName: string;
  extension: SupportedModelExtension;
  assetKeys: string[];
};

export type BrowserFileSession = {
  documentState: WebviewDocumentState;
  assetMap: ModelAssetMap;
  objectUrls: string[];
};

function normalizeAssetKey(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function collectAssetKeys(file: File): string[] {
  const keys = new Set<string>();
  const trimmedName = file.name.trim();

  if (trimmedName.length > 0) {
    keys.add(trimmedName);
  }

  const relativePath =
    "webkitRelativePath" in file && typeof file.webkitRelativePath === "string"
      ? file.webkitRelativePath.trim()
      : "";

  if (relativePath.length > 0) {
    const normalizedRelativePath = normalizeAssetKey(relativePath);
    keys.add(normalizedRelativePath);
    const relativeName = normalizedRelativePath.split("/").pop();

    if (relativeName !== undefined && relativeName.length > 0) {
      keys.add(relativeName);
    }
  }

  return [...keys];
}

export function selectPrimaryModelFile(
  files: Iterable<File>
): BrowserFileSelection | null {
  for (const file of files) {
    const extension = toSupportedModelExtension(file.name.split(".").pop() ?? "");

    if (extension === null) {
      continue;
    }

    return {
      file,
      fileName: file.name,
      extension,
      assetKeys: collectAssetKeys(file)
    };
  }

  return null;
}

export function createBrowserFileSession(
  files: Iterable<File>,
  version: number
): BrowserFileSession | null {
  const fileList = [...files];
  const primarySelection = selectPrimaryModelFile(fileList);

  if (primarySelection === null) {
    return null;
  }

  const assetMapEntries = new Map<string, string>();
  const fileUrlMap = new Map<File, string>();
  const objectUrls: string[] = [];

  for (const file of fileList) {
    const objectUrl = URL.createObjectURL(file);
    objectUrls.push(objectUrl);
    fileUrlMap.set(file, objectUrl);

    for (const key of collectAssetKeys(file)) {
      assetMapEntries.set(normalizeAssetKey(key), objectUrl);
    }
  }

  const primaryUrl = fileUrlMap.get(primarySelection.file);

  if (primaryUrl === undefined) {
    throw new Error("Browser preview could not create a URL for the selected model file.");
  }

  return {
    documentState: {
      uri: primaryUrl,
      extension: primarySelection.extension,
      fileName: primarySelection.fileName,
      version
    },
    assetMap: Object.freeze(Object.fromEntries(assetMapEntries)),
    objectUrls
  };
}

export function revokeBrowserFileSession(
  session: BrowserFileSession | null
): void {
  if (session === null) {
    return;
  }

  for (const objectUrl of session.objectUrls) {
    URL.revokeObjectURL(objectUrl);
  }
}
