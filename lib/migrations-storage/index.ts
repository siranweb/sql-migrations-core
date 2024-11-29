import {
  IMigrationsStorage,
  IMigrationsStorageAdapter,
} from './types/migrations-storage.interface';
import { ascSort } from '../utils/sorting';
import { MigrationDirection } from '../types/shared';
import { getNumPrefix } from '../utils/split';

export class MigrationsStorage implements IMigrationsStorage {
  constructor(private readonly adapter: IMigrationsStorageAdapter) {}

  public async initTable(): Promise<void> {
    await this.adapter.createMigrationsTable();
  }

  public async getMigrationsNames(): Promise<string[]> {
    const migrationNames = await this.adapter.getMigrationsNames();
    return migrationNames.sort((a, b) => ascSort(getNumPrefix(a), getNumPrefix(b)));
  }

  public async getLatestMigrationName(): Promise<string | null> {
    const migrationsNames = (await this.getMigrationsNames()).sort((a, b) =>
      ascSort(getNumPrefix(a), getNumPrefix(b)),
    );
    const lastMigrationName = migrationsNames[migrationsNames.length - 1];
    return lastMigrationName ?? null;
  }

  public async executeMigration(
    name: string,
    sql: string,
    direction: MigrationDirection,
  ): Promise<void> {
    if (direction === 'up') {
      await this.adapter.migrateUp(name, sql);
    } else {
      await this.adapter.migrateDown(name, sql);
    }
  }
}
