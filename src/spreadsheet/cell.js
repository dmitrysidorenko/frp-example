import React from 'react';
import { path } from 'ramda';

const cellStyle = {
    display: 'flex',
    justifyContent: 'center',
    flexGrow: 1
};

export const Cell = ({value$, Interact}) => {
    const change$ = Interact.get('input')
        .map(path(['target', 'innerText']));
    return {
        DOM: value$.startWith('c')
            .map(c => (
                <div contentEditable={true} style={cellStyle} onInput={Interact.cb('input')} className="cell" >
                    {c}
                </div>
            )),
        content$: change$
    };
};

export default Cell;