interface Outpoint {
	txid: string;
	index: number;
}

interface TransactionInput {
	outpoint: Outpoint;
	sig: string;
}

type TransactionInputs = Array<TransactionInput>;

interface TransactionOutput {
	value: number;
	pubkey: string;
}

type TransactionOutputs = Array<TransactionOutput>;

interface Transaction {
	type: "transaction";
	inputs: TransactionInputs;
	outputs: TransactionOutputs;
}

interface Block {
	type: "block";
	txids: string[];
	nonce: string;
	previd: string | null;
	created: string;
	miner?: string;
}

export type ApplicationObject =
	| Transaction
	| Block;

export interface Hello {
	type: "hello";
	version: string;
	agent?: string;
}

export interface GetPeers {
	type: "getpeers";
}

export interface Peers {
	type: "peers";
	peers: string[];
}

interface GetObject {
	type: "getobject";
	objectid: string;
}

interface IHaveObject {
	type: "ihaveobject";
	objectid: string;
}

interface Object {
	type: "object";
	object: ApplicationObject;
}

interface GetMempool {
	type: "getmempool";
}

interface Mempool {
	type: "mempool";
	txids: string[];
}

interface GetChainTip {
	type: "getchaintip";
}

interface ChainTip {
	type: "chaintip";
	blockid: string;
}

export interface Error {
	type: "error";
	error: string;
}

export type Message =
	| Hello
	| Error
	| GetPeers
	| Peers;
	// | GetObject
	// | IHaveObject
	// | Object
	// | GetMempool
	// | Mempool
	// | GetChainTip
	// | ChainTip;
