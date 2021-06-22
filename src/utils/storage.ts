import fs from 'fs';
import { parsePeer } from './parsing';
import { Address } from '../lib/peers';

export interface IStore<T> {
    read(): T;
    write(value: string): void;
}

export class AddressStore implements IStore<Map<string, Address>> {
    filename: string;

    constructor(filename: string) {
        this.filename = filename;
    }

    public read(): Map<string, Address> {
        return new Map<string, Address>(
            fs.readFileSync(this.filename, 'utf-8')
                .split('\n')
                .filter(Boolean)
                .map((line: string) => {
                    return [ line, parsePeer(line) ];
                })
        );
    }

    public write(value: string): void {
        fs.appendFileSync(this.filename, value + '\n');
    }
}
