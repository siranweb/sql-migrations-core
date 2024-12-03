import { createFile, mkDirSafe, QUERY_CONTENT, rmDirSafe } from '../../helpers/fs.helpers';
import path from 'path';
import { MigrationFile, MigrationFileOptions, FileSourceWrongDirectionError } from '../../../lib';

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
    expect(content).toBe(QUERY_CONTENT);
  });

  test('static create(): Create instance', async () => {
    const filePath = await createFile(migrationsDir, 'example.up.sql');
    const migrationFile = MigrationFile.create(filePath, migrationFileOptions);
    const content = await migrationFile.content();

    expect(migrationFile.name).toBe('example');
    expect(migrationFile.source).toBe(filePath);
    expect(migrationFile.direction).toBe('up');
    expect(content).toBe(QUERY_CONTENT);
  });

  test('static create(): Failed with wrong postfix', async () => {
    const filePath = await createFile(migrationsDir, 'example.up.wrong.sql');

    expect(() => MigrationFile.create(filePath, migrationFileOptions)).toThrow(
      FileSourceWrongDirectionError,
    );
  });
});
