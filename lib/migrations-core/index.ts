import { MigrationFilesStorage } from '../migration-files-storage';
import { MigrationsStorage } from '../migrations-storage';
import { IMigrationsCore, MigrationsCoreConfig } from './types/migrations-core.interface';
import { MigrationDirection, MigrationResult } from '../types/shared';
import { MigrationFile } from '../migration-files-storage/migration-file';

export class MigrationsCore implements IMigrationsCore {
  static create(config: MigrationsCoreConfig): MigrationsCore {
    const migrationFilesStorage = new MigrationFilesStorage({
      postfix: config.postfix ?? {
        up: '.up.sql',
        down: '.down.sql',
      },
      dirPath: config.dirPath,
    });

    const migrationsStorage = new MigrationsStorage(config.adapter);

    return new MigrationsCore(migrationFilesStorage, migrationsStorage);
  }

  constructor(
    private readonly migrationFilesStorage: MigrationFilesStorage,
    private readonly migrationsStorage: MigrationsStorage,
  ) {}

  public async createEmptyMigrations(title: string): Promise<string> {
    const timestamp = Date.now();

    const migrationName = this.buildMigrationName(title, timestamp);
    await this.migrationFilesStorage.createEmptyMigrations(migrationName);

    return migrationName;
  }

  public async up(): Promise<MigrationResult | null> {
    return await this.migrateOne('up');
  }

  public async down(): Promise<MigrationResult | null> {
    return await this.migrateOne('down');
  }

  public async sync(): Promise<MigrationResult[]> {
    return await this.migrateAll('up');
  }

  private async migrateOne(direction: MigrationDirection): Promise<MigrationResult | null> {
    await this.migrationsStorage.initTable();

    const latestMigrationName = await this.migrationsStorage.getLatestMigrationName();

    const sequence = await this.migrationFilesStorage.getSequence(direction);
    sequence.setCursor(latestMigrationName ?? undefined);

    if (direction === 'up') {
      sequence.next();
    }

    const migrationFile = sequence.current();
    if (!migrationFile) return null;

    await this.migrationsStorage.executeMigration(
      migrationFile.name,
      await migrationFile.content(),
      direction,
    );

    return {
      name: migrationFile.name,
      direction,
    };
  }

  private async migrateAll(direction: MigrationDirection): Promise<MigrationResult[]> {
    await this.migrationsStorage.initTable();

    const latestMigrationName = await this.migrationsStorage.getLatestMigrationName();

    if (direction === 'down' && !latestMigrationName) {
      return [];
    }

    const sequence = await this.migrationFilesStorage.getSequence(direction);
    sequence.setCursor(latestMigrationName ?? undefined);

    if (direction === 'up') {
      sequence.next();
    }

    const migrationFiles: MigrationFile[] = [];

    while (true) {
      const migrationFile = sequence.current();
      if (!migrationFile) {
        break;
      }
      migrationFiles.push(migrationFile);
      await this.migrationsStorage.executeMigration(
        migrationFile.name,
        await migrationFile.content(),
        direction,
      );
    }

    return migrationFiles.map((migrationFile) => ({
      name: migrationFile.name,
      direction,
    }));
  }

  private buildMigrationName(title: string, timestamp: number): string {
    return `${timestamp.toString()}-${title}`;
  }
}
