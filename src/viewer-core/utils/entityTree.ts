import { Group, Mesh, Object3D } from "three";

export const VIEWER_EDGE_HELPER_FLAG = "__viewerEdgeHelper";

export type EntityTreeNodeKind = "group" | "mesh" | "object";

export type EntityTreeNode = {
  id: string;
  name: string;
  kind: EntityTreeNodeKind;
  object: Object3D;
  visible: boolean;
  children: EntityTreeNode[];
};

function inferNodeKind(object: Object3D): EntityTreeNodeKind {
  if (object instanceof Mesh) {
    return "mesh";
  }

  if (object instanceof Group || object.children.length > 0) {
    return "group";
  }

  return "object";
}

function getNodeName(object: Object3D, kind: EntityTreeNodeKind): string {
  if (object.name.trim().length > 0) {
    return object.name;
  }

  return `${kind}-${object.uuid.slice(0, 8)}`;
}

function isViewerHelper(object: Object3D): boolean {
  return object.userData[VIEWER_EDGE_HELPER_FLAG] === true;
}

function toEntityTreeNode(object: Object3D): EntityTreeNode {
  const kind = inferNodeKind(object);

  return {
    id: object.uuid,
    name: getNodeName(object, kind),
    kind,
    object,
    visible: object.visible,
    children: object.children
      .filter((child) => !isViewerHelper(child))
      .map((child) => toEntityTreeNode(child))
  };
}

export function buildEntityTree(root: Object3D): EntityTreeNode[] {
  const visibleChildren = root.children.filter((child) => !isViewerHelper(child));

  if (visibleChildren.length > 0) {
    return visibleChildren.map((child) => toEntityTreeNode(child));
  }

  if (isViewerHelper(root)) {
    return [];
  }

  return [toEntityTreeNode(root)];
}

export function setObjectVisibilityRecursive(
  object: Object3D,
  visible: boolean
): void {
  object.visible = visible;

  for (const child of object.children) {
    if (isViewerHelper(child)) {
      child.visible = visible;
      continue;
    }

    setObjectVisibilityRecursive(child, visible);
  }
}

function cloneNodeWithVisibility(
  node: EntityTreeNode,
  visible: boolean
): EntityTreeNode {
  return {
    ...node,
    visible,
    children: node.children.map((child) => cloneNodeWithVisibility(child, visible))
  };
}

export function updateEntityTreeVisibility(
  nodes: EntityTreeNode[],
  id: string,
  visible: boolean
): EntityTreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return cloneNodeWithVisibility(node, visible);
    }

    if (node.children.length === 0) {
      return node;
    }

    return {
      ...node,
      children: updateEntityTreeVisibility(node.children, id, visible)
    };
  });
}

export function findEntityTreeNode(
  nodes: EntityTreeNode[],
  id: string
): EntityTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const nested = findEntityTreeNode(node.children, id);
    if (nested !== null) {
      return nested;
    }
  }

  return null;
}
