import type {
	Message,
	Hello as HelloMessage,
	Error as ErrorMessage,
    Peers as PeersMessage,
    GetPeers as GetPeersMessage,
} from '../types';
import { BIRDMAN_VERSION, NODE_AGENT } from '../constants';
import { isString, isValidNodeVersion } from '../utils/validation';
import type { IConnectionHandler } from './connection-handler';
import { knownPeers, PeerAddress } from './peers';
import { parsePeer } from '../utils/parsing';

export type MessageHandlerMethod = (message: Message) => void;
export type MessageValidatorMethod = (message: Message) => void;

class MessageHandler {
	connection: IConnectionHandler;
    peerAddress: PeerAddress;

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

	constructor (connection: IConnectionHandler) {
		this.connection = connection;
        this.peerAddress = this.connection.getAddress();
	}

	handleMessage (message: Message) {
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

    private validateGetPeers (message: GetPeersMessage) {}

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

        knownPeers.set(this.peerAddress.toString(), this.peerAddress.address);

		this.connection.sendMessage({
			type: 'hello',
			version: BIRDMAN_VERSION,
			agent: NODE_AGENT,
		});
	}

	private handleError (message: ErrorMessage) {
		console.error('Error received by peer: ' + message.error);
        this.connection.end();
	}

    private handleGetPeers (message: GetPeersMessage) {
        this.connection.sendMessage({
            type: 'peers',
            peers: Array.from(knownPeers.keys()),
        });
    }

    private handlePeers (message: PeersMessage) {
        message.peers.forEach((peer: string) => {
            const parsedPeer = new PeerAddress(peer);
            knownPeers.set(parsedPeer.toString(), parsedPeer.address);
        });
    }

    private getPeers (): void {
        this.connection.sendMessage({
            type: 'getpeers',
        });
    }
}

export default MessageHandler;
