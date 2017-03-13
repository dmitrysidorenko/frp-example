import React from 'react';
import R from 'ramda';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import onionify from 'cycle-onionify';
import Spreadsheet from './ui/spreadsheet';
import * as plugins from './plugins';
const letters = ['a', 'b', 'c', 'd', 'e'];
const getLetter = R.flip(R.prop)(letters);

export const SpreadsheetComponent = ({Interact, rowsCount, cellsCount, onion}) => {
    const {state$} = onion;
    const rawState$ = state$
        .map(R.prop('raw'));
    const computedState$ = state$
        .map(R.prop('computed')).debug('Computed State');
    const cellValueChange$ = Interact
        .get('onInput');

    const pluginsAsArray = R.keys(plugins).map(key => plugins[key](() => computedState$));
    const choosePlugin = (value) => {
        return pluginsAsArray.find(p => p.test(value));
    };

    const rowConfigs = R.map(row => {
        return R.map(cell => {
            return {id: `${row}${cell}`, cb: value => Interact.cb(`onInput`)({cell, row, value})};
        }, R.times(R.identity, cellsCount));
    }, R.times(getLetter, rowsCount));
    const flattenCellConfigs = R.flatten(rowConfigs);
    console.log('rowConfigs', rowConfigs);

    // raw reducer
    const rawStateUpdate$ = cellValueChange$.fold((acc, cur) => {
        return ({
            ...acc,
            [`${cur.row}${cur.cell}`]: cur.value
        });
    }, {});

    const computedReducers = R.map(({id}) => {
        return rawState$
            .map(R.propOr('', id))
            .compose(dropRepeats())
            .fold((acc, value) => {
                const lastUsePlugin = R.propOr(null, 'plugin', acc[id]);
                const plugin = choosePlugin(value);
                if (plugin) {
                    console.log('Plugin:', plugin);
                    const data = plugin.run(acc[id], value, id);
                    if (data === acc[id]) {
                        return acc;
                    }
                    return {
                        ...acc,
                        [id]: {
                            ...data,
                            plugin
                        }
                    };
                }

                if (acc[id] && lastUsePlugin === 'NO_PLUGIN') {
                    console.log('skip calc');
                    return acc;
                }
                console.log(`Create new simple stream for "${id}"`);
                return {
                    ...acc,
                    [id]: {
                        stream: rawState$
                            .map(R.propOr('', id))
                            .compose(dropRepeats())
                            .map(value => ({value, displayValue: value})),
                        value,
                        plugin: 'NO_PLUGIN'
                    }
                }
            }, {})
            .map(R.path([id, 'stream']))
            .filter(R.identity)
            .compose(dropRepeats())
            .flatten()
            .map(value => ({[id]: value}));
    }, flattenCellConfigs);

    const computedStateUpdate$ = xs.merge(...computedReducers).fold((acc, change) => {
        return {...acc, ...change}
    }, {});

    const reducer$ = xs.combine(computedStateUpdate$, rawStateUpdate$)
        .map(([computed, raw]) => () => ({computed, raw}));

    return {
        onion: reducer$,
        DOM: computedState$
            .map(state => (<Spreadsheet state={state} rowConfigs={rowConfigs} />))
    };
};

export default onionify(SpreadsheetComponent);