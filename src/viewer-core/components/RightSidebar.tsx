import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Toolbar } from "./Toolbar";
import type { RenderMode, ViewerBackgroundMode } from "../types";

type RightSidebarProps = {
  hasModel: boolean;
  renderMode: RenderMode;
  backgroundMode: ViewerBackgroundMode;
  onRenderModeChange: (mode: RenderMode) => void;
  onToggleBackgroundMode: () => void;
  onFitView: () => void;
  onCollapse: () => void;
  collapsed?: boolean;
};

export function RightSidebar({
  hasModel,
  renderMode,
  backgroundMode,
  onRenderModeChange,
  onToggleBackgroundMode,
  onFitView,
  onCollapse,
  collapsed = false
}: RightSidebarProps) {
  if (collapsed) {
    return (
      <div className="viewer-right-sidebar-collapsed">
        <button
          className="viewer-sidebar-toggle"
          onClick={onCollapse}
          type="button"
          title="Expand tools"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    );
  }

  return (
    <aside className="viewer-right-sidebar">
      <div className="viewer-right-sidebar-header">
        <button
          className="viewer-right-sidebar-collapse"
          onClick={onCollapse}
          type="button"
          title="Collapse tools"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="viewer-right-sidebar-content">
        <Toolbar
          backgroundMode={backgroundMode}
          hasModel={hasModel}
          onFitView={onFitView}
          onRenderModeChange={onRenderModeChange}
          onToggleBackgroundMode={onToggleBackgroundMode}
          renderMode={renderMode}
        />
      </div>
    </aside>
  );
}
