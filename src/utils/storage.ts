import fs from 'fs';
import { parsePeer } from './parsing';
import { Address } from '../lib/peers';
import type { ApplicationObject } from '../types';

export interface IStore<T> {
    read(): T;
    write(value: string): void;
}

type LineParserMethod<T> = (line: string) => [ string, T ];

const parseFile = <T>(filename: string, parser: LineParserMethod<T>): Array<[ string, T ]> => {
	const lines = fs.readFileSync(filename, 'utf-8')
		.split('\n')
		.filter(Boolean)
		.map(parser);

	return lines;
};

export type AddressMap = Map<string, Address>;
export type IAddressStore = IStore<AddressMap>;

export class AddressStore implements IAddressStore {
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

export type ObjectMap = Map<string, ApplicationObject>;
export type IObjectStore = IStore<ObjectMap>;

export class ObjectStore implements IObjectStore {
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
