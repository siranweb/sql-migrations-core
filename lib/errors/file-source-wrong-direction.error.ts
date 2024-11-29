export class FileSourceWrongDirectionError extends Error {
  constructor(public readonly source: string) {
    super(`Direction is not recognized for source ${source}.`);
  }
}
