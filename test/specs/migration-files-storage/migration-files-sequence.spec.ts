import { createFile, mkDirSafe, rmDirSafe } from '../../helpers/fs.helpers';
import path from 'path';
import { MigrationFile } from '../../../lib/migration-files-storage/migration-file';
import {
  MigrationFilesSequence,
  MigrationFilesSequenceOptions,
} from '../../../lib/migration-files-storage/migration-files-sequence';
import { MigrationFileNotFoundError } from '../../../lib/errors/migration-file-not-found.error';

describe('MigrationFilesSequence', () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFileOptions: MigrationFilesSequenceOptions = {
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
    const filePath1 = await createFile(migrationsDir, '1-example.up.sql');
    // await createFile(migrationsDir, '1-example.down.sql');
    const filePath2 = await createFile(migrationsDir, '2-example.up.sql');
    // await createFile(migrationsDir, '2-example.down.sql');
    const migrationFiles: MigrationFile[] = [
      new MigrationFile(filePath1, '1-example', 'up'),
      new MigrationFile(filePath2, '2-example', 'up'),
    ];
    const sequence = new MigrationFilesSequence(migrationFiles);
    expect(sequence).toBeInstanceOf(MigrationFilesSequence);
  });

  test('static from(): Create instance', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    await createFile(migrationsDir, '1-example.down.sql');
    await createFile(migrationsDir, '2-example.up.sql');
    await createFile(migrationsDir, '2-example.down.sql');

    const sequence = await MigrationFilesSequence.from(migrationsDir, 'up', migrationFileOptions);
    expect(sequence).toBeInstanceOf(MigrationFilesSequence);
  });

  test('Should iterate up migrations', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    await createFile(migrationsDir, '1-example.down.sql');
    await createFile(migrationsDir, '2-example.up.sql');
    await createFile(migrationsDir, '2-example.down.sql');
    await createFile(migrationsDir, '123-example.up.sql');
    await createFile(migrationsDir, '123-example.down.sql');

    const sequence = await MigrationFilesSequence.from(migrationsDir, 'up', migrationFileOptions);

    expect(sequence.current()).toBe(null);
    sequence.next();

    expect(sequence.current()).not.toBe(null);
    expect(sequence.current()!.name).toBe('1-example');
    sequence.next();

    expect(sequence.current()).not.toBe(null);
    expect(sequence.current()!.name).toBe('2-example');
    sequence.next();

    expect(sequence.current()).not.toBe(null);
    expect(sequence.current()!.name).toBe('123-example');
    sequence.next();

    expect(sequence.current()).toBe(null);
  });

  test('Should iterate down migrations', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    await createFile(migrationsDir, '1-example.down.sql');
    await createFile(migrationsDir, '2-example.up.sql');
    await createFile(migrationsDir, '2-example.down.sql');
    await createFile(migrationsDir, '123-example.up.sql');
    await createFile(migrationsDir, '123-example.down.sql');

    const sequence = await MigrationFilesSequence.from(migrationsDir, 'down', migrationFileOptions);

    expect(sequence.current()).toBe(null);
    sequence.next();

    expect(sequence.current()).not.toBe(null);
    expect(sequence.current()!.name).toBe('123-example');
    sequence.next();

    expect(sequence.current()).not.toBe(null);
    expect(sequence.current()!.name).toBe('2-example');
    sequence.next();

    expect(sequence.current()).not.toBe(null);
    expect(sequence.current()!.name).toBe('1-example');

    sequence.next();
    expect(sequence.current()).toBe(null);
  });

  test('setCursor(): Should change current file', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    await createFile(migrationsDir, '1-example.down.sql');
    await createFile(migrationsDir, '2-example.up.sql');
    await createFile(migrationsDir, '2-example.down.sql');
    await createFile(migrationsDir, '3-example.up.sql');
    await createFile(migrationsDir, '3-example.down.sql');

    const sequence = await MigrationFilesSequence.from(migrationsDir, 'up', migrationFileOptions);
    sequence.setCursor('3-example');

    expect(sequence.current()).not.toBe(null);
    expect(sequence.current()!.name).toBe('3-example');
  });

  test('setCursor(): Should reset cursor if migrationName not provided', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    await createFile(migrationsDir, '1-example.down.sql');
    await createFile(migrationsDir, '2-example.up.sql');
    await createFile(migrationsDir, '2-example.down.sql');
    await createFile(migrationsDir, '3-example.up.sql');
    await createFile(migrationsDir, '3-example.down.sql');

    const sequence = await MigrationFilesSequence.from(migrationsDir, 'up', migrationFileOptions);
    sequence.setCursor();

    expect(sequence.current()).toBe(null);
  });

  test('setCursor(): Should throw error if migrationName not found', async () => {
    await createFile(migrationsDir, '1-example.up.sql');
    await createFile(migrationsDir, '1-example.down.sql');
    await createFile(migrationsDir, '2-example.up.sql');
    await createFile(migrationsDir, '2-example.down.sql');
    await createFile(migrationsDir, '3-example.up.sql');
    await createFile(migrationsDir, '3-example.down.sql');

    const sequence = await MigrationFilesSequence.from(migrationsDir, 'up', migrationFileOptions);

    let err;
    try {
      sequence.setCursor('unknown');
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(MigrationFileNotFoundError);
  });
});
