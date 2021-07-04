import { Address } from '../lib/peers';
import { isIPv4Address } from './validation';

export const parsePeer = (string: string): Address => {
	const components = string.split(':');
	const parsedPeer: Partial<Address> = {};
	if (components.length > 2) {
		parsedPeer.host = components.slice(0, -1).join(':').slice(1, -1);
		parsedPeer.port = Number(components.pop() as string);
		parsedPeer.family = 'IPv6';
	} else {
		const [host, port] = components;
		parsedPeer.host = host;
		parsedPeer.port = Number(port);
		parsedPeer.family = isIPv4Address(host) ? 'IPv4' : 'DNS';
	}

	return parsedPeer as Address;
};
