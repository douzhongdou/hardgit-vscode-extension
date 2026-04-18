import React, { useEffect } from "react";
import type { Object3D } from "three";
import type { RenderMode, ViewerBackgroundMode } from "../types";
import {
  disposeViewerHelpers,
  syncObjectRenderState
} from "./renderModeHelpers";

type RenderModeControllerProps = {
  object: Object3D | null;
  renderMode: RenderMode;
  backgroundMode: ViewerBackgroundMode;
  selectedEntityId: string | null;
  syncToken: unknown;
};

export function RenderModeController({
  object,
  renderMode,
  backgroundMode,
  selectedEntityId,
  syncToken
}: RenderModeControllerProps) {
  useEffect(() => {
    if (object === null) {
      return;
    }

    syncObjectRenderState(object, {
      backgroundMode,
      renderMode,
      selectedEntityId
    });
  }, [backgroundMode, object, renderMode, selectedEntityId, syncToken]);

  useEffect(() => {
    if (object === null) {
      return;
    }

    return () => {
      disposeViewerHelpers(object);
    };
  }, [object]);

  return null;
}
