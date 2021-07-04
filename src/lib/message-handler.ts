import type {
	Message,
	Hello as HelloMessage,
	Error as ErrorMessage,
	Peers as PeersMessage,
	GetPeers as GetPeersMessage,
	GetObject as GetObjectMessage,
	IHaveObject as IHaveObjectMessage,
	Object as ObjectMessage,
	ApplicationObject,
	Transaction as TransactionObject,
	Block as BlockObject,
} from '../types';
import {
	LATEST_NODE_VERSION,
	NODE_AGENT,
	BIRDMAN_ADDRESS,
} from '../constants';
import {
	isString,
	isValidNodeVersion,
	isSHA256,
	isValidObject,
	isValidTransactionInput,
	isValidTransactionOutput,
	isValidBlock,
} from '../utils/validation';
import { createHash } from '../utils/hashing';
import type { IConnectionHandler } from './connection-handler';
import { knownPeers, PeerAddress } from './peers';
import { knownObjects } from './objects';
import { connections, initiateConnection } from '..';

export type MessageHandlerMethod = (message: Message) => void;
export type MessageValidatorMethod = (message: Message) => void;
export type ApplicationObjectValidatorMethod = (object: ApplicationObject) => void;

class MessageHandler {
	private connection: IConnectionHandler;
	private peerAddress: PeerAddress;
	private handshakeRequested = false;

	handlerByMessageType: Record<Message['type'], MessageHandlerMethod> = {
		hello: (message: Message) => this.handleHello(message as HelloMessage),
		error: (message: Message) => this.handleError(message as ErrorMessage),
		getpeers: (message: Message) => this.handleGetPeers(message as GetPeersMessage),
		peers: (message: Message) => this.handlePeers(message as PeersMessage),
		getobject: (message: Message) => this.handleGetObject(message as GetObjectMessage),
		ihaveobject: (message: Message) => this.handleIHaveObject(message as IHaveObjectMessage),
		object: (message: Message) => this.handleObject(message as ObjectMessage),
	};

	validatorByMessageType: Record<Message['type'], MessageValidatorMethod> = {
		hello: (message: Message) => this.validateHello(message as HelloMessage),
		error: (message: Message) => this.validateError(message as ErrorMessage),
		getpeers: (message: Message) => this.validateGetPeers(message as GetPeersMessage),
		peers: (message: Message) => this.validatePeers(message as PeersMessage),
		getobject: (message: Message) => this.validateGetObject(message as GetObjectMessage),
		ihaveobject: (message: Message) => this.validateIHaveObject(message as IHaveObjectMessage),
		object: (message: Message) => this.validateObject(message as ObjectMessage),
	};

	validatorByApplicationObjectType: Record<ApplicationObject['type'], ApplicationObjectValidatorMethod> = {
		transaction: (object: ApplicationObject) => this.validateTransaction(object as TransactionObject),
		block: (object: ApplicationObject) => this.validateBlock(object as BlockObject),
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

	private validateGetPeers (message: GetPeersMessage): void {
		return;
	}

	private validatePeers (message: PeersMessage) {
		const { peers } = message;
		const validPeers = Array.isArray(peers) && peers.every(peer => typeof peer === 'string');
		if (validPeers) {
			return;
		}

		throw new Error('Received malformed payload for message of type `peers`');
	}

	private validateGetObject (message: GetObjectMessage) {
		const { objectid } = message;
		if (isString(objectid) && isSHA256(objectid)) {
			return;
		}

		throw new Error('Received malformed payload for message of type `getobject`');
	}

	private validateIHaveObject (message: IHaveObjectMessage) {
		const { objectid } = message;
		if (isString(objectid) && isSHA256(objectid)) {
			return;
		}

		throw new Error('Received malformed payload for message of type `ihaveobject`');
	}

	private validateObject (message: ObjectMessage) {
		const { object } = message;
		try {
			this.validatorByApplicationObjectType[object.type](object);
		} catch (error: any) {
			// TODO: Check if `error instanceof ObjectValidationError`
			throw new Error(`Received malformed payload for message of type \`object\`${error?.message ? `: "${error.message}"` : ''}`);
		}
	}

	private validateTransaction (object: TransactionObject) {
		const { inputs, outputs } = object;
		// TODO: validate inputs & outputs
		if (
			inputs &&
			Array.isArray(inputs) &&
			outputs &&
			Array.isArray(outputs) &&
			inputs.every(isValidTransactionInput) &&
			outputs.every(isValidTransactionOutput)
		) {
			return;
		}

		throw new Error('Transaction is invalid');
	}

	private validateBlock (object: BlockObject) {
		// TODO: validate block
		if (isValidBlock(object)) {
			return;
		}

		throw new Error('Block is invalid');
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
		peers.push(BIRDMAN_ADDRESS);
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
				console.error(`Ignored invalid peer: ${peerKey}`);
				return;
			}

			knownPeers.set(peerKey, parsedPeer.address);
			initiateConnection(parsedPeer);
		});
	}

	private handleGetObject (message: GetObjectMessage): void {
		const object = knownObjects.get(message.objectid);
		if (!object) {
			return;
		}

		this.object(object);
	}

	private handleIHaveObject (message: IHaveObjectMessage): void {
		const { objectid } = message;
		if (knownObjects.has(objectid)) {
			return;
		}

		this.getObject({ objectid });
	}

	private handleObject (message: ObjectMessage): void {
		const { object } = message;
		if (!isValidObject(object)) {
			throw new Error('Object failed validation');
		}

		// TODO: make sure JSON.stringify produces the desired string here
		const objectid = createHash(JSON.stringify(object));
		knownObjects.set(objectid, object);
		this.iHaveObject({ objectid });
	}

	private hello (): void {
		const message: HelloMessage = {	
			type: 'hello',
			version: LATEST_NODE_VERSION,
			agent: NODE_AGENT,
		};

		this.connection.sendMessage(message);
	}

	private getPeers (): void {
		const message: GetPeersMessage = {
			type: 'getpeers',
		};

		this.connection.sendMessage(message);
	}

	private getObject ({ objectid }: Omit<GetObjectMessage, 'type'>): void {
		const message: GetObjectMessage = {
			type: 'getobject',
			objectid,
		};

		this.connection.sendMessage(message);
	}

	// TODO: Create util for this TS Omit
	private iHaveObject ({ objectid }: Omit<IHaveObjectMessage, 'type'>): void {
		const message: IHaveObjectMessage = {
			type: 'ihaveobject',
			objectid,
		};

		connections.forEach((connection: IConnectionHandler) => {
			if (connection === this.connection) {
				return;
			}

			connection.sendMessage(message);
		});
	}

	private object (object: ApplicationObject): void {
		const message: ObjectMessage = {
			type: 'object',
			object,
		};

		this.connection.sendMessage(message);
	}
}

export default MessageHandler;
