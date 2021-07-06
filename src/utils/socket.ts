import { AddressInfo } from 'net';
import { Address } from '../lib/peers';

export const socketAddressInfoToAddress = (addressInfo: AddressInfo): Address => {
	const { address: _, ...addressObject } = {
		...addressInfo,
		host: addressInfo.address,
		family: addressInfo.family as Address['family'],
	};

	return addressObject;
};
