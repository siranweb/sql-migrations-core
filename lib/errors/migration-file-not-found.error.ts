export class MigrationFileNotFoundError extends Error {
  constructor(public readonly migrationName: string) {
    super(`Migration file ${migrationName} not found.`);
  }
}
