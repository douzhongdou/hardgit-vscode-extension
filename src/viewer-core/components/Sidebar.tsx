import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EntityTree } from "./EntityTree";
import type { EntityTreeNode } from "../utils/entityTree";
import type { ModelLoadResult } from "../types";

type SidebarProps = {
  entities: EntityTreeNode[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onCollapse: () => void;
  fileName?: string | null;
  modelInfo?: ModelLoadResult | null;
  collapsed?: boolean;
};

function countEntities(nodes: EntityTreeNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countEntities(node.children), 0);
}

export function Sidebar({
  entities,
  selectedEntityId,
  onSelectEntity,
  onToggleVisibility,
  onCollapse,
  fileName = null,
  modelInfo = null,
  collapsed = false
}: SidebarProps) {
  const entityCount = countEntities(entities);

  if (collapsed) {
    return (
      <div className="viewer-sidebar-collapsed">
        <button
          className="viewer-sidebar-toggle"
          onClick={onCollapse}
          type="button"
          title="Expand hierarchy"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <aside className="viewer-sidebar">
      

      <div className="viewer-sidebar-header">
        <div className="viewer-sidebar-titleWrap">
          {fileName !== null ? (
        <div className="viewer-sidebar-summary">
          <span className="viewer-filename" title={fileName}>
            {fileName}
          </span>
          {modelInfo ? (
            <span className="viewer-stats">
              {modelInfo.vertices?.toLocaleString()} verts /{" "}
              {modelInfo.faces?.toLocaleString()} faces
            </span>
          ) : null}
          <div>
        <div className="viewer-sidebar-title">entity <span className="viewer-sidebar-count">{entityCount}</span></div>
          
      </div>
        </div>
      ) : null}
      
          
        </div>
        <button
          className="viewer-sidebar-collapse"
          onClick={onCollapse}
          type="button"
          title="Collapse hierarchy"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="viewer-sidebar-content">
        <EntityTree
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={onSelectEntity}
          onToggleVisibility={onToggleVisibility}
        />
      </div>
    </aside>
  );
}
