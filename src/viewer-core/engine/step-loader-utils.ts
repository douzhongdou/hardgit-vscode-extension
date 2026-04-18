export function resolveStepAssetUrl(assetPath: string, baseUri: string): string {
  return new URL(assetPath, baseUri).toString();
}

export function loadCachedModule<T>(
  cache: Map<string, Promise<T>>,
  key: string,
  load: () => Promise<T>
): Promise<T> {
  const cachedValue = cache.get(key);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const pendingValue = load().catch((error) => {
    cache.delete(key);
    throw error;
  });

  cache.set(key, pendingValue);
  return pendingValue;
}

function isArrayLikeNumberCollection(
  value: ArrayLike<number> | Iterable<number>
): value is ArrayLike<number> {
  return typeof value === "object" && value !== null && "length" in value;
}

export function createStepIndexArray(
  indexValues: ArrayLike<number> | Iterable<number>
): Uint32Array {
  if (!isArrayLikeNumberCollection(indexValues)) {
    return Uint32Array.from(indexValues as Iterable<number>);
  }

  const materializedValues = Array.from(
    { length: indexValues.length },
    (_, index) => indexValues[index] ?? 0
  );

  return Uint32Array.from(materializedValues);
}
