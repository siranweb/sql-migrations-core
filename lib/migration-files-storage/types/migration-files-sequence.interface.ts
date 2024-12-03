import { Iterable } from '../../types/shared';
import { MigrationFile } from '../migration-file';

export interface IMigrationFilesSequence extends Iterable<MigrationFile> {
  /**
   * Sets cursor based on migrationName.
   * @param migrationName Name of migration.
   */
  to(migrationName: string): void;

  /**
   * Reset sequence to start position.
   */
  rewind(): void;

  /**
   * Returns current migration file.
   */
  get current(): MigrationFile | undefined;

  /**
   * Moves cursor to next migration file.
   */
  next(): IteratorResult<MigrationFile>;
}
