import fsp from 'fs/promises';
import path from 'path';
import { MigrationDirection, Postfix } from '../types/shared';
import { FileSourceWrongDirectionError } from '../errors/file-source-wrong-direction.error';
import { IMigrationFile } from './types/migration-file.interface';

export class MigrationFile implements IMigrationFile {
  public static create(source: string, options: MigrationFileOptions): MigrationFile {
    const [name, direction] = this.getDirectionAndName(source, options.postfix);
    return new MigrationFile(source, name, direction);
  }

  constructor(
    public readonly source: string,
    public readonly name: string,
    public readonly direction: MigrationDirection,
  ) {}

  public async content(): Promise<string> {
    return fsp.readFile(this.source, 'utf8');
  }

  private static getDirectionAndName(
    source: string,
    postfixOptions: Postfix,
  ): [string, MigrationDirection] {
    const fileName = path.basename(source);

    if (fileName.endsWith(postfixOptions.up)) {
      return [fileName.split(postfixOptions.up)[0], 'up'];
    } else if (fileName.endsWith(postfixOptions.down)) {
      return [fileName.split(postfixOptions.down)[0], 'down'];
    } else {
      throw new FileSourceWrongDirectionError(source);
    }
  }
}

export type MigrationFileOptions = {
  postfix: Postfix;
};
