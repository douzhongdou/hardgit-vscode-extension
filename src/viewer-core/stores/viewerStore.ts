import { create } from "zustand";
import type { RenderMode, SceneBounds, ViewerBackgroundMode } from "../types";

type ViewerStoreState = {
  hasModel: boolean;
  renderMode: RenderMode;
  backgroundMode: ViewerBackgroundMode;
  showEntityTree: boolean;
  showToolbar: boolean;
  fitViewToken: number;
  sceneBounds: SceneBounds | null;
  setHasModel: (hasModel: boolean) => void;
  setRenderMode: (mode: RenderMode) => void;
  cycleRenderMode: () => void;
  toggleBackgroundMode: () => void;
  toggleEntityTree: () => void;
  toggleToolbar: () => void;
  requestFitView: () => void;
  setSceneBounds: (bounds: SceneBounds | null) => void;
  resetSceneState: () => void;
  reset: () => void;
};

const DEFAULT_RENDER_MODE: RenderMode = "solid";
const DEFAULT_BACKGROUND_MODE: ViewerBackgroundMode = "dark";

function getDefaultState() {
  return {
    hasModel: false,
    renderMode: DEFAULT_RENDER_MODE,
    backgroundMode: DEFAULT_BACKGROUND_MODE,
    showEntityTree: true,
    showToolbar: true,
    fitViewToken: 0,
    sceneBounds: null
  };
}

export const useViewerStore = create<ViewerStoreState>((set, get) => ({
  ...getDefaultState(),
  setHasModel: (hasModel) => set({ hasModel }),
  setRenderMode: (renderMode) => set({ renderMode }),
  cycleRenderMode: () => {
    const order: RenderMode[] = ["solid", "wireframe", "edges"];
    const currentIndex = order.indexOf(get().renderMode);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % order.length : 0;

    set({ renderMode: order[nextIndex] });
  },
  toggleBackgroundMode: () =>
    set((state) => ({
      backgroundMode: state.backgroundMode === "dark" ? "light" : "dark"
    })),
  toggleEntityTree: () =>
    set((state) => ({
      showEntityTree: !state.showEntityTree
    })),
  toggleToolbar: () =>
    set((state) => ({
      showToolbar: !state.showToolbar
    })),
  requestFitView: () =>
    set((state) => ({
      fitViewToken: state.fitViewToken + 1
    })),
  setSceneBounds: (sceneBounds) => set({ sceneBounds }),
  resetSceneState: () =>
    set((state) => ({
      hasModel: false,
      fitViewToken: 0,
      sceneBounds: null,
      renderMode: state.renderMode
    })),
  reset: () => set(getDefaultState())
}));
