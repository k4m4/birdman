import { parsePeer } from '../utils/parsing';

export interface Address {
    address: string;
    family: 'IPv4' | 'IPv6' | 'DNS';
    port: number;
}

export let knownPeers: Map<string, Address> = new Map();

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

    public toString(): string {
        const { address, family, port } = this._address;
        const peerAddress = family === 'IPv6' ? '[' + address + ']' : address;
        return peerAddress + ':' + port;
    }
}
