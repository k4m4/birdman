import { parsePeer } from '../utils/parsing';
import type { IStore } from '../utils/storage';
import { FileAddressStore } from '../lib/file-address-store';
import {
	isIPv4Address,
	isIPv6Address,
	isDNSHostname,
	isPort,
} from '../utils/validation';
import { KNOWN_PEERS_FILENAME } from '../constants';

export interface Address {
	host: string;
	family: 'IPv4' | 'IPv6' | 'DNS';
	port: number;
}

export class KnownPeers {
	peers: Map<string, Address>;
	store: IStore<Map<string, Address>>;

	constructor(store: IStore<Map<string, Address>>) {
		this.peers = new Map<string, Address>(store.read());
		this.store = store;
	}

	public get(key: string): Address | undefined {
		return this.peers.get(key);
	}

	public has(key: string): boolean {
		return this.peers.has(key);
	}

	public set(key: string, value: Address): void {
		const address = new PeerAddress(value);
		if (this.peers.get(key)) {
			return;
		}
	
		this.peers.set(key, value);
		this.store.write(address.toString());
	}

	public keys(): IterableIterator<string> {
		return this.peers.keys();
	}
}

type AddressValidator = (address: string) => boolean;
const addressValidatorByFamily: Record<Address['family'], AddressValidator> = {
	IPv4: isIPv4Address,
	IPv6: isIPv6Address,
	DNS: isDNSHostname,
};

export class PeerAddress {
	private _address: Address;

	constructor(value: string | Address) {
		if (typeof value === 'string') {
			this._address = parsePeer(value as string);
		} else {
			this._address = value as Address;
		}
	}

	public get address(): Address {
		return this._address;
	}

	public isValid(): boolean {
		const { host, port, family } = this._address;
		return isPort(port) && addressValidatorByFamily[family](host);
	}

	public toString(): string {
		const { host, family, port } = this._address;
		const peerAddress = family === 'IPv6' ? '[' + host + ']' : host;
		return peerAddress + ':' + port;
	}
}

export const knownPeers: KnownPeers = new KnownPeers(new FileAddressStore(KNOWN_PEERS_FILENAME));
