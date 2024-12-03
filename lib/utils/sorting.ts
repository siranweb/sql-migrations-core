export function ascSort(a: string | number, b: string | number): number {
  return a < b ? -1 : 1;
}

export function descSort(a: string | number, b: string | number): number {
  return a < b ? 1 : -1;
}
