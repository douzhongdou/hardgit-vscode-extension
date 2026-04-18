import React, { useEffect, useId, useRef, useState } from "react";
import { ThreePreviewEditor } from "../viewer-core/ThreePreviewEditor";
import type { ModelAssetMap } from "../viewer-core/types";
import {
  createBrowserFileSession,
  revokeBrowserFileSession,
  type BrowserFileSession
} from "./fileSession";

type PickerState = {
  documentState: BrowserFileSession["documentState"] | null;
  assetMap: ModelAssetMap | null;
  currentFiles: File[] | null;
  errorMessage: string | null;
};

const EMPTY_BROWSER_LABEL =
  "Choose or drop a glb, gltf, step, or stp file to start previewing.";

function supportsFiles(dataTransfer: DataTransfer | null): boolean {
  return Array.from(dataTransfer?.types ?? []).includes("Files");
}

export function App() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionRef = useRef<BrowserFileSession | null>(null);
  const versionRef = useRef(0);
  const [pickerState, setPickerState] = useState<PickerState>({
    documentState: null,
    assetMap: null,
    currentFiles: null,
    errorMessage: null
  });
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const replaceSession = (
    nextSession: BrowserFileSession | null,
    files: File[] | null
  ) => {
    revokeBrowserFileSession(sessionRef.current);
    sessionRef.current = nextSession;

    if (nextSession === null) {
      setPickerState({
        documentState: null,
        assetMap: null,
        currentFiles: files,
        errorMessage:
          "No supported model file was found. Choose or drop a glb, gltf, step, or stp file."
      });
      return;
    }

    setPickerState({
      documentState: nextSession.documentState,
      assetMap: nextSession.assetMap,
      currentFiles: files,
      errorMessage: null
    });
  };

  const loadFiles = (fileList: Iterable<File>) => {
    const files = [...fileList];

    if (files.length === 0) {
      return;
    }

    versionRef.current += 1;
    replaceSession(createBrowserFileSession(files, versionRef.current), files);
  };

  const refreshCurrentSelection = () => {
    if (pickerState.currentFiles === null || pickerState.currentFiles.length === 0) {
      openPicker();
      return;
    }

    versionRef.current += 1;
    replaceSession(
      createBrowserFileSession(pickerState.currentFiles, versionRef.current),
      pickerState.currentFiles
    );
  };

  useEffect(() => {
    const handleWindowDragEnter = (event: DragEvent) => {
      if (!supportsFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      setIsDraggingFiles(true);
    };

    const handleWindowDragOver = (event: DragEvent) => {
      if (!supportsFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer!.dropEffect = "copy";
      setIsDraggingFiles(true);
    };

    const handleWindowDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) {
        setIsDraggingFiles(false);
      }
    };

    const handleWindowDrop = (event: DragEvent) => {
      if (!supportsFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      setIsDraggingFiles(false);
      loadFiles(event.dataTransfer!.files);
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  useEffect(() => {
    return () => {
      revokeBrowserFileSession(sessionRef.current);
    };
  }, []);

  return (
    <>
      <input
        accept=".glb,.gltf,.step,.stp"
        className="browser-file-input"
        id={inputId}
        multiple
        onChange={(event) => {
          loadFiles(event.target.files ?? []);
          event.currentTarget.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <div className="browser-toolbar">
        <button className="browser-toolbar-button" onClick={openPicker} type="button">
          Open files
        </button>
        <label className="browser-toolbar-hint" htmlFor={inputId}>
          Drop a model pack here or choose files from disk.
        </label>
      </div>
      <ThreePreviewEditor
        assetMap={pickerState.assetMap}
        documentState={pickerState.documentState}
        idleLabel={pickerState.errorMessage ?? EMPTY_BROWSER_LABEL}
        onRefreshRequest={refreshCurrentSelection}
      />
      {isDraggingFiles ? (
        <div className="browser-drop-overlay" role="presentation">
          <section className="state-card browser-drop-card">
            <p className="state-eyebrow">Browser Preview</p>
            <h2 className="state-title">Drop files to preview</h2>
            <p className="state-copy">
              For glTF scenes with external assets, drop the `.gltf` file together with its
              `.bin` and texture files.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
