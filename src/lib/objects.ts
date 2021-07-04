import type { ApplicationObject } from '../types';
import { FileObjectStore } from '../utils/storage';
import type { ObjectMap, IObjectStore } from '../utils/storage';
import { KNOWN_OBJECTS_FILENAME } from '../constants';

export class KnownObjects {
	objects: ObjectMap;
	store: IObjectStore;

	constructor(store: IObjectStore) {
		this.objects = new Map(store.read());
		this.store = store;
	}

	public get(key: string): ApplicationObject | undefined {
		return this.objects.get(key);
	}

	public has(key: string): boolean {
		return this.objects.has(key);
	}

	public set(key: string, value: ApplicationObject): void {
		if (this.objects.get(key)) {
			return;
		}
	
		this.objects.set(key, value);
		this.store.write(key + ':' + JSON.stringify(value));
	}

	public keys(): IterableIterator<string> {
		return this.objects.keys();
	}
}

export const knownObjects: KnownObjects = new KnownObjects(new FileObjectStore(KNOWN_OBJECTS_FILENAME));
