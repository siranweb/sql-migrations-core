import { ILocalMigrations } from '../../../lib/migrations-core/types/local-migrations.interface';
import { LocalMigrations } from '../../../lib/migrations-core/local-migrations';
import fsp from 'fs/promises';
import * as path from 'path';
import { mkDirSafe, rmDirSafe } from '../../helpers/fs.helpers';
import {
  migrationFileInfo1,
  migrationFileInfo2,
  migrationFileInfo3,
  migrationFileInfo4, migrationFileInfo5, migrationFileInfo6, migrationNames,
  migrationsInfos,
} from '../../stubs/migrations';

describe('Local migrations', () => {

  const upPostfix = '.up.sql';
  const downPostfix = '.down.sql';
  const migrationsDir = path.join(__dirname, 'migrations');
  let localMigrations: ILocalMigrations;

  beforeEach(async () => {
    await mkDirSafe(migrationsDir);

    localMigrations = new LocalMigrations({
      dirPath: migrationsDir,
      postfix: {
        up: upPostfix,
        down: downPostfix,
      }
    });
  })

  afterEach(async () => {
    await rmDirSafe(migrationsDir);
  })

  describe('Migration files creation', () => {
    test('create(): Should create migration files', async () => {
      await localMigrations.create('example');
      const dirContent = await fsp.readdir(migrationsDir);

      expect(dirContent).toStrictEqual(['example.down.sql', 'example.up.sql']);
    });
  });

  describe('Migrations files selection', () => {
    beforeEach(async () => {
      await Promise.all(migrationsInfos.map(async migrationInfo => {
        const filepath = path.join(migrationsDir, migrationInfo.filename);
        await fsp.writeFile(filepath, migrationInfo.content);
      }))
    })

    test('getMigration(): get existing up migration', async () => {
      const migration = await localMigrations.getMigration(migrationFileInfo2.name, 'up');
      expect(migration?.name).toBe(migrationFileInfo2.name);
      expect(migration?.sql).toBe(migrationFileInfo2.content);
    });

    test('getMigration(): get existing down migration', async () => {
      const migration = await localMigrations.getMigration(migrationFileInfo1.name, 'down');
      expect(migration?.name).toBe(migrationFileInfo1.name);
      expect(migration?.sql).toBe(migrationFileInfo1.content);
    });

    test('getMigration(): get null on not existing migration', async () => {
      const migration = await localMigrations.getMigration('not-exists', 'down');
      expect(migration).toBe(null);
    });

    test('getNextMigration(): get next existing up migration', async () => {
      const migration = await localMigrations.getNextMigration(migrationFileInfo2.name, 'up');
      expect(migration?.name).toBe(migrationFileInfo4.name);
      expect(migration?.sql).toBe(migrationFileInfo4.content);
    });

    test('getNextMigration(): get next existing down migration', async () => {
      const migration = await localMigrations.getNextMigration(migrationFileInfo2.name, 'down');
      expect(migration?.name).toBe(migrationFileInfo3.name);
      expect(migration?.sql).toBe(migrationFileInfo3.content);
    });

    test('getNextMigration(): get null on not existing next migration', async () => {
      const migration = await localMigrations.getNextMigration(migrationFileInfo6.name, 'up');
      expect(migration).toBe(null);
    });

    test('getNextMigration(): get null on not existing current migration', async () => {
      const migration = await localMigrations.getNextMigration('not-exists', 'up');
      expect(migration).toBe(null);
    });
  })

  describe('Migrations names selection', () => {
    beforeEach(async () => {
      await Promise.all(migrationsInfos.map(async migrationInfo => {
        const filepath = path.join(migrationsDir, migrationInfo.filename);
        await fsp.writeFile(filepath, migrationInfo.content);
      }))
    })

    test('getMigrationNames(): get ascending-sorted array of all migration names', async () => {
      const names = await localMigrations.getMigrationNames();
      expect(names).toStrictEqual(migrationNames);
    });

    test('getMigrationNamesSequence(): get ascending-sorted array of all up migration names', async () => {
      const sequence = await localMigrations.getMigrationNamesSequence(migrationFileInfo1.name, migrationFileInfo5.name);

      expect(sequence.direction).toBe('up');
      expect(sequence.names).toStrictEqual(migrationNames);
    });

    test('getMigrationNamesSequence(): get descending-sorted array of all down migration names', async () => {
      const sequence = await localMigrations.getMigrationNamesSequence(migrationFileInfo5.name, migrationFileInfo1.name);

      expect(sequence.direction).toBe('down');
      expect(sequence.names).toStrictEqual([...migrationNames].reverse());
    });

    test('getMigrationNamesSequence(): get ascending-sorted array of selected up migration names', async () => {
      const sequence = await localMigrations.getMigrationNamesSequence(migrationFileInfo3.name, migrationFileInfo5.name);

      expect(sequence.direction).toBe('up');
      expect(sequence.names).toStrictEqual([migrationFileInfo3.name, migrationFileInfo5.name]);
    });

    test('getMigrationNamesSequence(): get descending-sorted array of selected down migration names', async () => {
      const sequence = await localMigrations.getMigrationNamesSequence(migrationFileInfo5.name, migrationFileInfo3.name);

      expect(sequence.direction).toBe('down');
      expect(sequence.names).toStrictEqual([migrationFileInfo5.name, migrationFileInfo3.name]);
    });

    test('getMigrationNamesSequence(): get ascending-sorted array of all up migration names when "to" omitted', async () => {
      const sequence = await localMigrations.getMigrationNamesSequence(migrationFileInfo1.name);

      expect(sequence.direction).toBe('up');
      expect(sequence.names).toStrictEqual(migrationNames);
    });

    test('getMigrationNamesSequence(): get ascending-sorted array of all up migration names when "from" omitted', async () => {
      const sequence = await localMigrations.getMigrationNamesSequence(undefined, migrationFileInfo5.name);

      expect(sequence.direction).toBe('up');
      expect(sequence.names).toStrictEqual(migrationNames);
    });

    test('getMigrationNamesSequence(): get ascending-sorted array of all up migration names when "from" and "to" omitted', async () => {
      const sequence = await localMigrations.getMigrationNamesSequence();

      expect(sequence.direction).toBe('up');
      expect(sequence.names).toStrictEqual(migrationNames);
    });
  })
});