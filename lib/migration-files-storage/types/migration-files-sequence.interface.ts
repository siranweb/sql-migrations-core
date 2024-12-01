import { Iterable } from '../../types/shared';
import { MigrationFile } from '../migration-file';

export interface IMigrationFilesSequence extends Iterable<MigrationFile> {
  /**
   * Sets cursor based on migrationName.
   * @param migrationName Name of migration.
   */
  to(migrationName: string): void;

  rewind(): void;

  get current(): MigrationFile | undefined;

  next(): IteratorResult<MigrationFile>;
}
