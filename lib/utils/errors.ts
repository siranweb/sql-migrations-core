export function isENOENT(err: unknown): boolean {
  return !!(err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT');
}
