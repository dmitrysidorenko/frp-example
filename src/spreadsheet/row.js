import React from 'react';
import xs from 'xstream';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import isolate from '@cycle/isolate';
import R, { path, identity, set, lensProp, lensPath, pipe, prop } from 'ramda';
import Cell from './cell';

const rowStyle = {
    display: 'flex',
    justifyContent: 'center',
    flexGrow: 1
};

/**
 * @param {{[number]: string}} value$
 * @param Interact
 * @param count$
 * @returns {{DOM: (MemoryStream<XML>|Stream<XML>), content$: *}}
 * @constructor
 */
export const Row = ({value$, Interact, count$}) => {
    const ids$ = count$.map(R.times(identity));
    const cellStore$ = ids$
        .map((ids) => {
            return ids.reduce((acc, id) => {
                if (!acc.cells[id]) {
                    const cell = isolate(Cell)({
                        Interact,
                        value$: value$.filter(pipe(prop('id'), R.equals(id)))
                            .map(prop(id))
                    });
                    console.debug('cell:', id, cell);
                    return set(
                        lensPath(['cells', id]),
                        {
                            ...cell,
                            content$: cell.content$.map(value => ({id, value}))
                        },
                        acc
                    );
                }
                return acc;
            }, {cells: {}})
        })
        .debug('cellStore');

    const cellContentChanges$ = cellStore$
        .map(store => store.cells)
        .debug('cells')
        .map(cells => {
            return xs.combine(...R.map(prop('content$'), cells))
        })
        .compose(flattenConcurrently);

    return {
        DOM: cellStore$.map(prop('cells'))
            .map(cells => Object.keys(cells).map(key => cells[key].DOM))
            .debug('cells')
            .map(vtrees => xs.combine(...vtrees))
            .flatten()
            .startWith([])
            .map(cells => (
                <div style={rowStyle} className="row" >{cells}</div>
            )),
        content$: cellContentChanges$.fold((acc, next) => {
            return {...acc, ...next};
        })
    };
};

export default Row;