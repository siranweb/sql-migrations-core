import {
  IStoredMigrations,
  SqlActions,
  StoredMigrationsConfig,
} from './types/stored-migrations.interface';
import { Migration, MigrationDirection } from './types/shared';
import { ascSort } from '../utils/sorting';

export class StoredMigrations implements IStoredMigrations {
  private readonly sqlActions: SqlActions;

  constructor(config: StoredMigrationsConfig) {
    this.sqlActions = config.sqlActions;
  }

  public async getLastMigrationName(): Promise<string | null> {
    if (this.sqlActions.getLastName) {
      return this.sqlActions.getLastName();
    }

    const migrationsNames = await this.getMigrationsNames();
    const lastMigrationName = migrationsNames.at(-1);
    return lastMigrationName ?? null;
  }

  public async getMigrationsNames(): Promise<string[]> {
    const migrationNames = await this.sqlActions.getNames();
    return this.sortMigrationsNames(migrationNames);
  }

  public async initTable(): Promise<void> {
    await this.sqlActions.createTable();
  }

  public async migrate(migrations: Migration[], direction: MigrationDirection): Promise<void> {
    if (direction === 'up') {
      await this.sqlActions.migrateUp(migrations);
    } else {
      await this.sqlActions.migrateDown(migrations);
    }
  }

  private sortMigrationsNames(migrationsNames: string[]): string[] {
    return [...migrationsNames].sort(ascSort);
  }
}
