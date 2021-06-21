// Source (modified): https://github.com/erdtman/canonicalize/blob/master/lib/canonicalize.js
export const canonicalize = (object: any): string => {
    if (object === null || typeof object !== 'object' || (object as { toJSON: () => object })?.toJSON != null) {
        return JSON.stringify(object);
    }

    if (Array.isArray(object)) {
        return '[' + object.reduce((accumulator, currentValue, index) => {
            const comma = index === 0 ? '' : ',';
            const value = currentValue === undefined || typeof currentValue === 'symbol' ? null : currentValue;
            return accumulator + comma + canonicalize(value);
        }, '') + ']';
    }

    return '{' + Object.keys(object).sort().reduce((accumulator, currentValue, index) => {
        if (object[currentValue] === undefined || typeof object[currentValue] === 'symbol') {
            return accumulator;
        }

        const comma = accumulator.length === 0 ? '' : ',';
        return accumulator + comma + canonicalize(currentValue) + ':' + canonicalize(object[currentValue]);
    }, '') + '}';
};
