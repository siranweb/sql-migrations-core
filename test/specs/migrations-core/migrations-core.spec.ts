import {
  IMigrationFilesStorage,
  IMigrationsStorage,
  MigrationDirection,
  MigrationFile,
  MigrationFilesSequence,
  MigrationsCore,
  MigrationStep,
} from '../../../lib';
import { createFile, mkDirSafe, QUERY_CONTENT, rmDirSafe } from '../../helpers/fs.helpers';
import path from 'path';

describe('MigrationsCore', () => {
  const fakeDate = new Date(2024);
  const migrationsDir = path.join(__dirname, 'migrations');
  const source = path.join(migrationsDir, 'example');

  const migrationFilesStorage: IMigrationFilesStorage = {
    async createEmptyMigrationFiles(): Promise<void> {},
    async getMigrationFile(
      migrationName: string,
      direction: MigrationDirection,
    ): Promise<MigrationFile> {
      return new MigrationFile(source, migrationName, direction);
    },
    async getMigrationsNames(): Promise<string[]> {
      return [];
    },
    async getSequence(): Promise<MigrationFilesSequence> {
      throw new Error('Not implemented');
    },
  };

  const migrationsStorage: IMigrationsStorage = {
    async executeMigration(): Promise<void> {},
    async getLatestMigrationName(): Promise<string | null> {
      return null;
    },
    async getMigrationsNames(): Promise<string[]> {
      return [];
    },
    async initTable(): Promise<void> {},
  };

  const migrationsCore = new MigrationsCore(migrationFilesStorage, migrationsStorage);

  const createEmptyMigrationFilesSpy = jest.spyOn(
    migrationFilesStorage,
    'createEmptyMigrationFiles',
  );
  const getSequenceSpy = jest.spyOn(migrationFilesStorage, 'getSequence');
  const getLocalMigrationsNamesSpy = jest.spyOn(migrationFilesStorage, 'getMigrationsNames');

  const initTableSpy = jest.spyOn(migrationsStorage, 'initTable');
  const executeMigrationSpy = jest.spyOn(migrationsStorage, 'executeMigration');
  const getLatestMigrationNameSpy = jest.spyOn(migrationsStorage, 'getLatestMigrationName');
  const getMigrationsNamesSpy = jest.spyOn(migrationsStorage, 'getMigrationsNames');

  beforeEach(async () => {
    await mkDirSafe(migrationsDir);
    // source for migration files
    await createFile(migrationsDir, 'example');
    jest.useFakeTimers({
      now: fakeDate,
    });
  });

  afterEach(async () => {
    await rmDirSafe(migrationsDir);
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('init(): should be executed without errors', async () => {
    await expect(migrationsCore.init()).resolves.not.toThrow();
    expect(initTableSpy).toHaveBeenCalled();
  });

  it('createEmptyMigrationFiles(): should create empty migration files with correct names', async () => {
    const migrationName = `${+fakeDate}-example`;
    await expect(migrationsCore.createEmptyMigrationFiles('example')).resolves.not.toThrow();
    expect(createEmptyMigrationFilesSpy).toHaveBeenCalledWith(migrationName);
  });

  it('run(): should execute migrations steps', async () => {
    const steps: MigrationStep[] = [
      {
        name: '1-example',
        direction: 'down',
      },
      {
        name: '2-example',
        direction: 'up',
      },
    ];
    await migrationsCore.run(steps);

    expect(executeMigrationSpy).toHaveBeenCalledTimes(2);
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(1, '1-example', QUERY_CONTENT, 'down');
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(2, '2-example', QUERY_CONTENT, 'up');
  });

  it('run(): should not execute migrations steps if array is empty', async () => {
    const steps: MigrationStep[] = [];
    await migrationsCore.run(steps);

    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('run(): should not execute migrations steps if dry', async () => {
    const steps: MigrationStep[] = [
      {
        name: '1-example',
        direction: 'down',
      },
      {
        name: '2-example',
        direction: 'up',
      },
    ];
    await migrationsCore.run(steps, { dry: true });

    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('up(): should execute one migration up if no migrations were executed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue(null);
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '1', 'up'),
        new MigrationFile(source, '2', 'up'),
      ]),
    );
    const step = await migrationsCore.up();

    expect(step).toStrictEqual<MigrationStep>({
      name: '1',
      direction: 'up',
    });
    expect(executeMigrationSpy).toHaveBeenCalledTimes(1);
    expect(executeMigrationSpy).toHaveBeenCalledWith('1', QUERY_CONTENT, 'up');
  });

  it('up(): should execute one migration up if some migrations were executed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('1');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '1', 'up'),
        new MigrationFile(source, '2', 'up'),
      ]),
    );
    const step = await migrationsCore.up();

    expect(step).toStrictEqual<MigrationStep>({
      name: '2',
      direction: 'up',
    });
    expect(executeMigrationSpy).toHaveBeenCalledTimes(1);
    expect(executeMigrationSpy).toHaveBeenCalledWith('2', QUERY_CONTENT, 'up');
  });

  it('up(): should not execute migration up if there are no migrations left', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('2');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '1', 'up'),
        new MigrationFile(source, '2', 'up'),
      ]),
    );
    const step = await migrationsCore.up();

    expect(step).toStrictEqual(null);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('up(): should not execute migration up if dry flag passed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('1');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '1', 'up'),
        new MigrationFile(source, '2', 'up'),
      ]),
    );
    const step = await migrationsCore.up({ dry: true });

    expect(step).toStrictEqual<MigrationStep>({
      name: '2',
      direction: 'up',
    });
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('down(): should execute one migration down if some migrations were executed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('2');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '2', 'down'),
        new MigrationFile(source, '1', 'down'),
      ]),
    );
    const step = await migrationsCore.down();

    expect(step).toStrictEqual<MigrationStep>({
      name: '2',
      direction: 'down',
    });
    expect(executeMigrationSpy).toHaveBeenCalledTimes(1);
    expect(executeMigrationSpy).toHaveBeenCalledWith('2', QUERY_CONTENT, 'down');
  });

  it('down(): should not execute migration down if no migrations were executed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue(null);
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '2', 'down'),
        new MigrationFile(source, '1', 'down'),
      ]),
    );
    const step = await migrationsCore.down();

    expect(step).toStrictEqual(null);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('down(): should not execute migration down if dry flag passed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('2');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '2', 'down'),
        new MigrationFile(source, '1', 'down'),
      ]),
    );
    const step = await migrationsCore.down({ dry: true });

    expect(step).toStrictEqual<MigrationStep>({
      name: '2',
      direction: 'down',
    });
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('upToLatest(): should execute all up migrations to latest', async () => {
    getLatestMigrationNameSpy.mockResolvedValue(null);
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '1', 'up'),
        new MigrationFile(source, '2', 'up'),
        new MigrationFile(source, '3', 'up'),
      ]),
    );
    const steps = await migrationsCore.upToLatest();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '1',
        direction: 'up',
      },
      {
        name: '2',
        direction: 'up',
      },
      {
        name: '3',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(3);
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(1, '1', QUERY_CONTENT, 'up');
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(2, '2', QUERY_CONTENT, 'up');
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(3, '3', QUERY_CONTENT, 'up');
  });

  it('upToLatest(): should execute all up migrations to latest if some migrations already executed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('1');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '1', 'up'),
        new MigrationFile(source, '2', 'up'),
        new MigrationFile(source, '3', 'up'),
      ]),
    );
    const steps = await migrationsCore.upToLatest();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '2',
        direction: 'up',
      },
      {
        name: '3',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(2);
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(1, '2', QUERY_CONTENT, 'up');
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(2, '3', QUERY_CONTENT, 'up');
  });

  it('upToLatest(): should not execute up migrations if no migrations available', async () => {
    getLatestMigrationNameSpy.mockResolvedValue(null);
    getSequenceSpy.mockResolvedValue(new MigrationFilesSequence([]));
    const steps = await migrationsCore.upToLatest();

    expect(steps).toStrictEqual<MigrationStep[]>([]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('upToLatest(): should not execute up migrations if dry flag passed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('1');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '1', 'up'),
        new MigrationFile(source, '2', 'up'),
        new MigrationFile(source, '3', 'up'),
      ]),
    );
    const steps = await migrationsCore.upToLatest({ dry: true });

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '2',
        direction: 'up',
      },
      {
        name: '3',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('drop(): should execute down migrations from latest to first', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('3');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '3', 'down'),
        new MigrationFile(source, '2', 'down'),
        new MigrationFile(source, '1', 'down'),
      ]),
    );
    const steps = await migrationsCore.drop();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '3',
        direction: 'down',
      },
      {
        name: '2',
        direction: 'down',
      },
      {
        name: '1',
        direction: 'down',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(3);
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(1, '3', QUERY_CONTENT, 'down');
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(2, '2', QUERY_CONTENT, 'down');
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(3, '1', QUERY_CONTENT, 'down');
  });

  it('drop(): should execute down migrations from latest to first if some migrations already executed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('2');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '3', 'down'),
        new MigrationFile(source, '2', 'down'),
        new MigrationFile(source, '1', 'down'),
      ]),
    );
    const steps = await migrationsCore.drop();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '2',
        direction: 'down',
      },
      {
        name: '1',
        direction: 'down',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(2);
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(1, '2', QUERY_CONTENT, 'down');
    expect(executeMigrationSpy).toHaveBeenNthCalledWith(2, '1', QUERY_CONTENT, 'down');
  });

  it('drop(): should not execute down migrations if no migrations available', async () => {
    getLatestMigrationNameSpy.mockResolvedValue(null);
    getSequenceSpy.mockResolvedValue(new MigrationFilesSequence([]));
    const steps = await migrationsCore.drop();

    expect(steps).toStrictEqual<MigrationStep[]>([]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('drop(): should not execute down migrations if dry flag passed', async () => {
    getLatestMigrationNameSpy.mockResolvedValue('2');
    getSequenceSpy.mockResolvedValue(
      new MigrationFilesSequence([
        new MigrationFile(source, '3', 'down'),
        new MigrationFile(source, '2', 'down'),
        new MigrationFile(source, '1', 'down'),
      ]),
    );
    const steps = await migrationsCore.drop({ dry: true });

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '2',
        direction: 'down',
      },
      {
        name: '1',
        direction: 'down',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalledTimes(0);
  });

  it('sync(): should not execute migrations if synced', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);

    const steps = await migrationsCore.sync();

    expect(steps).toStrictEqual<MigrationStep[]>([]);
    expect(executeMigrationSpy).not.toHaveBeenCalled();
  });

  it('sync(): should execute up migrations if have pending migrations', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);

    const steps = await migrationsCore.sync();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '5',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalled();
  });

  it('sync(): should execute down migrations if have not existing migrations', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4']);

    const steps = await migrationsCore.sync();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '5',
        direction: 'down',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalled();
  });

  it('sync(): should execute migrations with different history (1)', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '4', '5', '6']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);

    const steps = await migrationsCore.sync();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '6',
        direction: 'down',
      },
      {
        name: '5',
        direction: 'down',
      },
      {
        name: '4',
        direction: 'down',
      },
      {
        name: '3',
        direction: 'up',
      },
      {
        name: '4',
        direction: 'up',
      },
      {
        name: '5',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalled();
  });

  it('sync(): should execute migrations with different history (2)', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '4', '5']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);

    const steps = await migrationsCore.sync();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '5',
        direction: 'down',
      },
      {
        name: '4',
        direction: 'down',
      },
      {
        name: '3',
        direction: 'up',
      },
      {
        name: '4',
        direction: 'up',
      },
      {
        name: '5',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalled();
  });

  it('sync(): should execute migrations with different history (3)', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '3a', '4', '5']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);

    const steps = await migrationsCore.sync();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '5',
        direction: 'down',
      },
      {
        name: '4',
        direction: 'down',
      },
      {
        name: '3a',
        direction: 'down',
      },
      {
        name: '3',
        direction: 'up',
      },
      {
        name: '4',
        direction: 'up',
      },
      {
        name: '5',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalled();
  });

  it('sync(): should execute migrations with different history (4)', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '3a', '4', '5', '6']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);

    const steps = await migrationsCore.sync();

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '6',
        direction: 'down',
      },
      {
        name: '5',
        direction: 'down',
      },
      {
        name: '4',
        direction: 'down',
      },
      {
        name: '3a',
        direction: 'down',
      },
      {
        name: '3',
        direction: 'up',
      },
      {
        name: '4',
        direction: 'up',
      },
      {
        name: '5',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).toHaveBeenCalled();
  });

  it('sync(): should not execute migrations if dry flag passed', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4']);
    getLocalMigrationsNamesSpy.mockResolvedValue(['1', '2', '3', '4', '5']);

    const steps = await migrationsCore.sync({ dry: true });

    expect(steps).toStrictEqual<MigrationStep[]>([
      {
        name: '5',
        direction: 'up',
      },
    ]);
    expect(executeMigrationSpy).not.toHaveBeenCalled();
  });
});
