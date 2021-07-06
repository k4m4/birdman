import { createConnection, createServer, Socket, AddressInfo } from 'net';
import readline from 'readline';
import ConnectionHandler from './lib/connection-handler';
import MessageHandler from './lib/message-handler';
import type { Message, Error as ErrorMessage } from './types';
import { PORT, IP } from './constants';
import { knownPeers, PeerAddress } from './lib/peers';
import type { Address } from './lib/peers';
import { socketAddressInfoToAddress } from './utils/socket';

export const connections: ConnectionHandler[] = [];

const handleConnection = (address?: PeerAddress) => (socket: Socket): void => {
	const readlineInterface = readline.createInterface({
		input: socket,
		output: socket,
	});

	const peerAddress: PeerAddress = address || new PeerAddress(socketAddressInfoToAddress(socket.address() as AddressInfo));
	const { host, port } = peerAddress.address;

	const handleConnectionOpen = (): void => {
		console.log(`Connection created with ${host}:${port}`);
	};

	const handleConnectionError = (): void => {
		readlineInterface.close();
	};

	const handleConnectionEnd = (): void => {
		console.log(`Connection with ${host}:${port} closed`);
		readlineInterface.close();
	};

	socket.on('connect', handleConnectionOpen);
	socket.on('end', handleConnectionEnd);
	socket.on('error', handleConnectionError);

	const connectionHandler = new ConnectionHandler(socket, peerAddress);
	connections.push(connectionHandler);

	const messageHandler = new MessageHandler(connectionHandler);

	const handleLineRead = (line: string) => {
		try {
			// TODO: figure out a way to not need this
			if (line.startsWith('PROXY')) {
				return;
			}

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
		const { host, port } = peer.address;
		const handleCreateConnection = handleConnection(peer);
		const socket: Socket = createConnection(port, host);
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
