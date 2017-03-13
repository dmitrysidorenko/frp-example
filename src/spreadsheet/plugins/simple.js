import R from 'ramda';
import dropRepeats from 'xstream/extra/dropRepeats';

const checkIfComputed = s => /^\s*=\w+\d+\s*$/.test(s);
const getCellDisplayValueFromStream = R.curry((state$, id) => state$
    .map(state => {
        return R.path([id, 'displayValue'], state);
    })
    .compose(dropRepeats()));

export default getState => {
    const getCellDisplayValueStream = getCellDisplayValueFromStream(getState());
    return {
        run: (existing, value, id) => {
            const computed = checkIfComputed(value);
            const referenceId = /^\s*=(\w+\d+)\s*$/.exec(value)[1];
            if (referenceId && referenceId !== id) {
                if (R.prop('computed', existing) && R.prop('referenceId') === referenceId) {
                    return existing;
                }
                const stream = getCellDisplayValueStream(referenceId)
                    .map((displayValue) => ({
                        value,
                        displayValue,
                        computed
                    }));
                console.log(`Create new computed stream for "${id}"`);
                return {stream, referenceId, computed};
            }
            return existing;
        },
        test: (value) => {
            return checkIfComputed(value);
        }
    };
};