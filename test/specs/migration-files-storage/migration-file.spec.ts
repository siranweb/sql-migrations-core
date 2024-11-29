import { createFile, mkDirSafe, rmDirSafe } from '../../helpers/fs.helpers';
import path from 'path';
import {
  MigrationFile,
  MigrationFileOptions,
} from '../../../lib/migration-files-storage/migration-file';
import { FileSourceWrongDirectionError } from '../../../lib/errors/file-source-wrong-direction.error';

describe('MigrationFile', () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFileOptions: MigrationFileOptions = {
    postfix: {
      up: '.up.sql',
      down: '.down.sql',
    },
  };

  beforeEach(async () => {
    await mkDirSafe(migrationsDir);
  });

  afterEach(async () => {
    await rmDirSafe(migrationsDir);
  });

  test('constructor(): Create instance', async () => {
    const filePath = await createFile(migrationsDir, 'example.up.sql');
    const migrationFile = new MigrationFile(filePath, 'example', 'up');
    const content = await migrationFile.content();

    expect(migrationFile.name).toBe('example');
    expect(migrationFile.source).toBe(filePath);
    expect(migrationFile.direction).toBe('up');
    expect(content).toBe('QUERY CONTENT');
  });

  test('static create(): Create instance', async () => {
    const filePath = await createFile(migrationsDir, 'example.up.sql');
    const migrationFile = MigrationFile.create(filePath, migrationFileOptions);
    const content = await migrationFile.content();

    expect(migrationFile.name).toBe('example');
    expect(migrationFile.source).toBe(filePath);
    expect(migrationFile.direction).toBe('up');
    expect(content).toBe('QUERY CONTENT');
  });

  test('static create(): Failed with wrong postfix', async () => {
    const filePath = await createFile(migrationsDir, 'example.up.wrong.sql');

    let err;
    try {
      MigrationFile.create(filePath, migrationFileOptions);
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(FileSourceWrongDirectionError);
  });
});
