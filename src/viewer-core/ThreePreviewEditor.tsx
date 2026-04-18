import React, {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { Canvas } from "@react-three/fiber";
import type { WebviewDocumentState } from "../webview/types";
import { ErrorState } from "./components/ErrorState";
import { LoadingState } from "./components/LoadingState";
import { RightSidebar } from "./components/RightSidebar";
import { Sidebar } from "./components/Sidebar";
import {
  OrthoTrackball,
  type OrthoTrackballHandle
} from "./control/OrthoTrackball";
import { RenderModeController } from "./control/RenderModeController";
import { ModelLoaderR3F } from "./engine/ModelLoaderR3F";
import { SceneSetup } from "./engine/SceneSetup";
import { useEntityStore } from "./stores/entityStore";
import { useViewerStore } from "./stores/viewerStore";
import {
  createVersionedModelUrl,
  toSupportedModelExtension,
  type ModelAssetMap,
  type ModelLoadResult
} from "./types";

type ThreePreviewEditorProps = {
  documentState: WebviewDocumentState | null;
  onRefreshRequest: () => void;
  assetMap?: ModelAssetMap | null;
  idleLabel?: string;
};

type ModelErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: Error) => void;
  resetKey: string;
};

type ModelErrorBoundaryState = {
  error: Error | null;
};

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  public state: ModelErrorBoundaryState = {
    error: null
  };

  public static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  public override componentDidUpdate(
    previousProps: ModelErrorBoundaryProps
  ): void {
    if (
      previousProps.resetKey !== this.props.resetKey &&
      this.state.error !== null
    ) {
      this.setState({ error: null });
    }
  }

  public override render(): ReactNode {
    if (this.state.error !== null) {
      return null;
    }

    return this.props.children;
  }
}

export function ThreePreviewEditor({
  documentState,
  onRefreshRequest,
  assetMap,
  idleLabel = "Waiting for hardgit to hand off the document..."
}: ThreePreviewEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelLoadResult | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(true);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const cameraControlsRef = useRef<OrthoTrackballHandle | null>(null);

  const renderMode = useViewerStore((state) => state.renderMode);
  const backgroundMode = useViewerStore((state) => state.backgroundMode);
  const showEntityTree = useViewerStore((state) => state.showEntityTree);
  const showToolbar = useViewerStore((state) => state.showToolbar);
  const fitViewToken = useViewerStore((state) => state.fitViewToken);
  const sceneBounds = useViewerStore((state) => state.sceneBounds);
  const hasModel = useViewerStore((state) => state.hasModel);
  const setHasModel = useViewerStore((state) => state.setHasModel);
  const setRenderMode = useViewerStore((state) => state.setRenderMode);
  const toggleBackgroundMode = useViewerStore((state) => state.toggleBackgroundMode);
  const toggleEntityTree = useViewerStore((state) => state.toggleEntityTree);
  const requestFitView = useViewerStore((state) => state.requestFitView);
  const setSceneBounds = useViewerStore((state) => state.setSceneBounds);
  const resetSceneState = useViewerStore((state) => state.resetSceneState);

  const entities = useEntityStore((state) => state.entities);
  const selectedEntityId = useEntityStore((state) => state.selectedEntityId);
  const selectEntity = useEntityStore((state) => state.selectEntity);
  const setEntitiesFromObject = useEntityStore((state) => state.setEntitiesFromObject);
  const toggleEntityVisibility = useEntityStore((state) => state.toggleEntityVisibility);
  const clearEntities = useEntityStore((state) => state.clearEntities);

  const handleModelError = useCallback(
    (nextError: Error) => {
      setError(nextError.message);
      setIsModelReady(false);
      setHasModel(false);
      setSceneBounds(null);
      clearEntities();
    },
    [clearEntities, setHasModel, setSceneBounds]
  );

  const handleModelLoad = useCallback(
    (result: ModelLoadResult) => {
      setModelInfo(result);
      setError(null);
      setIsModelReady(true);
      setHasModel(true);
      setSceneBounds({
        center: [result.center.x, result.center.y, result.center.z],
        size: [result.size.x, result.size.y, result.size.z]
      });
      setEntitiesFromObject(result.model);
    },
    [setEntitiesFromObject, setHasModel, setSceneBounds]
  );

  useEffect(() => {
    setError(null);
    setIsModelReady(false);
    setModelInfo(null);
    resetSceneState();
    clearEntities();
  }, [clearEntities, documentState?.uri, documentState?.version, resetSceneState]);

  useEffect(() => {
    if (!isModelReady || sceneBounds === null) {
      return;
    }

    cameraControlsRef.current?.fitView(sceneBounds);
  }, [isModelReady, sceneBounds]);

  useEffect(() => {
    if (!isModelReady || sceneBounds === null || fitViewToken === 0) {
      return;
    }

    cameraControlsRef.current?.fitView(sceneBounds);
  }, [fitViewToken, isModelReady, sceneBounds]);
  const extension =
    documentState === null
      ? null
      : toSupportedModelExtension(documentState.extension);
  const modelUrl =
    documentState !== null && extension !== null
      ? createVersionedModelUrl(documentState.uri, documentState.version)
      : null;
  const resetKey =
    documentState !== null && extension !== null
      ? `${documentState.uri}:${documentState.version}:${extension}`
      : "viewer-shell";

  let overlay: ReactNode = null;

  if (documentState === null) {
    overlay = <LoadingState label={idleLabel} />;
  } else if (extension === null) {
    overlay = (
      <ErrorState
        title="Unsupported model format"
        message={`hardgit supports glb, gltf, step, and stp files. Received: ${documentState.extension}.`}
      />
    );
  } else if (error !== null) {
    overlay = <ErrorState message={error} onRetry={onRefreshRequest} />;
  } else if (!isModelReady) {
    overlay = <LoadingState label={`Loading ${documentState.fileName}...`} />;
  }

  return (
    <main className="viewer-root">
      {showEntityTree ? (
        <Sidebar
          entities={entities}
          fileName={documentState?.fileName ?? null}
          modelInfo={modelInfo}
          selectedEntityId={selectedEntityId}
          onSelectEntity={selectEntity}
          onToggleVisibility={toggleEntityVisibility}
          collapsed={leftCollapsed}
          onCollapse={() => setLeftCollapsed(!leftCollapsed)}
        />
      ) : (
        <button
          aria-label="Show hierarchy"
          className="viewer-sidebar-peek"
          onClick={toggleEntityTree}
          title="Show hierarchy"
          type="button"
        >
          Open hierarchy
        </button>
      )}

      {showToolbar && (
        <RightSidebar
          hasModel={hasModel}
          renderMode={renderMode}
          backgroundMode={backgroundMode}
          onRenderModeChange={setRenderMode}
          onToggleBackgroundMode={toggleBackgroundMode}
          onFitView={requestFitView}
          collapsed={rightCollapsed}
          onCollapse={() => setRightCollapsed(!rightCollapsed)}
        />
      )}

      <div
        className={`viewer-stage${backgroundMode === "light" ? " viewer-stage--light" : ""}`}
      >
        {modelUrl !== null && extension !== null ? (
          <Canvas dpr={[1, 2]} shadows>
            <SceneSetup
              backgroundMode={backgroundMode}
              sceneBounds={sceneBounds}
            />
            <OrthoTrackball ref={cameraControlsRef} />
            <RenderModeController
              object={modelInfo?.model ?? null}
              backgroundMode={backgroundMode}
              renderMode={renderMode}
              selectedEntityId={selectedEntityId}
              syncToken={entities}
            />
            <ModelErrorBoundary
              onError={handleModelError}
              resetKey={resetKey}
            >
              <Suspense fallback={null}>
                <ModelLoaderR3F
                  assetMap={assetMap}
                  extension={extension}
                  onError={handleModelError}
                  onLoad={handleModelLoad}
                  url={modelUrl}
                />
              </Suspense>
            </ModelErrorBoundary>
          </Canvas>
        ) : null}
        {overlay}
      </div>
    </main>
  );
}
