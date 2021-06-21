import { Socket } from 'net';
import type { Message } from '../types';
import { canonicalize } from '../utils/json';
import { PeerAddress } from './peers';
import type { Address } from './peers';

export interface IConnectionHandler {
    getAddress (): PeerAddress;
	sendPayload (payload: string): void;
	sendMessage (message: Message): void;
	end (): void;
}

class ConnectionHandler implements IConnectionHandler {
	private socket: Socket;

	constructor (socket: Socket) {
		this.socket = socket;
	}

    getAddress (): PeerAddress {
        return new PeerAddress(this.socket.address() as Address);
    }

	sendPayload (payload: string) {
		this.socket.write(payload + '\n');
	}

	sendMessage (message: Message) {
		this.sendPayload(canonicalize(message));
	}

	end () {
		this.socket.end();
	}
}

export default ConnectionHandler;
