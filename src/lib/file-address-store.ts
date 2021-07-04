import fs from 'fs';
import { IAddressStore } from '../utils/storage';
import { parsePeer } from '../utils/parsing';
import { parseFile } from '../utils/file';
import { Address } from '../lib/peers';

export class FileAddressStore implements IAddressStore {
	filename: string;

	constructor(filename: string) {
		this.filename = filename;
	}

	public read(): Map<string, Address> {
		return new Map<string, Address>(
			parseFile(this.filename, (line: string) => {
				return [ line, parsePeer(line) ];
			})
		);
	}

	public write(value: string): void {
		fs.appendFileSync(this.filename, value + '\n');
	}
}
