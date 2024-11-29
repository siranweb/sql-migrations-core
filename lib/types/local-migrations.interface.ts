import { Migration, MigrationDirection } from './shared';

export interface ILocalMigrations {
  /**
   * Creates migration files (up and down).
   * @param name Name of migration.
   */
  create(name: string): Promise<void>;

  /**
   * Get migration object.
   * @param name Name of migration.
   * @param direction Direction of migration (up, down).
   * @returns Migration object if exists.
   */
  getMigration(name: string, direction: MigrationDirection): Promise<Migration | null>;

  /**
   * Get next migration object.
   * @param name Name of migration.
   * @param direction Direction of migration (up, down).
   * @returns Migration object if exists.
   */
  getNextMigration(name: string, direction: MigrationDirection): Promise<Migration | null>;

  /**
   * Get migrations names.
   * @returns Names of migrations.
   */
  getMigrationNames(): Promise<string[]>;

  /**
   * Get migrations names in range with direction.
   * @param [from] Name of migration. If not provided - take first local migration.
   * @param [to] Name of migration. If not provided - take last local migration.
   * @returns Sequence of migrations names.
   * If direction is `down` - returns names in descending order.
   */
  getMigrationNamesSequence(
    from?: string | null,
    to?: string | null,
  ): Promise<MigrationNamesSequence>;
}

export type MigrationNamesSequence = {
  names: string[];
  direction: MigrationDirection;
};
