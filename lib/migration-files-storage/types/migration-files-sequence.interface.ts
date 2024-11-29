export interface IMigrationFilesSequence {
  /**
   * Sets cursor based on migrationName.
   * If migrationName not passed - resets start position.
   * @param migrationName Name of migration.
   */
  setCursor(migrationName?: string): void;
}
