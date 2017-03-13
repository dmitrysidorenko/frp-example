import React from 'react';
import R from 'ramda';
import Row from './row';
import Cell from './cell';

const mapIndexed = R.addIndex(R.map);

export const Spreadsheet = ({rowConfigs, state}) => (
    <div>
        {mapIndexed((cells, ri) => {
            return (
                <Row key={ri} >
                    {mapIndexed(({id, cb}, i) => (
                        <Cell
                            onInput={cb}
                            key={i}
                            value={R.path([id, 'value'], state)}
                            displayValue={R.path([id, 'displayValue'], state)} />
                    ), cells)}
                </Row>
            );
        }, rowConfigs)}
    </div>
);

export default Spreadsheet;