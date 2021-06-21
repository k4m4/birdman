import { Address } from '../lib/peers';
import { isIPv4Address } from './validation';

export const parsePeer = (string: string): Address => {
	const components = string.split(':');
	const parsedPeer: Partial<Address> = {};
	if (components.length > 2) {
		parsedPeer.address = components.slice(0, -1).join(':').slice(1, -1);
		parsedPeer.port = Number(components.pop() as string);
		parsedPeer.family = 'IPv6';
	} else {
		const [address, port] = components;
		parsedPeer.address = address;
		parsedPeer.port = Number(port);
		parsedPeer.family = isIPv4Address(address) ? 'IPv4' : 'DNS';
	}

	return parsedPeer as Address;
};
