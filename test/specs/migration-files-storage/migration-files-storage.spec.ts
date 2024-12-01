import path from 'path';
import { checkIsExists, mkDirSafe, rmDirSafe } from '../../helpers/fs.helpers';
import {
  MigrationFilesStorage,
  MigrationFilesStorageConfig,
} from '../../../lib/migration-files-storage';
import { Postfix } from '../../../lib/types/shared';
import { MigrationFilesSequence } from '../../../lib/migration-files-storage/migration-files-sequence';

describe('MigrationFilesStorage', () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const postfix: Postfix = {
    up: '.up.sql',
    down: '.down.sql',
  };
  const config: MigrationFilesStorageConfig = { dirPath: migrationsDir, postfix };

  beforeEach(async () => {
    await mkDirSafe(migrationsDir);
  });

  afterEach(async () => {
    await rmDirSafe(migrationsDir);
  });

  it('createEmptyMigrations(): should create empty migration files', async () => {
    const migrationFilesStorage = new MigrationFilesStorage(config);
    await migrationFilesStorage.createEmptyMigrationFiles('example');
    expect(checkIsExists(path.join(migrationsDir, 'example.up.sql'))).toBe(true);
    expect(checkIsExists(path.join(migrationsDir, 'example.down.sql'))).toBe(true);
  });

  it('getSequence(): should return up sequence', async () => {
    const migrationFilesStorage = new MigrationFilesStorage(config);
    const sequence = await migrationFilesStorage.getSequence('up');
    expect(sequence).toBeInstanceOf(MigrationFilesSequence);
  });

  it('getSequence(): should return down sequence', async () => {
    const migrationFilesStorage = new MigrationFilesStorage(config);
    const sequence = await migrationFilesStorage.getSequence('down');
    expect(sequence).toBeInstanceOf(MigrationFilesSequence);
  });
});
