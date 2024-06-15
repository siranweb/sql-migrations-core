export function normalizeError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

export function isENOENT(err: unknown): boolean {
  const error = normalizeError(err);
  return 'code' in error && error.code === 'ENOENT';
}
