import crypto from 'crypto';

export const createHash = (string: string): string => crypto.createHash('sha256').update(string).digest('hex');
