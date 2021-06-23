import { createConnection, createServer, Socket } from 'net';
import readline from 'readline';
import ConnectionHandler from './lib/connection-handler';
import MessageHandler from './lib/message-handler';
import type { Message, Error as ErrorMessage } from './types';
import { PORT, IP } from './constants';
import { knownPeers, PeerAddress } from './lib/peers';
import type { Address } from './lib/peers';

const handleConnection = (options?: {
    initializeHandshake?: boolean;
    peerAddress?: PeerAddress;
}) => (socket: Socket) => {
	const readlineInterface = readline.createInterface({
		input: socket,
		output: socket,
	});

	const peerAddress: PeerAddress = options?.peerAddress || new PeerAddress(socket.address() as Address);
	const { address, port } = peerAddress.address;

	const handleConnectionOpen = (): void => {
		console.log(`Connection created with ${address}:${port}`);
	};

	const handleConnectionError = (): void => {
		readlineInterface.close();
	};

	const handleConnectionEnd = (): void => {
		console.log(`Connection with ${address}:${port} closed`);
		readlineInterface.close();
	};

	socket.on('connect', handleConnectionOpen);
	socket.on('end', handleConnectionEnd);
	socket.on('error', handleConnectionError);

	const connectionHandler = new ConnectionHandler(socket, peerAddress);
	const messageHandler = new MessageHandler(connectionHandler, options?.initializeHandshake);

	const handleLineRead = (line: string) => {
		try {
			const message: Message = JSON.parse(line);
			messageHandler.handleMessage(message);
		} catch (error) {
			console.error(error);
			const errorMessage: Partial<ErrorMessage> = {
				type: 'error',
			};

			if (error instanceof SyntaxError) {
				errorMessage.error = 'Could not parse message';
			} else {
				errorMessage.error = error.message;
			}

			connectionHandler.sendMessage(errorMessage as ErrorMessage);
			connectionHandler.end();
		}
	};

	readlineInterface.on('line', handleLineRead);
};

export const initiateConnection = (peer: PeerAddress): void => {
	try {
		const { port, address } = peer.address;
		const handleCreateConnection = handleConnection({ initializeHandshake: true, peerAddress: peer })
		const socket: Socket = createConnection(port, address);
		handleCreateConnection(socket);
	} catch (error: unknown) {
		console.error(`Failed to initiate connection with ${peer}:`, error);
	}
};

Array.from(knownPeers.keys()).filter(Boolean).forEach((key: string) => {
	const peerAddress = new PeerAddress(knownPeers.get(key as string) as Address);
	initiateConnection(peerAddress);
});

const handleServerConnection = handleConnection();
const server = createServer(handleServerConnection);

server.listen(PORT, IP);
