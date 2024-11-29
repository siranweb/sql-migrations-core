import { MigrationDirection } from '../../types/shared';
import { MigrationFilesSequence } from '../migration-files-sequence';

export interface IMigrationFilesStorage {
  /**
   * Creates empty migration files.
   * @param name Migration name.
   */
  createEmptyMigrations(name: string): Promise<void>;

  /**
   * Returns sequence of migrations by direction.
   * If direction is 'up' - takes all up migrations and makes ASC sorting.
   * If direction is 'down' - takes all down migrations and makes DESC sorting.
   * @param direction Migration direction.
   */
  getSequence(direction: MigrationDirection): Promise<MigrationFilesSequence>;
}
