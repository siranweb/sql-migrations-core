export interface IMigrationFile {
  /**
   * Return file content.
   */
  content(): Promise<string>;
}
