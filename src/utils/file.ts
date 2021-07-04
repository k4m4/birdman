import fs from 'fs';

export type LineParserMethod<T> = (line: string) => [ string, T ];

export const parseFile = <T>(filename: string, parser: LineParserMethod<T>): Array<[ string, T ]> => {
	const lines = fs.readFileSync(filename, 'utf-8')
		.split('\n')
		.filter(Boolean)
		.map(parser);

	return lines;
};
