declare module "occt-import-js" {
  export type OcctColor = [number, number, number];

  export type OcctMeshAttribute = {
    array: ArrayLike<number>;
  };

  export type OcctBrepFace = {
    first: number;
    last: number;
    color: OcctColor | null;
  };

  export type OcctResultMesh = {
    name?: string;
    color?: OcctColor;
    attributes: {
      position: OcctMeshAttribute;
      normal?: OcctMeshAttribute;
    };
    index: OcctMeshAttribute;
    brep_faces?: OcctBrepFace[];
  };

  export type OcctReadResult = {
    success?: boolean;
    meshes: OcctResultMesh[];
  };

  export type OcctImportModule = {
    ReadStepFile(fileBuffer: Uint8Array, params: null): OcctReadResult;
    ReadIgesFile(fileBuffer: Uint8Array, params: null): OcctReadResult;
  };

  export type OcctImportFactoryOptions = {
    locateFile?: (path: string, scriptDirectory: string) => string;
  };

  export default function occtimportjs(
    options?: OcctImportFactoryOptions
  ): Promise<OcctImportModule>;
}

declare module "*.wasm" {
  const assetUrl: string;
  export default assetUrl;
}
