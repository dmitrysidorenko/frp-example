import R from 'ramda';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';

const letters = ['a', 'b', 'c', 'd', 'e'];
const average = R.converge(R.divide, [R.sum, R.length]);

const test = s => {
    return /^\s*=avg\((\w+\d+,)+(\w+\d+)\)\s*$/.test(s) || /^\s*=avg\((\w+\d+:\w+\d+)\)\s*$/.test(s);
};

const getCellDisplayValueFromStream = R.curry((state$, id) => state$
    .map(state => {
        return R.path([id, 'displayValue'], state);
    })
    .compose(dropRepeats()));

export default getState => {
    const getCellDisplayValueStream = getCellDisplayValueFromStream(getState());
    return {
        run: (existing, value, id) => {
            const cvsVars = /^\s*=avg\(((\w+\d+,)+(\w+\d+))\)\s*$/.exec(value);
            const rangeVars = /^\s*=avg\((\w+\d+:\w+\d+)\)\s*$/.exec(value);
            let ids = [];
            if (cvsVars) {
                ids = R.pipe(R.propOr('', 1), R.split(','))(cvsVars);
            } else {
                const [fromId, toId] = R.pipe(R.propOr('', 1), R.split(':'))(rangeVars);
                const [, startRow, startCol] = /(\w+)(\d+)/.exec(fromId);
                const [, endRow, endCol] = /(\w+)(\d+)/.exec(toId);

                let startRowIndex = R.indexOf(startRow, letters);
                let endRowIndex = R.indexOf(endRow, letters);
                if (startRowIndex > endRowIndex) {
                    [endRowIndex, startRowIndex] = [startRowIndex, endRowIndex];
                }
                const rows = R.slice(startRowIndex, endRowIndex + 1, letters);
                const cols = R.range(+startCol, +endCol + 1);
                console.log('rows, cols', rows, cols);
                return existing;
            }
            if (!R.contains(id, ids)) {
                if (R.equals(ids, R.propOr([], 'ids', existing))) {
                    return existing;
                }
                const strs = R.map(id => getCellDisplayValueStream(id), ids);
                console.log('strs', strs);
                const stream = xs.combine(...strs)
                    .debug('streams')
                    .map(values => ({
                        value,
                        displayValue: average(values),
                    }));
                console.log(`Create new computed stream for "${id}"`);
                return {stream, ids};
            }
            return existing;
        },
        test: (value) => {
            return test(value);
        }
    };
};