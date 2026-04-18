import React from "react";
import {
  Box,
  Grid3x3,
  Layers,
  Sun,
  Maximize2,
  type LucideIcon
} from "lucide-react";
import type { RenderMode, ViewerBackgroundMode } from "../types";

type ToolbarProps = {
  hasModel: boolean;
  renderMode: RenderMode;
  backgroundMode: ViewerBackgroundMode;
  onRenderModeChange: (mode: RenderMode) => void;
  onToggleBackgroundMode: () => void;
  onFitView: () => void;
};

type ToolbarIconButtonProps = {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

function ToolbarIconButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onClick
}: ToolbarIconButtonProps) {
  return (
    <button
      className={`viewer-toolbar-button${active ? " viewer-toolbar-button--active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
      aria-label={label}
    >
      <Icon />
    </button>
  );
}

export function Toolbar({
  hasModel,
  renderMode,
  backgroundMode,
  onRenderModeChange,
  onToggleBackgroundMode,
  onFitView
}: ToolbarProps) {
  return (
    <div className="viewer-toolbar" role="toolbar" aria-label="Viewer tools">
      <div className="viewer-toolbar-group">
        <ToolbarIconButton
          active={renderMode === "solid"}
          disabled={!hasModel}
          icon={Box}
          label="Solid"
          onClick={() => onRenderModeChange("solid")}
        />
        <ToolbarIconButton
          active={renderMode === "wireframe"}
          disabled={!hasModel}
          icon={Grid3x3}
          label="Wireframe"
          onClick={() => onRenderModeChange("wireframe")}
        />
        <ToolbarIconButton
          active={renderMode === "edges"}
          disabled={!hasModel}
          icon={Layers}
          label="Edges"
          onClick={() => onRenderModeChange("edges")}
        />
      </div>

      <div className="viewer-toolbar-separator" />

      <div className="viewer-toolbar-group">
        <ToolbarIconButton
          active={backgroundMode === "light"}
          icon={Sun}
          label={backgroundMode === "dark" ? "Light background" : "Dark background"}
          onClick={onToggleBackgroundMode}
        />
      </div>

      <div className="viewer-toolbar-separator" />

      <div className="viewer-toolbar-group">
        <ToolbarIconButton
          disabled={!hasModel}
          icon={Maximize2}
          label="Fit view"
          onClick={onFitView}
        />
      </div>
    </div>
  );
}
