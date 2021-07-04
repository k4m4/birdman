import { satisfies as semverSatisfies } from 'semver';
import { LATEST_NODE_SEMVER_VERSION } from '../constants';
import {
	ApplicationObject,
	TransactionInput,
	TransactionOutput,
	Outpoint,
	Transaction,
	Block,
} from '../types';

export const isString = (x: unknown): boolean => typeof x === 'string';

export const isValidNodeVersion = (version: string): boolean => semverSatisfies(version, LATEST_NODE_SEMVER_VERSION);

const IPv4Regex = new RegExp('(?:^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$)');
const IPv6Regex = new RegExp('(?:^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$)');
const DNSHostnameRegex = new RegExp('(?:^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$)');
const SHA256Regex = new RegExp('(?:^[A-Fa-f0-9]{64}$)');
const nByteHexRegex = (n?: number) => new RegExp(`(?:^[A-Fa-f0-9]${n ? `{${n * 2}}` : '+'}$)`);
const printableASCIIRegex = (length?: number) => new RegExp(`(?:^[\x20-\x7F]${length ? `{${length}}` : '*'}$)`);

export const isIPv4Address = (address: string): boolean => IPv4Regex.test(address);
export const isIPv6Address = (address: string): boolean => IPv6Regex.test(address);
export const isDNSHostname = (address: string): boolean => DNSHostnameRegex.test(address);

export const isSHA256 = (hash: string): boolean => SHA256Regex.test(hash);

export const isPeerAddress = (address: string): boolean => isIPv4Address(address) || isIPv6Address(address) || isDNSHostname(address);

export const isPort = (port: number): boolean => port >= 0 && port <= 65535;

export const isHex = (hex: string, n?: number): boolean => nByteHexRegex(n).test(hex);

export const isValidTransactionId = isSHA256;
export const isValidNonce = isSHA256;
export const isValidBlockId = isSHA256;
export const isValidUNIXTimestamp = (timestamp: string): boolean => !!timestamp && new Date(timestamp).getTime() > 0; 
export const isValidMiningTarget = (target: string): boolean => isHex(target, 32);
export const isValidMiner = (miner: string): boolean => printableASCIIRegex(128).test(miner);
export const isValidNote = (note: string): boolean => printableASCIIRegex(128).test(note);
export const isValidOutpoint = (outpoint: Outpoint): boolean => isValidTransactionId(outpoint.txid) && Number.isInteger(outpoint.index) && outpoint.index >= 0;
export const isValidSignature = (sig: string): boolean => isHex(sig, 64);

// TODO: throw errors for more descriptive feedback on why validation failed
export const isValidTransactionInput = (input: TransactionInput): boolean => isValidOutpoint(input.outpoint) && isValidSignature(input.sig);
export const isValidTransactionOutput = (output: TransactionOutput): boolean => isHex(output.pubkey, 32) && Number.isInteger(output.value) && output.value >= 0;
