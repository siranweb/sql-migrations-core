import path from 'path';
import { checkIsExists, createFile, mkDirSafe, rmDirSafe } from '../../helpers/fs.helpers';
import {
  MigrationFilesStorage,
  MigrationFilesStorageConfig,
  Postfix,
  MigrationFilesSequence,
  MigrationFileNotFoundError,
} from '../../../lib';

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

  it('createEmptyMigrationFiles(): should create empty migration files', async () => {
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

  it('getMigrationFile(): should return migration file', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    const migrationFilesStorage = new MigrationFilesStorage(config);

    const migrationFile = await migrationFilesStorage.getMigrationFile('1-example', 'up');
    expect(migrationFile.direction).toBe('up');
    expect(migrationFile.name).toBe('1-example');
    expect(migrationFile.source).toBe(path.join(migrationsDir, '1-example.up.sql'));
  });

  it('getMigrationFile(): should fail if not such source', async () => {
    const migrationFilesStorage = new MigrationFilesStorage(config);

    await expect(migrationFilesStorage.getMigrationFile('1-unknown', 'up')).rejects.toThrow(
      MigrationFileNotFoundError,
    );
  });

  it('getMigrationsNames(): should return asc-sorted array of migrations names', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    await createFile(migrationsDir, '1-example.down.sql');
    await createFile(migrationsDir, '2-example.up.sql');
    await createFile(migrationsDir, '2-example.down.sql');
    await createFile(migrationsDir, '123-example.up.sql');
    await createFile(migrationsDir, '123-example.down.sql');
    const migrationFilesStorage = new MigrationFilesStorage(config);

    const migrationsNames = await migrationFilesStorage.getMigrationsNames();
    expect(migrationsNames.length).toBe(3);
    expect(migrationsNames[0]).toBe('1-example');
    expect(migrationsNames[1]).toBe('2-example');
    expect(migrationsNames[2]).toBe('123-example');
  });
});
