import fs from 'fs';
import { IObjectStore, ObjectMap } from '../utils/storage';
import { parseFile } from '../utils/file';

export class FileObjectStore implements IObjectStore {
	filename: string;

	constructor(filename: string) {
		this.filename = filename;
	}

	public read(): ObjectMap {
		return new Map(
			parseFile(this.filename, (line: string) => {
				const separatorIndex = line.indexOf(':');
				const [objectid, object] = [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
				return [ objectid, JSON.parse(object) ];
			})
		);
	}

	public write(value: string): void {
		fs.appendFileSync(this.filename, value + '\n');
	}
}
