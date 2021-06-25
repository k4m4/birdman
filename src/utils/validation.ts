import { satisfies as semverSatisfies } from 'semver';
import { LATEST_NODE_SEMVER_VERSION } from '../constants';
import {
	ApplicationObject,
	TransactionInput,
	TransactionOutput,
	Block,
} from '../types';

export const isString = (x: unknown): boolean => typeof x === 'string';

export const isValidNodeVersion = (version: string): boolean => semverSatisfies(version, LATEST_NODE_SEMVER_VERSION);

const IPv4Regex = new RegExp('(?:^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$)');
const IPv6Regex = new RegExp('(?:^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$)');
const DNSHostnameRegex = new RegExp('(?:^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$)');
const SHA256Regex = new RegExp('(?:^[A-Fa-f0-9]{64}$)');

export const isIPv4Address = (address: string): boolean => IPv4Regex.test(address);
export const isIPv6Address = (address: string): boolean => IPv6Regex.test(address);
export const isDNSHostname = (address: string): boolean => DNSHostnameRegex.test(address);

export const isSHA256 = (hash: string): boolean => SHA256Regex.test(hash);

export const isPeerAddress = (address: string): boolean => isIPv4Address(address) || isIPv6Address(address) || isDNSHostname(address);

export const isPort = (port: number): boolean => port >= 0 && port <= 65535;

// TODO: implement these
// TODO: throw errors for more descriptive feedback on why validation failed
export const isValidObject = (object: ApplicationObject): boolean => true;
export const isValidTransactionInput = (input: TransactionInput): boolean => true;
export const isValidTransactionOutput = (output: TransactionOutput): boolean => true;
export const isValidBlock = (block: Block): boolean => true;
