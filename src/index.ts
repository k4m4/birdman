import { createServer, Socket } from 'net';
import readline from 'readline';
import ConnectionHandler from './lib/connection-handler';
import MessageHandler from './lib/message-handler';
import type { Message, Error as ErrorMessage } from './types';
import { PORT, IP } from './constants';

const server = createServer((socket: Socket) => {
	const readlineInterface = readline.createInterface({
		input: socket,
		output: socket,
	});

	const handleConnectionClose = (): void => {
		console.log('Connection closed');
		readlineInterface.close();
	};

	socket.on('end', handleConnectionClose);
	socket.on('error', handleConnectionClose);

	const connectionHandler = new ConnectionHandler(socket);
	const messageHandler = new MessageHandler(connectionHandler);

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
});

server.listen(PORT, IP);
