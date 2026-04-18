import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Box,
  Folder,
  FolderOpen,
  type LucideIcon
} from "lucide-react";
import type { EntityTreeNode } from "../utils/entityTree";

type EntityTreeProps = {
  entities: EntityTreeNode[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string) => void;
  onToggleVisibility: (id: string) => void;
};

type EntityTreeItemProps = {
  expandedIds: Record<string, boolean>;
  level: number;
  node: EntityTreeNode;
  onSelectEntity: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  selectedEntityId: string | null;
};

// Map entity kind to icon
function getKindIcon(kind: EntityTreeNode["kind"], isExpanded: boolean): LucideIcon {
  switch (kind) {
    case "group":
      return isExpanded ? FolderOpen : Folder;
    case "mesh":
      return Box;
    case "object":
    default:
      return Box;
  }
}

function EntityTreeItem({
  expandedIds,
  level,
  node,
  onSelectEntity,
  onToggleExpanded,
  onToggleVisibility,
  selectedEntityId
}: EntityTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds[node.id] ?? level < 2;
  const isSelected = selectedEntityId === node.id;
  const KindIcon = getKindIcon(node.kind, isExpanded);

  return (
    <li className="entity-tree-item">
      <div
        className={`entity-tree-row${isSelected ? " entity-tree-row--selected" : ""}`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelectEntity(node.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectEntity(node.id);
          }
        }}
      >
        <button
          className="entity-tree-toggle"
          disabled={!hasChildren}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded(node.id);
          }}
          aria-label={hasChildren ? "Toggle branch" : "Leaf node"}
          type="button"
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </button>

        <span className={`entity-tree-icon entity-tree-icon--${node.kind}`}>
          <KindIcon size={16} />
        </span>

        <span className="entity-tree-name">{node.name}</span>

        <button
          className="entity-tree-visibility"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(node.id);
          }}
          aria-label={node.visible ? "Hide entity" : "Show entity"}
          type="button"
        >
          {node.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <ul className="entity-tree-children">
          {node.children.map((child) => (
            <EntityTreeItem
              expandedIds={expandedIds}
              key={child.id}
              level={level + 1}
              node={child}
              onSelectEntity={onSelectEntity}
              onToggleExpanded={onToggleExpanded}
              onToggleVisibility={onToggleVisibility}
              selectedEntityId={selectedEntityId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function EntityTree({
  entities,
  selectedEntityId,
  onSelectEntity,
  onToggleVisibility
}: EntityTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  return (
    <div className="entity-tree">
      {entities.length > 0 ? (
        <ul className="entity-tree-list">
          {entities.map((entity) => (
            <EntityTreeItem
              expandedIds={expandedIds}
              key={entity.id}
              level={0}
              node={entity}
              onSelectEntity={onSelectEntity}
              onToggleExpanded={(id) =>
                setExpandedIds((current) => ({
                  ...current,
                  [id]: !(current[id] ?? true)
                }))
              }
              onToggleVisibility={onToggleVisibility}
              selectedEntityId={selectedEntityId}
            />
          ))}
        </ul>
      ) : (
        <div className="entity-tree-empty">
          Load a model to inspect its hierarchy.
        </div>
      )}
    </div>
  );
}
