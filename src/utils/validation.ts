import { satisfies as semverSatisfies } from 'semver';
import { LATEST_NODE_VERSION } from '../constants';

export const isString = (x: unknown): boolean => typeof x === 'string';

export const isValidNodeVersion = (version: string): boolean => semverSatisfies(version, LATEST_NODE_VERSION);

const IPv4Regex = new RegExp(`(?:^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$)`);

export const isIPv4Address = (address: string): boolean => IPv4Regex.test(address);
