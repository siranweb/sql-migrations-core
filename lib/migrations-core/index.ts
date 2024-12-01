import { MigrationFilesStorage } from '../migration-files-storage';
import { MigrationsStorage } from '../migrations-storage';
import {
  IMigrationsCore,
  MigrateOptions,
  MigrationsCoreConfig,
} from './types/migrations-core.interface';
import { MigrationDirection, MigrationStep } from '../types/shared';
import { MigrationFile } from '../migration-files-storage/migration-file';
import { IMigrationFilesStorage } from '../migration-files-storage/types/migration-files-storage.interface';
import { IMigrationsStorage } from '../migrations-storage/types/migrations-storage.interface';

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
    public readonly migrationFilesStorage: IMigrationFilesStorage,
    public readonly migrationsStorage: IMigrationsStorage,
  ) {}

  public async init(): Promise<void> {
    await this.migrationsStorage.initTable();
  }

  public async createEmptyMigrationFiles(title: string): Promise<string> {
    const timestamp = Date.now();

    const migrationName = this.buildMigrationName(title, timestamp);
    await this.migrationFilesStorage.createEmptyMigrationFiles(migrationName);

    return migrationName;
  }

  public async up(options: MigrateOptions = {}): Promise<MigrationStep | null> {
    const step = await this.getOneStep('up');
    if (!step) {
      return null;
    }

    await this.run([step], options);
    return step;
  }

  public async down(options: MigrateOptions = {}): Promise<MigrationStep | null> {
    const step = await this.getOneStep('down');
    if (!step) {
      return null;
    }

    await this.run([step], options);
    return step;
  }

  public async upToLatest(options: MigrateOptions = {}): Promise<MigrationStep[]> {
    const steps = await this.getSteps('up');
    await this.run(steps, options);
    return steps;
  }

  public async drop(options: MigrateOptions = {}): Promise<MigrationStep[]> {
    const steps = await this.getSteps('down');
    await this.run(steps, options);
    return steps;
  }

  public async sync(options: MigrateOptions = {}): Promise<MigrationStep[]> {
    const syncSteps = await this.getSyncSteps();
    await this.run(syncSteps, options);
    return syncSteps;
  }

  public async run(migrationsSteps: MigrationStep[], options: MigrateOptions = {}): Promise<void> {
    const migrationFiles = await Promise.all(
      migrationsSteps.map((step) =>
        this.migrationFilesStorage.getMigrationFile(step.name, step.direction),
      ),
    );

    for (const migrationFile of migrationFiles) {
      if (!options.dry) {
        await this.executeMigrationFile(migrationFile);
      }
    }
  }

  private async getSyncSteps(): Promise<MigrationStep[]> {
    const migrationsNames = await this.migrationsStorage.getMigrationsNames();
    const localMigrationsNames = await this.migrationFilesStorage.getMigrationsNames();
    const total = Math.max(migrationsNames.length, localMigrationsNames.length);

    const downMigrationNames: string[] = [];
    const upMigrationNames: string[] = [];
    let isDifferent = false;
    for (let i = 0; i < total; i++) {
      const localMigrationName = localMigrationsNames[i];
      const migrationName = migrationsNames[i];

      if (localMigrationName !== migrationName) {
        isDifferent = true;
      }

      if (localMigrationName === migrationName) {
        if (isDifferent) {
          downMigrationNames.unshift(migrationName);
          upMigrationNames.push(localMigrationName);
        }
      } else if (!localMigrationName) {
        downMigrationNames.unshift(migrationName);
      } else if (!migrationName) {
        upMigrationNames.push(localMigrationName);
      } else {
        downMigrationNames.unshift(migrationName);
        upMigrationNames.push(localMigrationName);
      }
    }

    const downMigrationSteps: MigrationStep[] = downMigrationNames.map((name) => ({
      name,
      direction: 'down',
    }));
    const upMigrationSteps: MigrationStep[] = upMigrationNames.map((name) => ({
      name,
      direction: 'up',
    }));
    return downMigrationSteps.concat(upMigrationSteps);
  }

  private async getOneStep(direction: MigrationDirection): Promise<MigrationStep | null> {
    const sequence = await this.migrationFilesStorage.getSequence(direction);

    const latestMigrationName = await this.migrationsStorage.getLatestMigrationName();
    if (latestMigrationName) {
      sequence.to(latestMigrationName);
    }

    if (direction === 'up') {
      sequence.next();
    }

    if (!sequence.current) {
      return null;
    }

    return {
      name: sequence.current.name,
      direction,
    };
  }

  private async getSteps(direction: MigrationDirection): Promise<MigrationStep[]> {
    const sequence = await this.migrationFilesStorage.getSequence(direction);

    const latestMigrationName = await this.migrationsStorage.getLatestMigrationName();

    // If no migrations to down - skip
    if (direction === 'down' && !latestMigrationName) {
      return [];
    }

    if (latestMigrationName) {
      sequence.to(latestMigrationName);
    }

    if (direction === 'up') {
      sequence.next();
    }

    return Array.from(sequence);
  }

  private async executeMigrationFile(migrationFile: MigrationFile): Promise<void> {
    await this.migrationsStorage.executeMigration(
      migrationFile.name,
      await migrationFile.content(),
      migrationFile.direction,
    );
  }

  private buildMigrationName(title: string, timestamp: number): string {
    return `${timestamp.toString()}-${title}`;
  }
}
