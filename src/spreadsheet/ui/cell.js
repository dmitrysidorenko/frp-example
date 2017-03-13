import React from 'react';
import { path } from 'ramda';

const cellStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    flexGrow: 0,
    flexBasis: '100%',
    textAlign: 'center',
    border: '1px dashed #555',
    borderWidth: '0 1px 1px 0'
};

const getValue = path(['target', 'value']);
export const Cell = ({value, displayValue, onInput}) => (
    <div style={cellStyle} className="cell" >
        <input value={value || ''} type="text" onInput={e => onInput(getValue(e))} />
        <div>{displayValue || <br/>}</div>
    </div>
);

export default Cell;