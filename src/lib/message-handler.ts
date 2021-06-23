import type {
	Message,
	Hello as HelloMessage,
	Error as ErrorMessage,
	Peers as PeersMessage,
	GetPeers as GetPeersMessage,
} from '../types';
import { LATEST_NODE_VERSION, NODE_AGENT } from '../constants';
import { isString, isValidNodeVersion } from '../utils/validation';
import type { IConnectionHandler } from './connection-handler';
import { knownPeers, PeerAddress } from './peers';

export type MessageHandlerMethod = (message: Message) => void;
export type MessageValidatorMethod = (message: Message) => void;

class MessageHandler {
	private connection: IConnectionHandler;
	private peerAddress: PeerAddress;
    private handshakeRequested = false;

	handlerByMessageType: Record<Message['type'], MessageHandlerMethod> = {
		hello: (message: Message) => this.handleHello(message as HelloMessage),
		error: (message: Message) => this.handleError(message as ErrorMessage),
		getpeers: (message: Message) => this.handleGetPeers(message as GetPeersMessage),
		peers: (message: Message) => this.handlePeers(message as PeersMessage),
	};

	validatorByMessageType: Record<Message['type'], MessageValidatorMethod> = {
		hello: (message: Message) => this.validateHello(message as HelloMessage),
		error: (message: Message) => this.validateError(message as ErrorMessage),
		getpeers: (message: Message) => this.validateGetPeers(message as GetPeersMessage),
		peers: (message: Message) => this.validatePeers(message as PeersMessage),
	};

	constructor (connection: IConnectionHandler, initiateHandshake = false) {
		this.connection = connection;
		this.peerAddress = connection.getAddress();
		if (initiateHandshake) {
			this.handshakeRequested = true;
			this.hello();
		}
	}

	handleMessage (message: Message): void {
		console.log(`Message received from ${this.peerAddress}:`, { message });

		if (
			!Object.keys(this.handlerByMessageType).includes(message.type) ||
			!Object.keys(this.validatorByMessageType).includes(message.type)
		) {
			throw new Error('Unsupported message type received');
		}

		if (message.type !== 'hello' && !knownPeers.has(this.peerAddress.toString())) {
			throw new Error('Received non-hello message before handshake');
		}

		this.validatorByMessageType[message.type](message);
		this.handlerByMessageType[message.type](message);
	}

	private validateHello (message: HelloMessage) {
		const { version, agent } = message;
		const validVersion = version && isString(version);
		const validAgent = !agent || (agent && isString(agent));
		if (validVersion && validAgent) {
			return;
		}

		throw new Error('Received malformed payload for message of type `hello`');
	}

	private validateError (message: ErrorMessage) {
		const { error } = message;
		const validError = error && isString(error);
		if (validError) {
			return;
		}

		throw new Error('Received malformed payload for message of type `error`');
	}

	private validateGetPeers (message: GetPeersMessage): void {}

	private validatePeers (message: PeersMessage) {
		const { peers } = message;
		const validPeers = Array.isArray(peers) && peers.every(peer => typeof peer === 'string');
		if (validPeers) {
			return;
		}

		throw new Error('Received malformed payload for message of type `peers`');
	}

	private handleHello (message: HelloMessage) {
		if (!isValidNodeVersion(message.version)) {
			throw new Error('Unsupported node version received');
		}

		const address = this.peerAddress.toString();
		if (this.handshakeRequested) {
			this.getPeers();
		} else {
			this.hello();
			knownPeers.set(address, this.peerAddress.address);
		}
	}

	private handleError (message: ErrorMessage) {
		console.error('Error received by peer: ' + message.error);
		this.connection.end();
	}

	private handleGetPeers (message: GetPeersMessage): void {
		const peers: string[] = Array.from(knownPeers.keys());
		this.connection.sendMessage({
			type: 'peers',
			peers,
		});
	}

	private handlePeers (message: PeersMessage) {
		message.peers.forEach((peerKey: string) => {
			if (knownPeers.has(peerKey)) {
				return;
			}

			const parsedPeer = new PeerAddress(peerKey);
			if (!parsedPeer.isValid()) {
				console.error(`Ignored invalid peer: ${parsedPeer}`);
				return;
			}

			knownPeers.set(peerKey, parsedPeer.address);
		});
	}

	private hello (): void {
		this.connection.sendMessage({
			type: 'hello',
			version: LATEST_NODE_VERSION,
			agent: NODE_AGENT,
		});
	}

	private getPeers (): void {
		this.connection.sendMessage({
			type: 'getpeers',
		});
	}
}

export default MessageHandler;
