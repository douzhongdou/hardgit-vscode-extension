import { create } from "zustand";
import type { Object3D } from "three";
import {
  buildEntityTree,
  findEntityTreeNode,
  setObjectVisibilityRecursive,
  updateEntityTreeVisibility,
  type EntityTreeNode
} from "../utils/entityTree.ts";

type EntityStoreState = {
  entities: EntityTreeNode[];
  selectedEntityId: string | null;
  setEntities: (entities: EntityTreeNode[]) => void;
  setEntitiesFromObject: (object: Object3D | null) => void;
  selectEntity: (id: string | null) => void;
  setEntityVisibility: (id: string, visible: boolean) => void;
  toggleEntityVisibility: (id: string) => void;
  clearEntities: () => void;
  reset: () => void;
};

function getDefaultState() {
  return {
    entities: [] as EntityTreeNode[],
    selectedEntityId: null
  };
}

export const useEntityStore = create<EntityStoreState>((set, get) => ({
  ...getDefaultState(),
  setEntities: (entities) => set({ entities }),
  setEntitiesFromObject: (object) =>
    set({
      entities: object === null ? [] : buildEntityTree(object),
      selectedEntityId: null
    }),
  selectEntity: (selectedEntityId) =>
    set((state) => ({
      selectedEntityId:
        state.selectedEntityId === selectedEntityId ? null : selectedEntityId
    })),
  setEntityVisibility: (id, visible) => {
    const entity = findEntityTreeNode(get().entities, id);

    if (entity === null) {
      return;
    }

    setObjectVisibilityRecursive(entity.object, visible);
    set((state) => ({
      entities: updateEntityTreeVisibility(state.entities, id, visible)
    }));
  },
  toggleEntityVisibility: (id) => {
    const entity = findEntityTreeNode(get().entities, id);

    if (entity === null) {
      return;
    }

    get().setEntityVisibility(id, !entity.visible);
  },
  clearEntities: () =>
    set({
      entities: [],
      selectedEntityId: null
    }),
  reset: () => set(getDefaultState())
}));
