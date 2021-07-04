import { Address } from '../lib/peers';
import type { ApplicationObject } from '../types';

export interface IStore<T> {
    read(): T;
    write(value: string): void;
}

export type AddressMap = Map<string, Address>;
export type IAddressStore = IStore<AddressMap>;

export type ObjectMap = Map<string, ApplicationObject>;
export type IObjectStore = IStore<ObjectMap>;

